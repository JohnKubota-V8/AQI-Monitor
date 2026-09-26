import { InfluxDB } from "@influxdata/influxdb-client";
import { SensorReading, SensorHistoryPoint, SensorKey } from "@/types/sensor";

export const INFLUX_URL = process.env.INFLUXDB_URL || "https://influxdb.milkbor.me";
export const INFLUX_TOKEN = process.env.INFLUXDB_TOKEN || "";
export const INFLUX_ORG = process.env.INFLUXDB_ORG || "my-org";
export const INFLUX_BUCKET = process.env.INFLUXDB_BUCKET || "MQTTProject";
export const INFLUX_MEASUREMENT = process.env.INFLUXDB_MEASUREMENT || "dht22,sps30";

// Dynamic Field Mappings from ENV (comma-separated)
const tempFields = (process.env.INFLUXDB_FIELD_TEMP || "temp,temperature")
  .split(",")
  .map((s) => s.trim().toLowerCase());
const humidFields = (process.env.INFLUXDB_FIELD_HUMID || "humid,humidity,hum")
  .split(",")
  .map((s) => s.trim().toLowerCase());
const pm1Fields = (process.env.INFLUXDB_FIELD_PM1 || "pm1,pm1.0,mc_1_0")
  .split(",")
  .map((s) => s.trim().toLowerCase());
const pm25Fields = (process.env.INFLUXDB_FIELD_PM25 || "pm2.5,pm2_5,mc_2_5")
  .split(",")
  .map((s) => s.trim().toLowerCase());
const pm4Fields = (process.env.INFLUXDB_FIELD_PM4 || "pm4,pm4.0,mc_4_0")
  .split(",")
  .map((s) => s.trim().toLowerCase());
const pm10Fields = (process.env.INFLUXDB_FIELD_PM10 || "pm10,mc_10_0")
  .split(",")
  .map((s) => s.trim().toLowerCase());

const allowMock = process.env.ALLOW_MOCK_FALLBACK !== "false";

let client: InfluxDB | null = null;

if (INFLUX_TOKEN && INFLUX_URL) {
  try {
    client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
  } catch (err) {
    console.warn("InfluxDB client initialization warning:", err);
  }
}

// Helper to round value to 2 decimal places
function round2(val: any): number | null {
  if (val === null || val === undefined) return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  return isNaN(num) ? null : parseFloat(num.toFixed(2));
}

// Build Flux measurement filter string dynamically
function buildMeasurementFilter(measurementsStr: string): string {
  const list = measurementsStr
    .split(",")
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && s !== "*" && s.toLowerCase() !== "all");
  if (list.length === 0) return 'r._measurement != ""';
  return list.map((m) => `r._measurement == "${m}"`).join(" or ");
}

// Simulated fallback data generator with 2 decimal precision
function generateSimulatedLatest(): SensorReading {
  const now = new Date();
  const nowStr = now.toISOString();
  const timeSec = now.getTime() / 1000;
  
  const tempBase = 28.52 + 3.54 * Math.sin(timeSec / 3600);
  const tempJitter = (Math.random() - 0.5) * 0.42;
  
  const humBase = 62.35 - 8.15 * Math.sin(timeSec / 3600);
  const humJitter = (Math.random() - 0.5) * 1.55;

  const pm25Base = 18.25 + 12.35 * Math.sin((timeSec + 1000) / 1800);
  const pm25Jitter = (Math.random() - 0.5) * 2.12;
  const pm25Val = Math.max(2, parseFloat((pm25Base + pm25Jitter).toFixed(2)));

  return {
    timestamp: nowStr,
    status: "online",
    device: "ESP32-DHT22-SPS30 (Simulated)",
    values: {
      temperature: parseFloat((tempBase + tempJitter).toFixed(2)),
      humidity: parseFloat(Math.min(100, Math.max(10, humBase + humJitter)).toFixed(2)),
      pm1: parseFloat((pm25Val * 0.65).toFixed(2)),
      pm2_5: pm25Val,
      pm4: parseFloat((pm25Val * 1.35).toFixed(2)),
      pm10: parseFloat((pm25Val * 1.85).toFixed(2)),
    },
    fieldTimestamps: {
      temperature: nowStr,
      humidity: nowStr,
      pm1: nowStr,
      pm2_5: nowStr,
      pm4: nowStr,
      pm10: nowStr,
    },
  };
}

