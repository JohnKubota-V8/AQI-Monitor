"use client";

import React, { useState } from "react";
import { SensorReading } from "@/types/sensor";
import { SENSORS } from "@/lib/sensorConfig";
import { Table, Terminal, ChevronDown, ChevronUp, Code2 } from "lucide-react";

interface RawDataTableProps {
  reading: SensorReading | null;
  isSimulated?: boolean;
}

export function RawDataTable({ reading }: RawDataTableProps) {
  const [showFluxQuery, setShowFluxQuery] = useState(false);

  const fluxLatestSnippet = `from(bucket: "MQTTProject")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "dht22" or r._measurement == "sps30")
  |> last()`;

  const fluxHistorySnippet = `from(bucket: "MQTTProject")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "dht22" or r._measurement == "sps30")
  |> aggregateWindow(every: 15m, fn: mean, createEmpty: false)`;

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return "--:--:--";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "--:--:--";
    
    // Format to Thai time and date
    const timeStr = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${timeStr} (${dateStr})`;
  };

  return (
    <section aria-labelledby="raw-data-title" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-lg p-3.5 sm:p-5 transition-colors shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Table aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2
            id="raw-data-title"
            className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-200 uppercase font-mono truncate"
          >
            ตารางข้อมูลดิบ (RAW TELEMETRY STREAM)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowFluxQuery(!showFluxQuery)}
          aria-expanded={showFluxQuery}
          aria-controls="flux-query-drawer"
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap self-start sm:self-auto"
        >
          <Code2 aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{showFluxQuery ? "ซ่อน Flux Queries" : "ดู Flux Queries (InfluxDB)"}</span>
          {showFluxQuery ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Flux Query Inspection Drawer */}
      {showFluxQuery && (
        <div
          id="flux-query-drawer"
          className="mb-4 p-3 sm:p-4 rounded-md bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-300 space-y-3"
        >
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-[11px] sm:text-xs">
            <Terminal className="w-4 h-4 shrink-0" />
            <span>Flux Query Examples (lib/influxdb.ts)</span>
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 mb-1">1. Query Latest Readings:</div>
            <pre className="bg-zinc-900 dark:bg-zinc-950 p-2 sm:p-2.5 rounded border border-zinc-700 dark:border-zinc-800 text-emerald-400 text-[11px] overflow-x-auto">
              {fluxLatestSnippet}
            </pre>
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 mb-1">2. Query Aggregated Window History:</div>
            <pre className="bg-zinc-900 dark:bg-zinc-950 p-2 sm:p-2.5 rounded border border-zinc-700 dark:border-zinc-800 text-emerald-400 text-[11px] overflow-x-auto">
              {fluxHistorySnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Telemetry Stream Table */}
      <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
        <table className="w-full text-left font-mono text-xs border-collapse min-w-[580px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider bg-zinc-50 dark:bg-zinc-900/40">
              <th scope="col" className="py-2 px-2.5 whitespace-nowrap">Field Name</th>
              <th scope="col" className="py-2 px-2.5 whitespace-nowrap">Measurement Label</th>
              <th scope="col" className="py-2 px-2.5 whitespace-nowrap">Raw Value</th>
              <th scope="col" className="py-2 px-2.5 whitespace-nowrap">Unit</th>
              <th scope="col" className="py-2 px-2.5 whitespace-nowrap">Flux Match</th>
              <th scope="col" className="py-2 px-2.5 text-right whitespace-nowrap">Timestamp (เวลาบันทึกจริง)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
            {SENSORS.map((meta) => {
              const val = reading?.values ? reading.values[meta.key] ?? null : null;
              const fieldTs = val !== null ? (reading?.fieldTimestamps?.[meta.key] || reading?.timestamp) : null;

              return (
                <tr key={meta.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-2 px-2.5 font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    {meta.key}
                  </td>
                  <td className="py-2 px-2.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{meta.label}</td>
                  <td className="py-2 px-2.5 font-bold text-zinc-900 dark:text-zinc-100 tabular-nums whitespace-nowrap">
                    {val !== null ? (
                      val.toFixed(meta.decimals)
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600 font-normal">--</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{meta.unit}</td>
                  <td className="py-2 px-2.5 text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{meta.fluxField}</td>
                  <td className="py-2 px-2.5 text-right text-zinc-500 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                    {val !== null ? (
                      formatTimestamp(fieldTs)
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600 font-normal">--:--:--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
