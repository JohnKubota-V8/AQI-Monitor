# IoT Stack: Mosquitto + Telegraf + InfluxDB + Node-RED

Stack สำหรับรับข้อมูลจาก ESP32 (DHT22) ผ่าน MQTT แล้วเก็บลง InfluxDB
พร้อม Node-RED ไว้ทำ dashboard / automation เพิ่มเติม

```
ESP32 --(MQTT over WS, wss://)--> Cloudflare Tunnel --> mosquitto:9001
                                                              |
                                                        (internal 1883)
                                                          /        \
                                                    telegraf      node-red
                                                        |              |
                                                    influxdb <---------+ (query/write)
```

## 1. เตรียมไฟล์ .env

```bash
cp .env.example .env
nano .env   # แก้ password/token ให้เป็นของจริง
```

สร้าง `INFLUX_TOKEN` แบบสุ่มยาวๆ ได้ด้วย:
```bash
openssl rand -hex 32
```

## 2. สร้าง mosquitto password file

ต้องสร้างก่อน compose up เพราะ mosquitto ต้องการไฟล์ `passwd` ที่ hash แล้ว

```bash
# สร้างไฟล์เปล่าก่อน (มิฉะนั้น container จะ error หาไฟล์ไม่เจอ)
touch mosquitto/config/passwd

# ใช้ mosquitto image สร้าง user (แก้ user/pass ให้ตรงกับใน .env)
docker run --rm -it \
  -v "$(pwd)/mosquitto/config:/mosquitto/config" \
  eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwd esp32user "yourpassword"
```

> ⚠️ ต้องตั้ง username/password ให้ตรงกับ `MQTT_USER` / `MQTT_PASSWORD` ใน `.env` เพราะ Telegraf จะใช้ค่านี้ login ด้วย

## 3. รัน stack

```bash
docker compose up -d
docker compose logs -f telegraf   # เช็คว่า telegraf ต่อ mqtt+influx ได้ไหม
```

Services ที่ได้:
| Service | Port (host) | หน้าที่ |
|---|---|---|
| mosquitto | 1883 (mqtt), 9001 (ws) | MQTT broker |
| influxdb | 8086 | เก็บข้อมูล + query UI |
| telegraf | - | ดึง mqtt -> เขียน influx อัตโนมัติ |
| node-red | 1880 | flow-based automation/dashboard |

## 4. ทดสอบส่งข้อมูลจำลอง

```bash
docker exec -it mosquitto mosquitto_pub \
  -h localhost -p 1883 -u esp32user -P yourpassword \
  -t "sensors/dht22" -m '{"temp":27.5,"hum":65}'
```

แล้วเช็คใน InfluxDB UI (http://localhost:8086) → Data Explorer → bucket ที่ตั้งไว้
ควรเห็น measurement ชื่อ `dht22` เข้ามา

## 5. เชื่อม Cloudflare Tunnel (สำหรับ ESP32 ยิงเข้ามาจากนอกบ้าน)

แก้ `config.yml` ของ cloudflared (คนละไฟล์ นอก stack นี้ รันบนโฮสต์เดียวกัน) เพิ่ม 2 route:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: mqtt.yourdomain.com
    service: http://localhost:9001      # mosquitto websocket
  - hostname: influx.yourdomain.com
    service: http://localhost:8086      # influxdb ui/api (ถ้าอยากเข้าถึงจากนอก)
  - hostname: nodered.yourdomain.com
    service: http://localhost:1880      # node-red editor/dashboard (ถ้าต้องการ)
  - service: http_status:404
```

```bash
cloudflared tunnel route dns influx-tunnel mqtt.yourdomain.com
cloudflared tunnel route dns influx-tunnel influx.yourdomain.com
cloudflared tunnel route dns influx-tunnel nodered.yourdomain.com
sudo systemctl restart cloudflared
```

> 💡 ถ้า Node-RED editor จะ expose ออก public ควรเปิด auth ในตัว Node-RED เองด้วย (`settings.js` -> `adminAuth`) ไม่งั้นใครเข้า domain ก็แก้ flow เราได้เลย

## 6. Node-RED — เริ่มต้นใช้งาน

1. เปิด http://localhost:1880 (หรือ domain ที่ตั้งไว้)
2. ลาก node `mqtt in` → subscribe topic `sensors/#` โดยตั้ง broker เป็น `mosquitto:1883` (ใช้ชื่อ service ใน docker network ได้เลย ไม่ต้องใช้ IP)
3. ต่อ `mqtt in` เข้า `debug` node ดู payload ที่เข้ามา
4. ถ้าอยากทำ dashboard เพิ่ม palette `node-red-dashboard` ผ่าน Manage Palette ในตัว editor

## หมายเหตุด้านความปลอดภัย

- อย่า expose port 1883/8086 ตรงๆ ออก internet — ให้ผ่าน Cloudflare Tunnel เท่านั้น (ในไฟล์ compose นี้ expose มาที่ host เพื่อความสะดวกตอน dev บนเครื่องเดียวกัน)
- ใน production ควรลบ `ports:` ของ influxdb/mosquitto ออกจาก compose แล้วให้ cloudflared เข้าถึงผ่าน docker network โดยตรงแทน (รัน cloudflared เป็น container ในเน็ตเดียวกัน) จะปลอดภัยกว่าการ bind ไปที่ host ports
- Token/Password ทั้งหมดอยู่ใน `.env` — อย่า commit ขึ้น git (ใส่ `.env` ใน `.gitignore`)
