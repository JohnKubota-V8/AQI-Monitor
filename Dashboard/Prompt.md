# Prompt: Sensor Dashboard (Next.js + InfluxDB + Docker)

## 1. เป้าหมายของโปรเจกต์

สร้างเว็บแอปแดชบอร์ดแสดงค่าจากเซนเซอร์คุณภาพอากาศแบบ real-time (near real-time ผ่าน polling) โดยดึงข้อมูลจาก InfluxDB

**ค่าที่ต้องแสดงผล:**
- `temperature` (°C) — มีอยู่แล้ว
- `humidity` (%RH) — มีอยู่แล้ว
- `pm1` (µg/m³) — ต้องเพิ่มใหม่
- `pm2.5` (µg/m³) — ต้องเพิ่มใหม่
- `pm4` (µg/m³) — ต้องเพิ่มใหม่
- `pm10` (µg/m³) — ต้องเพิ่มใหม่

**หลักการออกแบบ:** เขียน component ให้ generic/reusable ตั้งแต่แรก เพื่อให้การเพิ่มค่า pm1/pm2.5/pm4/pm10 (และค่าถัดๆ ไปในอนาคต) ทำได้โดยแก้แค่ config ไม่ต้องเขียน component ใหม่ทุกครั้ง

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 14+ (App Router) |
| ภาษา | TypeScript |
| Styling | Tailwind CSS |
| Chart | Recharts |
| Data source | InfluxDB (Flux query language) — ใช้ `@influxdata/influxdb-client` |
| Deployment | Docker (multi-stage build) |
| Data fetching | Server-side API Route + client-side polling (SWR หรือ React Query) |

---

## 3. โครงสร้างโปรเจกต์ (แนะนำ)

```
sensor-dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # หน้าแดชบอร์ดหลัก
│   └── api/
│       └── sensors/
│           └── latest/route.ts  # API ดึงค่าล่าสุดจาก InfluxDB
│           └── history/route.ts # API ดึงข้อมูลย้อนหลัง (สำหรับกราฟ)
├── components/
│   ├── SensorCard.tsx           # การ์ดแสดงค่าตัวเดียว (reusable)
│   ├── SensorGrid.tsx           # จัดเรียง SensorCard หลายตัว
│   ├── SensorChart.tsx          # กราฟย้อนหลังของแต่ละค่า
│   └── StatusBadge.tsx          # แสดงสถานะ online/offline ของเซนเซอร์
├── lib/
│   ├── influxdb.ts              # client + query functions
│   └── sensorConfig.ts          # config รายการเซนเซอร์ทั้งหมด (ตรงนี้คือจุดขยาย)
├── types/
│   └── sensor.ts                # type definitions
├── Dockerfile
├── docker-compose.yml           # (optional) สำหรับรัน dev/prod พร้อม InfluxDB
├── .env.example
└── package.json
```

---

## 4. Config-driven Sensor List (จุดสำคัญที่สุด)

สร้างไฟล์ `lib/sensorConfig.ts` เป็น single source of truth เพื่อให้เพิ่ม/ลดค่าที่แสดงได้โดยไม่แตะ component:

```ts
export type SensorKey = "temperature" | "humidity" | "pm1" | "pm2_5" | "pm4" | "pm10";

export interface SensorMeta {
  key: SensorKey;
  label: string;
  unit: string;
  fluxField: string;       // ชื่อ field จริงใน InfluxDB
  decimals: number;
  thresholds?: { warn: number; danger: number }; // สำหรับ PM ใช้ AQI-like coloring
  icon: string;             // ชื่อ icon (เช่นจาก lucide-react)
}

export const SENSORS: SensorMeta[] = [
  { key: "temperature", label: "อุณหภูมิ", unit: "°C", fluxField: "temperature", decimals: 1, icon: "Thermometer" },
  { key: "humidity",    label: "ความชื้น", unit: "%",  fluxField: "humidity",    decimals: 0, icon: "Droplets" },
  { key: "pm1",         label: "PM1",      unit: "µg/m³", fluxField: "pm1",     decimals: 1, thresholds: { warn: 15, danger: 35 }, icon: "Wind" },
  { key: "pm2_5",       label: "PM2.5",    unit: "µg/m³", fluxField: "pm2.5",   decimals: 1, thresholds: { warn: 15, danger: 35 }, icon: "Wind" },
  { key: "pm4",         label: "PM4",      unit: "µg/m³", fluxField: "pm4",     decimals: 1, thresholds: { warn: 30, danger: 60 }, icon: "Wind" },
  { key: "pm10",        label: "PM10",     unit: "µg/m³", fluxField: "pm10",    decimals: 1, thresholds: { warn: 50, danger: 100 }, icon: "Wind" },
];
```

จากนั้น `SensorGrid.tsx` แค่ `SENSORS.map(meta => <SensorCard meta={meta} value={...} />)` — ไม่ต้อง hardcode ค่าใดๆ

---

## 5. Component ที่ต้องสร้าง

### 5.1 `SensorCard.tsx`
- รับ props: `meta: SensorMeta`, `value: number | null`, `timestamp: string`
- แสดง: label, ค่าปัจจุบัน + หน่วย, ไอคอน, สถานะสี (ปกติ/เตือน/อันตราย ตาม `thresholds`)
- แสดง "no data" / skeleton loading ถ้า `value` เป็น null หรือกำลังโหลด
- ถ้า timestamp เก่ากว่า X นาที → แสดง badge "offline"

