"use client";

import React from "react";
import { SensorMeta } from "@/types/sensor";
import { getSensorStatus, getAQIColorClasses } from "@/lib/sensorConfig";
import { Thermometer, Droplets, Wind, Activity, Clock } from "lucide-react";

interface SensorCardProps {
  meta: SensorMeta;
  value: number | null;
  timestamp?: string | null;
  loading?: boolean;
}

const ICON_MAP = {
  Thermometer,
  Droplets,
  Wind,
  Activity,
};

export function SensorCard({ meta, value, timestamp, loading = false }: SensorCardProps) {
  const IconComponent = (ICON_MAP as any)[meta.icon] || Wind;

  const status = getSensorStatus(meta.key, value);
  const colorStyle = getAQIColorClasses(status);

  const maxScale = meta.thresholds ? meta.thresholds.danger * 1.25 : meta.key === "humidity" ? 100 : 50;
  const progressPercent = value !== null ? Math.min(100, Math.max(0, (value / maxScale) * 100)) : 0;

  const formattedValue =
    value !== null && value !== undefined
      ? value.toFixed(meta.decimals)
      : null;

  // Format timestamp and calculate age status
  let timeStr = "";
  let isStale = false;
  if (value !== null && timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      timeStr = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const ageMs = Date.now() - d.getTime();
      if (ageMs > 5 * 60 * 1000) {
        isStale = true;
      }
    }
  }

  return (
    <article
      tabIndex={0}
      aria-label={`${meta.label}: ${formattedValue !== null ? `${formattedValue} ${meta.unit}` : "ไม่มีข้อมูล"}`}
      className="group relative bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-lg p-3.5 sm:p-5 transition-all duration-200 flex flex-col justify-between h-full min-h-[250px] shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 overflow-hidden"
    >
      {/* Upper Content Section */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Card Header */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                aria-hidden="true"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors group-hover:border-zinc-300 dark:group-hover:border-zinc-700 shrink-0"
                style={{ color: meta.color }}
              >
                <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-200 tracking-tight truncate">
                  {meta.label}
                </h3>
                <div className="text-[10px] font-mono text-zinc-500 truncate">
                  {meta.fluxField}
                </div>
              </div>
            </div>

            {/* AQI Status Badge / No Data Badge */}
            {value !== null ? (
              <span
                className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border uppercase tracking-wider font-medium shrink-0 whitespace-nowrap ${colorStyle.badge}`}
              >
                {status}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 uppercase font-medium shrink-0 whitespace-nowrap">
                ไม่มีข้อมูล
              </span>
            )}
          </div>

          {/* Main Telemetry Reading Display */}
          <div className="my-1.5 min-h-[40px] flex items-center min-w-0" aria-live="polite">
            {loading ? (
              <div
                className="h-9 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded my-1"
                aria-label="Loading sensor value"
              />
            ) : formattedValue !== null ? (
              <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 whitespace-nowrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums truncate">
                  {formattedValue}
                </span>
                <span className="text-xs sm:text-sm font-medium font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                  {meta.unit}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 my-1 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-400 dark:text-zinc-600 tracking-tight">
                  --
                </span>
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  (ไม่มีข้อมูล)
                </span>
              </div>
            )}
          </div>

          {/* Reserved Height Timestamp Container (Fluid Mobile Spacing) */}
          <div className="min-h-[18px] flex items-center mt-0.5 min-w-0">
            {value !== null && timeStr ? (
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap truncate">
                <Clock className={`w-3 h-3 shrink-0 ${isStale ? "text-amber-500" : "text-emerald-500"}`} />
                <span>
                  บันทึกเมื่อ: <strong className={isStale ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-zinc-700 dark:text-zinc-300"}>{timeStr}</strong>
                </span>
                {isStale && <span className="text-rose-500 font-semibold shrink-0">(ย้อนหลัง)</span>}
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 whitespace-nowrap">
                --:--:--
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar Container */}
        <div className="mt-2.5 mb-1">
          <div
            role="progressbar"
            aria-valuenow={value ?? 0}
            aria-valuemin={0}
            aria-valuemax={maxScale}
            aria-label={`${meta.label} visual scale`}
            className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden flex border border-zinc-200/50 dark:border-none"
          >
            <div
              className={`h-full transition-all duration-500 ${colorStyle.indicator}`}
              style={{
                width: `${progressPercent}%`,
                backgroundColor: status === "normal" && value !== null ? meta.color : "#d4d4d8",
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono text-zinc-500 mt-1 whitespace-nowrap">
            <span>0</span>
            {meta.thresholds && (
              <span className="text-amber-600 dark:text-amber-500/80">
                Warn: {meta.thresholds.warn}
              </span>
            )}
            <span>
              {meta.thresholds ? meta.thresholds.danger : meta.key === "humidity" ? "100" : "50"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info (Fluid text wrapping prevention) */}
      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-zinc-500 font-mono min-w-0">
        <span className="truncate min-w-0 flex-1">{meta.description}</span>
        <span className="text-[9px] sm:text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 shrink-0 whitespace-nowrap">
          {meta.normalRange}
        </span>
      </div>
    </article>
  );
}
