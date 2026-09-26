export type SensorKey = "temperature" | "humidity" | "pm1" | "pm2_5" | "pm4" | "pm10";

export interface Thresholds {
  warn: number;
  danger: number;
}

export interface SensorMeta {
  key: SensorKey;
  label: string;
  unit: string;
  fluxField: string;
  decimals: number;
  thresholds?: Thresholds;
  icon: "Thermometer" | "Droplets" | "Wind" | "Activity" | "Cloud" | "Zap";
  color: string;
  description: string;
  normalRange: string;
}

export interface SensorReading {
  timestamp: string;
  values: Record<SensorKey, number | null>;
  fieldTimestamps?: Record<SensorKey, string | null>;
  status: "online" | "stale" | "offline";
  device: string;
}

export interface SensorHistoryPoint {
  timestamp: string;
  temperature?: number | null;
  humidity?: number | null;
  pm1?: number | null;
  pm2_5?: number | null;
  pm4?: number | null;
  pm10?: number | null;
}

export interface SystemStatus {
  isInfluxConnected: boolean;
  isSimulated: boolean;
  lastSync: string;
  totalDataPoints: number;
  sensorDevice: string;
  pollingIntervalSeconds: number;
}
