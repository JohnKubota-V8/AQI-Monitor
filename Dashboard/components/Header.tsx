"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Database, Cpu, Radio, Sun, Moon } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useTheme } from "./ThemeProvider";

interface HeaderProps {
  timestamp?: string;
  isSimulated?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  timestamp,
  isSimulated = false,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  const [timeString, setTimeString] = useState<string>("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeString(
        d.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4">
          {/* Top Station Identity Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-emerald-600 dark:text-emerald-500 uppercase font-semibold whitespace-nowrap">
                    STATION TELEMETRY
                  </span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                    v1.2
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  Air Quality
                </h1>
              </div>
            </div>

            {/* Mobile Controls (Theme + Refresh Icon Button) */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-1.5 sm:p-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label="Refresh telemetry data"
                  className="p-1.5 sm:p-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isRefreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Action Bar & Badges */}
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-1.5 sm:gap-2.5 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800/80 pt-2 md:pt-0 text-xs">
            {/* Live Clock */}
            <div
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
              aria-label="Real-time Clock ICT"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-400 dark:text-zinc-500">ICT:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {timeString || "--:--:--"}
              </span>
            </div>

            {/* InfluxDB / Simulator Pill */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
              <Database className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{isSimulated ? "Simulated" : "InfluxDB"}</span>
            </div>

            {/* Hardware Tag */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
              <Cpu className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>ESP32</span>
            </div>

            {/* Live Status Badge */}
            <StatusBadge timestamp={timestamp} isSimulated={isSimulated} />

            {/* Desktop Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="hidden md:block p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Desktop Refresh Icon-only Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh telemetry data"
                className="hidden md:block p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
