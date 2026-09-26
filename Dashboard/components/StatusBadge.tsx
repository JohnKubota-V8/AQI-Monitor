"use client";

import React from "react";
import { Activity, WifiOff, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  timestamp?: string;
  isSimulated?: boolean;
}

export function StatusBadge({ timestamp, isSimulated }: StatusBadgeProps) {
  const getStatus = () => {
    if (!timestamp)
      return { label: "OFFLINE", color: "rose", text: "No signal", Icon: WifiOff };

    const diffSec = (Date.now() - new Date(timestamp).getTime()) / 1000;
    const timeStr = new Date(timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    if (diffSec < 180) {
      return {
        label: isSimulated ? "SIMULATED" : "LIVE",
        color: isSimulated ? "amber" : "emerald",
        text: `${Math.round(diffSec)}s ago`,
        Icon: Activity,
      };
    } else if (diffSec < 900) {
      return {
        label: "STALE",
        color: "amber",
        text: `${Math.round(diffSec / 60)}m ago`,
        Icon: AlertTriangle,
      };
    } else {
      return {
        label: "ESP DOWN",
        color: "rose",
        text: `ล่าสุด ${timeStr} น.`,
        Icon: WifiOff,
      };
    }
  };

  const status = getStatus();
  const Icon = status.Icon;

  const colorStyles: Record<
    string,
    { bg: string; text: string; border: string; dot: string }
  > = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800/50",
      dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-live-pulse",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/50",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800/50",
      dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-950/50",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-200 dark:border-rose-800/50",
      dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse",
    },
  };

  const style = colorStyles[status.color];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-mono tracking-tight whitespace-nowrap ${style.bg} ${style.border} ${style.text}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
      <span className="font-semibold uppercase">{status.label}</span>
      <span className="opacity-75 border-l border-zinc-300 dark:border-zinc-700/60 pl-1.5 ml-0.5 font-normal">
        {status.text}
      </span>
    </div>
  );
}
