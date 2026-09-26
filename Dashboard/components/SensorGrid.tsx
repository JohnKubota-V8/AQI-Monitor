"use client";

import React from "react";
import { SENSORS } from "@/lib/sensorConfig";
import { SensorCard } from "./SensorCard";
import { SensorReading } from "@/types/sensor";
import { Grid } from "lucide-react";

interface SensorGridProps {
  reading: SensorReading | null;
  loading?: boolean;
}

export function SensorGrid({ reading, loading = false }: SensorGridProps) {
  return (
    <section aria-labelledby="sensor-grid-title" className="w-full">
      {/* Section Headline */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Grid aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2
            id="sensor-grid-title"
            className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-200 uppercase font-mono truncate"
          >
            ค่าเซนเซอร์สดเรียลไทม์ (LIVE TELEMETRY)
          </h2>
          <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
            {SENSORS.length} METRICS
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-500 hidden md:inline shrink-0">
          Config-Driven Architecture
        </span>
      </div>

      {/* Grid Layout - Uniform Grid Cards with Equal Heights */}
      <div
        role="list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch"
      >
        {SENSORS.map((meta) => {
          const val = reading?.values ? reading.values[meta.key] ?? null : null;
          const fieldTs = reading?.fieldTimestamps?.[meta.key] || reading?.timestamp;

          return (
            <div role="listitem" key={meta.key} className="flex flex-col h-full">
              <SensorCard
                meta={meta}
                value={val}
                timestamp={fieldTs}
                loading={loading}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
