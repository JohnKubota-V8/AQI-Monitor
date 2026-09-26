import { SensorMeta, SensorKey } from "@/types/sensor";

export const SENSORS: SensorMeta[] = [
  {
    key: "temperature",
    label: "อุณหภูมิ (Temp)",
    unit: "°C",
    fluxField: "temperature",
    decimals: 2,
    color: "#f97316", // Amber
    thresholds: { warn: 33, danger: 38 },
    icon: "Thermometer",
    description: "DHT22 Ambient Temperature Sensor",
    normalRange: "20 - 32 °C",
  },
  {
    key: "humidity",
    label: "ความชื้น (Humidity)",
    unit: "%RH",
    fluxField: "humidity",
    decimals: 2,
    color: "#06b6d4", // Cyan
    thresholds: { warn: 70, danger: 85 },
    icon: "Droplets",
    description: "DHT22 Relative Humidity Sensor",
    normalRange: "40 - 65 %RH",
  },
  {
    key: "pm1",
    label: "ฝุ่น PM1.0",
    unit: "µg/m³",
    fluxField: "pm1",
    decimals: 2,
    color: "#2563eb", // Blue
    thresholds: { warn: 15, danger: 35 },
    icon: "Wind",
    description: "SPS30 Ultra-fine Particulate Matter",
    normalRange: "< 15 µg/m³",
  },
  {
    key: "pm2_5",
    label: "ฝุ่น PM2.5",
    unit: "µg/m³",
    fluxField: "pm2.5",
    decimals: 2,
    color: "#059669", // Emerald
    thresholds: { warn: 15, danger: 37.5 },
    icon: "Wind",
    description: "SPS30 Fine Particulate Matter",
    normalRange: "< 15 µg/m³ (Standard)",
  },
  {
    key: "pm4",
    label: "ฝุ่น PM4.0",
    unit: "µg/m³",
    fluxField: "pm4",
    decimals: 2,
    color: "#9333ea", // Purple
    thresholds: { warn: 30, danger: 60 },
    icon: "Wind",
    description: "SPS30 Medium Particulate Matter",
    normalRange: "< 30 µg/m³",
  },
  {
    key: "pm10",
    label: "ฝุ่น PM10",
    unit: "µg/m³",
    fluxField: "pm10",
    decimals: 2,
    color: "#e11d48", // Rose
    thresholds: { warn: 50, danger: 100 },
    icon: "Wind",
    description: "SPS30 Coarse Particulate Matter",
    normalRange: "< 50 µg/m³",
  },
];

export const SENSORS_BY_KEY: Record<SensorKey, SensorMeta> = SENSORS.reduce(
  (acc, sensor) => {
    acc[sensor.key] = sensor;
    return acc;
  },
  {} as Record<SensorKey, SensorMeta>
);

export function getSensorStatus(
  key: SensorKey,
  value: number | null
): "normal" | "warn" | "danger" | "unknown" {
  if (value === null || value === undefined) return "unknown";
  const sensor = SENSORS_BY_KEY[key];
  if (!sensor || !sensor.thresholds) return "normal";

  if (value >= sensor.thresholds.danger) return "danger";
  if (value >= sensor.thresholds.warn) return "warn";
  return "normal";
}

export function getAQIColorClasses(status: "normal" | "warn" | "danger" | "unknown") {
  switch (status) {
    case "normal":
      return {
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
        indicator: "bg-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
        glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]",
      };
    case "warn":
      return {
        badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
        indicator: "bg-amber-500",
        text: "text-amber-600 dark:text-amber-400",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]",
      };
    case "danger":
      return {
        badge: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
        indicator: "bg-rose-500 animate-pulse",
        text: "text-rose-600 dark:text-rose-400",
        glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
      };
    default:
      return {
        badge: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
        indicator: "bg-zinc-400 dark:bg-zinc-600",
        text: "text-zinc-600 dark:text-zinc-400",
        glow: "",
      };
  }
}

export function getAQILabel(status: "normal" | "warn" | "danger" | "unknown") {
  switch (status) {
    case "normal":
      return "ดีเยี่ยม (Normal)";
    case "warn":
      return "ปานกลาง (Warning)";
    case "danger":
      return "เริ่มมีผลกระทบ (Hazardous)";
    default:
      return "ไม่มีข้อมูล (No Data)";
  }
}
