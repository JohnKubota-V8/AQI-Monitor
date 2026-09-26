"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SensorHistoryPoint, SensorKey } from "@/types/sensor";
import { SENSORS } from "@/lib/sensorConfig";
import { LineChart as ChartIcon, Calendar, Filter } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface SensorChartProps {
  data: SensorHistoryPoint[];
  range: string;
  onRangeChange: (newRange: string) => void;
  loading?: boolean;
}

export function SensorChart({
  data,
  range,
  onRangeChange,
  loading = false,
}: SensorChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Temp & Humidity selected by default
  const [activeKeys, setActiveKeys] = useState<Record<SensorKey, boolean>>({
    temperature: true,
    humidity: true,
    pm1: false,
    pm2_5: false,
    pm4: false,
    pm10: false,
  });

  const toggleSensor = (key: SensorKey) => {
    setActiveKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectPreset = (mode: "all" | "pm" | "ambient") => {
    if (mode === "all") {
      setActiveKeys({
        temperature: true,
        humidity: true,
        pm1: true,
        pm2_5: true,
        pm4: true,
        pm10: true,
      });
    } else if (mode === "pm") {
      setActiveKeys({
        temperature: false,
        humidity: false,
        pm1: true,
        pm2_5: true,
        pm4: true,
        pm10: true,
      });
    } else if (mode === "ambient") {
      setActiveKeys({
        temperature: true,
        humidity: true,
        pm1: false,
        pm2_5: false,
        pm4: false,
        pm10: false,
      });
    }
  };

  // Determine active preset dynamically
  const isAmbientActive =
    activeKeys.temperature &&
    activeKeys.humidity &&
    !activeKeys.pm1 &&
    !activeKeys.pm2_5 &&
    !activeKeys.pm4 &&
    !activeKeys.pm10;

  const isPmActive =
    !activeKeys.temperature &&
    !activeKeys.humidity &&
    (activeKeys.pm1 || activeKeys.pm2_5 || activeKeys.pm4 || activeKeys.pm10);

  const isAllActive =
    activeKeys.temperature &&
    activeKeys.humidity &&
    activeKeys.pm1 &&
    activeKeys.pm2_5 &&
    activeKeys.pm4 &&
    activeKeys.pm10;

  const formatTimeTick = (isoStr: string) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (range === "1h" || range === "6h") {
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    } else if (range === "7d") {
      return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:00`;
    }
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  const rangeList = ["1h", "6h", "24h", "7d"];
  const rangeIndex = Math.max(0, rangeList.indexOf(range));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateStr = label ? new Date(label).toLocaleString("th-TH") : "";
      return (
        <div className="bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-md shadow-xl text-[11px] sm:text-xs font-mono backdrop-blur-md transition-colors pointer-events-none">
          <div className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
            <span>TIMESTAMP</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{dateStr}</span>
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">{entry.name}</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                  {entry.value !== null && entry.value !== undefined
                    ? `${entry.value}`
                    : "--"}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section aria-labelledby="chart-section-title" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-lg p-3.5 sm:p-5 transition-colors shadow-sm">
      {/* Header controls & time range selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 sm:pb-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <ChartIcon aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2
            id="chart-section-title"
            className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-200 uppercase font-mono truncate"
          >
            กราฟประวัติย้อนหลัง (HISTORICAL DATA)
          </h2>
        </div>

        {/* Controls Row with Smooth Animated Sliding Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Animated Sliding Preset Segmented Control */}
          <div
            role="group"
            aria-label="Preset filters"
            className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 text-[11px] sm:text-xs font-mono select-none w-56 sm:w-64"
          >
            {/* Sliding Active Green Pill */}
            <div
              aria-hidden="true"
              className="absolute top-0.5 bottom-0.5 rounded bg-emerald-500 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: "calc(33.333% - 2px)",
                left: isAmbientActive
                  ? "2px"
                  : isPmActive
                  ? "calc(33.333% + 1px)"
                  : "calc(66.666% + 0px)",
              }}
            />

            <button
              type="button"
              onClick={() => selectPreset("ambient")}
              className={`relative z-10 w-1/3 py-1 rounded font-medium text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap ${
                isAmbientActive
                  ? "text-zinc-950 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Temp/Hum
            </button>
            <button
              type="button"
              onClick={() => selectPreset("pm")}
              className={`relative z-10 w-1/3 py-1 rounded font-medium text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap ${
                isPmActive
                  ? "text-zinc-950 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              PM Only
            </button>
            <button
              type="button"
              onClick={() => selectPreset("all")}
              className={`relative z-10 w-1/3 py-1 rounded font-medium text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap ${
                isAllActive
                  ? "text-zinc-950 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              All
            </button>
          </div>

          {/* Animated Sliding Time Range Selector */}
          <div
            role="group"
            aria-label="Time range selector"
            className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 text-[11px] sm:text-xs font-mono select-none w-48 sm:w-56"
          >
            {/* Sliding Active Green Pill */}
            <div
              aria-hidden="true"
              className="absolute top-0.5 bottom-0.5 rounded bg-emerald-500 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: "calc(25% - 2px)",
                left: `calc(${rangeIndex * 25}% + 2px)`,
              }}
            />

            {rangeList.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                aria-pressed={range === r}
                className={`relative z-10 w-1/4 py-1 rounded font-medium text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap ${
                  range === r
                    ? "text-zinc-950 font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Legend & Toggle Buttons Row */}
      <div role="group" aria-label="Metric toggle series" className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs font-mono no-scrollbar">
        <span className="text-zinc-400 dark:text-zinc-500 text-[10px] sm:text-[11px] uppercase mr-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <Filter className="w-3 h-3" /> Toggles:
        </span>
        {SENSORS.map((sensor) => {
          const isActive = activeKeys[sensor.key];
          return (
            <button
              key={sensor.key}
              type="button"
              onClick={() => toggleSensor(sensor.key)}
              aria-pressed={isActive}
              aria-label={`Toggle ${sensor.label}`}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-all duration-200 shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium scale-[1.02]"
                  : "bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-600 line-through opacity-60 scale-100"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: isActive ? sensor.color : "#9ca3af",
                }}
              />
              <span>{sensor.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-[280px] sm:h-[360px] relative pt-2">
        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading time-series data"
            className="w-full h-full bg-zinc-100 dark:bg-zinc-900/50 animate-pulse rounded flex items-center justify-center text-zinc-500 font-mono text-xs"
          >
            Loading time-series telemetry data...
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 font-mono text-xs space-y-2">
            <Filter className="w-6 h-6 opacity-40" />
            <span>No historical records found for range {range}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#27272a" : "#e4e4e7"}
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimeTick}
                stroke={isDark ? "#71717a" : "#a1a1aa"}
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke={isDark ? "#71717a" : "#a1a1aa"}
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {SENSORS.map((sensor) => {
                if (!activeKeys[sensor.key]) return null;
                return (
                  <Line
                    key={sensor.key}
                    type="monotone"
                    dataKey={sensor.key}
                    name={`${sensor.label} (${sensor.unit})`}
                    stroke={sensor.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: isDark ? "#09090b" : "#ffffff", strokeWidth: 2 }}
                    isAnimationActive={true}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
