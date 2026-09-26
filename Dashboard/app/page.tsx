"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { MetricsSummary } from "@/components/MetricsSummary";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorChart } from "@/components/SensorChart";
import { RawDataTable } from "@/components/RawDataTable";
import { SensorReading, SensorHistoryPoint } from "@/types/sensor";
import { Server, Shield, Cpu, AlertTriangle, Info } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DashboardContent() {
  const [historyRange, setHistoryRange] = useState<string>("24h");
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

  // Live polling every 15 seconds using SWR (Section 5.5 in Prompt.md)
  const {
    data: latestRes,
    isLoading: latestLoading,
    mutate: mutateLatest,
  } = useSWR("/api/sensors/latest", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });

  // History fetcher
  const {
    data: historyRes,
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useSWR(`/api/sensors/history?range=${historyRange}`, fetcher, {
    revalidateOnFocus: false,
  });

  const reading: SensorReading | null = latestRes?.data ?? null;
  const isSimulated: boolean = latestRes?.isSimulated ?? true;
  const latestError: string | undefined = latestRes?.error;
  const historyError: string | undefined = historyRes?.error;
  const historyData: SensorHistoryPoint[] = historyRes?.data ?? [];

  // Instant Manual Refresh Function (Bypasses SWR deduplication & browser cache)
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const timestamp = Date.now();
      await Promise.all([
        mutateLatest(fetcher(`/api/sensors/latest?_t=${timestamp}`), { revalidate: true }),
        mutateHistory(fetcher(`/api/sensors/history?range=${historyRange}&_t=${timestamp}`), { revalidate: true }),
      ]);
    } catch (err) {
      console.warn("Manual refresh failed:", err);
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 600);
    }
  };

  const isRefreshing = latestLoading || historyLoading || isManualRefreshing;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans bg-grid-pattern selection:bg-emerald-500 selection:text-zinc-950 transition-colors">
      {/* Top Header */}
      <Header
        timestamp={reading?.timestamp}
        isSimulated={isSimulated}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Error Notification Callout when Real InfluxDB connection fails or Token is missing */}
        {(latestError || historyError) && (
          <div
            role="alert"
            className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 font-mono text-xs text-amber-700 dark:text-amber-300 space-y-1.5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>แจ้งเตือนสถานะการเชื่อมต่อ InfluxDB Real Data (Strict Mode):</span>
            </div>
            {latestError && <div>• {latestError}</div>}
            {historyError && <div>• {historyError}</div>}
            <div className="text-[11px] opacity-80 pt-1 border-t border-amber-500/20 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Info className="w-3.5 h-3.5" />
              <span>
                วิธีแก้ไข: กรอก <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-800 dark:text-amber-200 font-bold">INFLUXDB_TOKEN</code> จริงในไฟล์ <code className="font-bold">Dashboard/.env.local</code>
              </span>
            </div>
          </div>
        )}

        {/* Top Telemetry Summary Banner */}
        <MetricsSummary reading={reading} />

        {/* Modular Sensor Grid (Config Driven) */}
        <SensorGrid reading={reading} loading={latestLoading} />

        {/* Historical Time-Series Chart */}
        <SensorChart
          data={historyData}
          range={historyRange}
          onRangeChange={setHistoryRange}
          loading={historyLoading}
        />

        {/* Raw Telemetry Data Table & Flux Inspection */}
        <RawDataTable reading={reading} isSimulated={isSimulated} />

        {/* Bottom Technical Spec Footer (Gridgeist Style) */}
        <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 pt-6 pb-12 mt-12 text-zinc-500 font-mono text-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-700 dark:text-zinc-400 font-semibold">Gridgeist Precision Telemetry System</span>
              <span className="text-zinc-400 dark:text-zinc-600">|</span>
              <span>Google Sans Typography</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Sensor: Sensirion SPS30 & DHT22
              </span>
              <span className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Database: InfluxDB v2
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Polling: 15s SWR
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