### 5.2 `SensorGrid.tsx`
- Layout แบบ responsive grid (เช่น 2 คอลัมน์บนมือถือ, 3-6 คอลัมน์บนจอใหญ่)
- Loop ผ่าน `SENSORS` config และดึงค่าจาก API มา map เข้าแต่ละ `SensorCard`

### 5.3 `SensorChart.tsx`
- กราฟเส้นแสดงค่าย้อนหลัง (เช่น 24 ชม. ล่าสุด) ต่อค่าหนึ่งตัว หรือ toggle ดูหลายค่าพร้อมกัน
- ใช้ Recharts `LineChart`
- รับ time range เป็น prop (1h / 24h / 7d) เพื่อเปลี่ยนช่วงเวลา query

### 5.4 `StatusBadge.tsx`
- แสดงสถานะเซนเซอร์โดยรวม (online/offline) จาก timestamp ล่าสุดที่ได้รับ

### 5.5 หน้า `page.tsx`
- ประกอบ `SensorGrid` (ค่าล่าสุด) + `SensorChart` (กราฟย้อนหลัง) เข้าด้วยกัน
- ใช้ polling ทุก N วินาที (เช่น 10-30s) ด้วย SWR: `useSWR('/api/sensors/latest', fetcher, { refreshInterval: 15000 })`

---

## 6. การดึงข้อมูลจาก InfluxDB

### 6.1 `lib/influxdb.ts`
```ts
import { InfluxDB } from "@influxdata/influxdb-client";

const client = new InfluxDB({
  url: process.env.INFLUXDB_URL!,
  token: process.env.INFLUXDB_TOKEN!,
});

export const queryApi = client.getQueryApi(process.env.INFLUXDB_ORG!);
```

### 6.2 Flux query ตัวอย่าง — ดึงค่าล่าสุดของทุก field
```flux
from(bucket: "sensors")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "air_quality")
  |> last()
```

### 6.3 Flux query ตัวอย่าง — ดึงข้อมูลย้อนหลังสำหรับกราฟ
```flux
from(bucket: "sensors")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "air_quality")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
```

### 6.4 API Routes
- `GET /api/sensors/latest` → คืนค่าปัจจุบันของทุกฟิลด์ตาม `SENSORS` config พร้อม timestamp
- `GET /api/sensors/history?range=24h&fields=pm2_5,pm10` → คืน time-series สำหรับกราฟ

**หมายเหตุ:** query ควรทำที่ server-side (API Route หรือ Server Component) เท่านั้น อย่าเปิด InfluxDB token ให้ client เห็นเด็ดขาด

---

## 7. Environment Variables (`.env.example`)

```
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token-here
INFLUXDB_ORG=your-org
INFLUXDB_BUCKET=sensors
```

---

## 8. Docker

### 8.1 `Dockerfile` (multi-stage build)
```dockerfile
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```
> ต้องตั้ง `output: "standalone"` ใน `next.config.js` เพื่อให้ image เล็กและรันได้แบบ self-contained

### 8.2 `docker-compose.yml` (สำหรับรันคู่กับ InfluxDB ตอน dev)
```yaml
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - influxdb
  influxdb:
    image: influxdb:2.7
    ports:
      - "8086:8086"
    volumes:
      - influxdb-data:/var/lib/influxdb2
volumes:
  influxdb-data:
```

---

## 9. Checklist การพัฒนา (ทำตามลำดับ)

1. [ ] สร้างโปรเจกต์ Next.js + TypeScript + Tailwind
2. [ ] เขียน `types/sensor.ts` และ `lib/sensorConfig.ts`
3. [ ] เขียน `lib/influxdb.ts` + ทดสอบ query ด้วยข้อมูล temperature/humidity ที่มีอยู่
4. [ ] สร้าง API Route `/api/sensors/latest`
5. [ ] สร้าง `SensorCard` + `SensorGrid` แสดงผล temperature/humidity ก่อน (ของเดิม)
6. [ ] เพิ่ม field pm1/pm2.5/pm4/pm10 เข้า `sensorConfig.ts` — ตรวจว่า UI แสดงเพิ่มอัตโนมัติโดยไม่แก้ component
7. [ ] สร้าง API Route `/api/sensors/history` + `SensorChart`
8. [ ] ใส่ polling (SWR) + loading/offline state
9. [ ] ตั้งค่า `output: "standalone"`, เขียน `Dockerfile`, build image, ทดสอบรันจริง
10. [ ] (optional) เพิ่ม threshold coloring ตามมาตรฐาน AQI สำหรับค่า PM

---

## 10. ประเด็นที่ควรตัดสินใจเพิ่มเติม (ถามผู้ใช้ถ้ายังไม่ชัดเจน)

- Schema ของ InfluxDB ปัจจุบันเป็นอย่างไร (measurement name, field names ตรงกับ `fluxField` ในตัวอย่างหรือไม่, มี tag แยกตาม device/location หรือไม่)
- มีเซนเซอร์กี่ตัว/กี่จุดติดตั้ง — ถ้ามีหลายจุด ต้องออกแบบให้เลือก device ได้ด้วย
- ต้องการ authentication สำหรับหน้าเว็บหรือไม่
- ต้องการแจ้งเตือน (เช่น line notify) เมื่อค่า PM เกิน threshold หรือไม่
