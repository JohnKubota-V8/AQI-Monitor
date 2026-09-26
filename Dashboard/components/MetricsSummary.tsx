"use client";

import React from "react";
import { SensorReading } from "@/types/sensor";
import { getSensorStatus, getAQIColorClasses, getAQILabel } from "@/lib/sensorConfig";
import { ShieldCheck, AlertCircle, Flame, Wind, Thermometer, WifiOff, Clock } from "lucide-react";

interface MetricsSummaryProps {
  reading: SensorReading | null;
}

export function MetricsSummary({ reading }: MetricsSummaryProps) {
  const values = reading?.values;
  const pm2_5 = values?.pm2_5 ?? null;
  const pm10 = values?.pm10 ?? null;
  const temp = values?.temperature ?? null;
  const hum = values?.humidity ?? null;

  const pm25Status = getSensorStatus("pm2_5", pm2_5);
  const pm10Status = getSensorStatus("pm10", pm10);

  let overallStatus: "normal" | "warn" | "danger" | "unknown" = "normal";
  if (pm25Status === "danger" || pm10Status === "danger") {
    overallStatus = "danger";
  } else if (pm25Status === "warn" || pm10Status === "warn") {
    overallStatus = "warn";
  } else if (pm2_5 === null) {
    overallStatus = "unknown";
  }

  const colorStyle = getAQIColorClasses(overallStatus);

  // Calculate packet age and formatted timestamp string
  let isOfflineOrDown = false;
  let ageText = "";
  let formattedTimeStr = "";

  if (reading?.timestamp) {
    const d = new Date(reading.timestamp);
    if (!isNaN(d.getTime())) {
      formattedTimeStr = `${d.toLocaleTimeString("th-TH")} (${d.toLocaleDateString("th-TH")})`;
      const ageMs = Date.now() - d.getTime();
      const ageMin = Math.floor(ageMs / (1000 * 60));
      
      if (ageMin > 5) {
        isOfflineOrDown = true;
        const hours = Math.floor(ageMin / 60);
        const mins = ageMin % 60;
        ageText = hours > 0 ? `${hours} ชั่วโมง ${mins} นาทีที่แล้ว` : `${mins} นาทีที่แล้ว`;
      }
    }
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-lg p-3.5 sm:p-5 relative overflow-hidden transition-colors shadow-sm space-y-3.5">
      {/* Prominent ESP Down / Stale Data Alert Bar */}
      {isOfflineOrDown && (
        <div
          role="status"
          className="w-full bg-rose-500/10 border border-rose-500/30 rounded-md px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-rose-700 dark:text-rose-300"
        >
          <div className="flex items-center gap-2 font-bold">
            <WifiOff className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <span>สถานะเซนเซอร์: ESP Down (ขาดการเชื่อมต่อ)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              แสดงข้อมูลย้อนหลังล่าสุดเมื่อ: <strong className="text-rose-700 dark:text-rose-300">{formattedTimeStr}</strong> ({ageText})
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 divide-y sm:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800/80">
        {/* Main AQI Overall Status */}
        <div className="flex items-center gap-3 pr-0 md:pr-4">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center ${colorStyle.badge} ${colorStyle.glow} shrink-0`}
          >
            {overallStatus === "danger" ? (
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400" />
            ) : overallStatus === "warn" ? (
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] font-mono tracking-wider text-zinc-500 uppercase truncate">
              คุณภาพอากาศ (AIR QUALITY)
            </div>
            <div className={`text-sm sm:text-base font-bold tracking-tight truncate ${colorStyle.text}`}>
              {getAQILabel(overallStatus)}
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-mono mt-0.5 truncate">
              PM2.5 = {pm2_5 !== null ? `${pm2_5} µg/m³` : "--"}
            </div>
          </div>
        </div>

        {/* PM Fine Particulate Ratio */}
        <div className="pt-3 sm:pt-0 pl-0 md:pl-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] font-mono tracking-wider text-zinc-500 uppercase flex items-center gap-1.5 truncate">
              <Wind className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>ฝุ่นจิ๋ว PM1 / PM2.5</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 truncate">
              {values?.pm1 ?? "--"}{" "}
              <span className="text-xs text-zinc-400 font-normal">/</span> {pm2_5 ?? "--"}{" "}
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">µg/m³</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate">
              อัตราส่วน PM1/PM2.5: {pm2_5 && values?.pm1 ? `${((values.pm1 / pm2_5) * 100).toFixed(0)}%` : "--"}
            </div>
          </div>
        </div>

        {/* Ambient Temperature */}
        <div className="pt-3 sm:pt-0 pl-0 md:pl-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] font-mono tracking-wider text-zinc-500 uppercase flex items-center gap-1.5 truncate">
              <Thermometer className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>อุณหภูมิ (Temperature)</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 truncate">
              {temp !== null ? `${temp.toFixed(1)}` : "--"}{" "}
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">°C</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate">
              สภาวะ: {temp !== null && temp > 33 ? "ค่อนข้างร้อน" : "ปกติ"}
            </div>
          </div>
        </div>

        {/* Relative Humidity */}
        <div className="pt-3 sm:pt-0 pl-0 md:pl-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] font-mono tracking-wider text-zinc-500 uppercase flex items-center gap-1.5 truncate">
              <DropletsIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>ความชื้น (Humidity)</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 truncate">
              {hum !== null ? `${hum}` : "--"}{" "}
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">%RH</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate">
              จุดน้ำค้าง (Dew Point): {temp !== null && hum !== null ? `${(temp - (100 - hum) / 5).toFixed(1)}°C` : "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropletsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  );
}