export async function fetchLatestSensorData(): Promise<{
  data: SensorReading;
  isSimulated: boolean;
  error?: string;
}> {
  if (!client || !INFLUX_TOKEN) {
    if (allowMock) {
      return { data: generateSimulatedLatest(), isSimulated: true };
    }
    return {
      data: {
        timestamp: new Date().toISOString(),
        status: "offline",
        device: `InfluxDB (${INFLUX_URL}) - Token Missing`,
        values: {
          temperature: null,
          humidity: null,
          pm1: null,
          pm2_5: null,
          pm4: null,
          pm10: null,
        },
      },
      isSimulated: false,
      error: `INFLUXDB_TOKEN is missing in .env.local for ${INFLUX_URL}.`,
    };
  }

  const queryApi = client.getQueryApi(INFLUX_ORG);
  const measurementFilter = buildMeasurementFilter(INFLUX_MEASUREMENT);

  const fluxQuery = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -30d)
      |> filter(fn: (r) => ${measurementFilter})
      |> last()
  `;

  try {
    const values: Record<SensorKey, number | null> = {
      temperature: null,
      humidity: null,
      pm1: null,
      pm2_5: null,
      pm4: null,
      pm10: null,
    };
    const fieldTimestamps: Record<SensorKey, string | null> = {
      temperature: null,
      humidity: null,
      pm1: null,
      pm2_5: null,
      pm4: null,
      pm10: null,
    };
    let lastTime = new Date().toISOString();
    let maxTimeMs = 0;
    let rowsReceived = 0;

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          rowsReceived++;

          const rowTimeStr = o._time ? o._time.toString() : "";
          const rowTimeMs = rowTimeStr ? new Date(rowTimeStr).getTime() : 0;

          if (rowTimeMs > maxTimeMs) {
            maxTimeMs = rowTimeMs;
            lastTime = rowTimeStr;
          }

          const field = (o._field || "").toString().toLowerCase();
          const val = round2(o._value);

          const updateFieldIfNewer = (key: SensorKey, value: number | null) => {
            const existingTsMs = fieldTimestamps[key] ? new Date(fieldTimestamps[key]!).getTime() : 0;
            if (rowTimeMs >= existingTsMs) {
              values[key] = value;
              fieldTimestamps[key] = rowTimeStr || lastTime;
            }
          };

          if (tempFields.includes(field)) updateFieldIfNewer("temperature", val);
          else if (humidFields.includes(field)) updateFieldIfNewer("humidity", val);
          else if (pm1Fields.includes(field)) updateFieldIfNewer("pm1", val);
          else if (pm25Fields.includes(field)) updateFieldIfNewer("pm2_5", val);
          else if (pm4Fields.includes(field)) updateFieldIfNewer("pm4", val);
          else if (pm10Fields.includes(field)) updateFieldIfNewer("pm10", val);
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve();
        },
      });
    });

    if (rowsReceived === 0) {
      if (allowMock) {
        return { data: generateSimulatedLatest(), isSimulated: true };
      }
      return {
        data: {
          timestamp: new Date().toISOString(),
          status: "offline",
          device: `InfluxDB (${INFLUX_BUCKET}) - No Measurements Found`,
          values,
          fieldTimestamps,
        },
        isSimulated: false,
        error: `No data points found in bucket "${INFLUX_BUCKET}" matching filter (${INFLUX_MEASUREMENT}) on ${INFLUX_URL} within last 30d.`,
      };
    }

    // Determine device online status based on packet age
    const ageMinutes = (Date.now() - new Date(lastTime).getTime()) / (1000 * 60);
    let status: "online" | "stale" | "offline" = "online";
    if (ageMinutes > 15) {
      status = "offline";
    } else if (ageMinutes > 5) {
      status = "stale";
    }

    return {
      data: {
        timestamp: lastTime,
        status,
        device: status === "offline"
          ? `ESP32 Down (ข้อมูลล่าสุดเมื่อ ${new Date(lastTime).toLocaleTimeString("th-TH")})`
          : `ESP32 / InfluxDB (${INFLUX_BUCKET} • ${INFLUX_MEASUREMENT})`,
        values,
        fieldTimestamps,
      },
      isSimulated: false,
    };
  } catch (err: any) {
    console.warn("InfluxDB query error:", err);
    if (allowMock) {
      return { data: generateSimulatedLatest(), isSimulated: true };
    }
    return {
      data: {
        timestamp: new Date().toISOString(),
        status: "offline",
        device: `InfluxDB Connection Failed (${INFLUX_URL})`,
        values: {
          temperature: null,
          humidity: null,
          pm1: null,
          pm2_5: null,
          pm4: null,
          pm10: null,
        },
      },
      isSimulated: false,
      error: err.message || `Failed to connect to InfluxDB at ${INFLUX_URL}`,
    };
  }
}

// Simulated history generator
function generateSimulatedHistory(range: string): SensorHistoryPoint[] {
  const points: SensorHistoryPoint[] = [];
  let numPoints = 24;
  let intervalMs = 60 * 60 * 1000;

  if (range === "1h") {
    numPoints = 20;
    intervalMs = 3 * 60 * 1000;
  } else if (range === "6h") {
    numPoints = 24;
    intervalMs = 15 * 60 * 1000;
  } else if (range === "7d") {
    numPoints = 28;
    intervalMs = 6 * 60 * 60 * 1000;
  }

  const now = Date.now();
  const startTime = now - numPoints * intervalMs;

  for (let i = 0; i < numPoints; i++) {
    const ptTime = new Date(startTime + i * intervalMs);
    const tSec = ptTime.getTime() / 1000;

    const temp = 27.25 + 4.15 * Math.sin((tSec - 28000) / 14000) + (Math.random() - 0.5) * 0.5;
    const hum = 65.45 - 12.25 * Math.sin((tSec - 28000) / 14000) + (Math.random() - 0.5) * 1.5;
    
    const pm25Base = 16.35 + 14.25 * Math.sin(tSec / 7200);
    const pm25 = Math.max(3, parseFloat((pm25Base + (Math.random() - 0.5) * 3).toFixed(2)));

    points.push({
      timestamp: ptTime.toISOString(),
      temperature: parseFloat(temp.toFixed(2)),
      humidity: parseFloat(Math.min(100, Math.max(20, hum)).toFixed(2)),
      pm1: parseFloat((pm25 * 0.62).toFixed(2)),
      pm2_5: pm25,
      pm4: parseFloat((pm25 * 1.32).toFixed(2)),
      pm10: parseFloat((pm25 * 1.82).toFixed(2)),
    });
  }

  return points;
}

export async function fetchSensorHistory(
  range: string = "24h"
): Promise<{ data: SensorHistoryPoint[]; isSimulated: boolean; error?: string }> {
  if (!client || !INFLUX_TOKEN) {
    if (allowMock) {
      return { data: generateSimulatedHistory(range), isSimulated: true };
    }
    return { data: [], isSimulated: false, error: "INFLUXDB_TOKEN missing." };
  }

  const fluxRange = range === "1h" ? "-1h" : range === "6h" ? "-6h" : range === "7d" ? "-7d" : range === "30d" ? "-30d" : "-24h";
  const windowEvery = range === "1h" ? "2m" : range === "6h" ? "10m" : range === "7d" ? "2h" : range === "30d" ? "12h" : "15m";

  const queryApi = client.getQueryApi(INFLUX_ORG);
  const measurementFilter = buildMeasurementFilter(INFLUX_MEASUREMENT);

  const fluxQuery = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: ${fluxRange})
      |> filter(fn: (r) => ${measurementFilter})
      |> aggregateWindow(every: ${windowEvery}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  try {
    const timeMap: Record<string, Partial<SensorHistoryPoint>> = {};

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          if (!o._time) return;

          const timeKey = o._time;
          if (!timeMap[timeKey]) {
            timeMap[timeKey] = { timestamp: timeKey };
          }

          const field = (o._field || "").toString().toLowerCase();
          const val = round2(o._value);

          if (tempFields.includes(field)) timeMap[timeKey].temperature = val;
          else if (humidFields.includes(field)) timeMap[timeKey].humidity = val;
          else if (pm1Fields.includes(field)) timeMap[timeKey].pm1 = val;
          else if (pm25Fields.includes(field)) timeMap[timeKey].pm2_5 = val;
          else if (pm4Fields.includes(field)) timeMap[timeKey].pm4 = val;
          else if (pm10Fields.includes(field)) timeMap[timeKey].pm10 = val;
        },
        error(err) {
          reject(err);
        },
        complete() {
          resolve();
        },
      });
    });

    const result = Object.values(timeMap) as SensorHistoryPoint[];
    if (result.length === 0) {
      if (allowMock) {
        return { data: generateSimulatedHistory(range), isSimulated: true };
      }
      return { data: [], isSimulated: false, error: `No history data found in bucket "${INFLUX_BUCKET}" for range ${range}.` };
    }

    result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return { data: result, isSimulated: false };
  } catch (err: any) {
    console.warn("InfluxDB history query error:", err);
    if (allowMock) {
      return { data: generateSimulatedHistory(range), isSimulated: true };
    }
    return { data: [], isSimulated: false, error: err.message || "Failed to query history" };
  }
}
