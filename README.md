# ESP32 Air Quality Monitor

ระบบวัดอุณหภูมิและความชื้นด้วย ESP32 + DHT22 ส่งข้อมูลผ่าน MQTT ไปเก็บใน InfluxDB และแสดงผลด้วย Next.js dashboard

## โครงสร้าง

```
ESP32 + DHT22 -- MQTT over WebSocket --> Mosquitto --> Telegraf --> InfluxDB
                                                                    |
                                                               Dashboard
```

| โฟลเดอร์ | หน้าที่ |
| --- | --- |
| `MiniProject/` | ESP32 sketch สำหรับอ่าน DHT22, แสดง OLED และ publish MQTT |
| `iot-stack/` | Mosquitto, Telegraf และ Node-RED ผ่าน Docker Compose |
| `Dashboard/` | Next.js dashboard สำหรับอ่านข้อมูลจาก InfluxDB |

## ฮาร์ดแวร์

| อุปกรณ์ | ขา ESP32 |
| --- | --- |
| DHT22 data | GPIO 25 |
| OLED SDA | GPIO 21 |
| OLED SCL | GPIO 22 |

SPS30 มีโค้ดเตรียมไว้ใน `MiniProject/MiniProject.ino` แต่ยังถูก comment อยู่ จึงยังไม่อ่านหรือ publish ค่า PM2.5 ในเวอร์ชันปัจจุบัน

## เริ่มต้นใช้งาน

### 1. ตั้งค่า ESP32

คัดลอกไฟล์ตัวอย่างแล้วใส่ Wi-Fi และ MQTT credentials ของคุณ:

```bash
cp MiniProject/secrets.example.h MiniProject/secrets.h
```

เปิด `MiniProject/MiniProject.ino` ด้วย Arduino IDE แล้วอัปโหลดไปยัง ESP32

`secrets.h` ถูก ignore โดย Git ห้าม commit ไฟล์นี้

ตั้งค่า `MQTT_URI`, `MQTT_TOPIC` และ static IP ใน `MiniProject.ino` ให้ตรงกับระบบของคุณ โดย topic ค่าเริ่มต้นของสเก็ตช์คือ `home/bedroom/temp_humid`

### 2. รัน MQTT และ Telegraf

```bash
cd iot-stack
cp .env.example .env
```

แก้ `INFLUX_TOKEN`, `INFLUX_ORG`, `INFLUX_BUCKET`, `MQTT_USER` และ `MQTT_PASSWORD` ใน `.env` แล้วสร้าง password file โดยใช้ username/password ชุดเดียวกัน:

```bash
touch mosquitto/config/passwd
docker run --rm -it -v "$(pwd)/mosquitto/config:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwd your-mqtt-user "your-mqtt-password"
docker compose up -d
docker compose logs -f telegraf
```

แก้ `topics` ใน `iot-stack/telegraf/telegraf.conf` ให้ตรงกับ `MQTT_TOPIC` ของ ESP32 ก่อนรัน. ค่าในไฟล์ปัจจุบันคือ `sensors/#` ซึ่งไม่ตรงกับ topic ค่าเริ่มต้นของสเก็ตช์

### 3. รัน Dashboard

ต้องมี Node.js 20+ และ InfluxDB token ที่มีสิทธิ์อ่าน bucket:

```bash
cd Dashboard
cp .env.example .env.local
npm ci
npm run dev
```

แก้ `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG` และ `INFLUXDB_BUCKET` ใน `Dashboard/.env.local` แล้วเปิด `http://localhost:3000`

## รูปแบบข้อมูล MQTT

ESP32 publish ทุก 30 วินาที โดย payload มีรูปแบบ:

```json
{"temp": 27.5, "humid": 65.0}
```

## ความปลอดภัย

- ห้าม commit `MiniProject/secrets.h`, `.env`, `.env.local` หรือ `mosquitto/config/passwd`
- ใช้ MQTT password ที่รัดกุม และปิด anonymous access ไว้เสมอ
- อย่า expose MQTT port 1883, Node-RED หรือ InfluxDB ออกอินเทอร์เน็ตโดยตรง
- หากเคยเผยแพร่ credential ให้เปลี่ยน Wi-Fi password, MQTT password และ InfluxDB token ใหม่

## คำสั่งตรวจสอบ

```bash
cd Dashboard
npm run lint
npm run build
```
