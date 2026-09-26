"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Check, Share } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.warn("Service Worker registration failed:", err));
    }

    // 2. Detect if already running in standalone mode (PWA installed)
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // 3. Listen for browser PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    if (iosDevice && !(window.navigator as any).standalone) {
      setShowIOSBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (dismissed || isInstalled) return null;

  return (
    <>
      {/* Native Browser PWA Install Banner */}
      {isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-bounce-in">
          <div className="bg-zinc-900 dark:bg-zinc-900 light:bg-white text-zinc-100 dark:text-zinc-100 border border-emerald-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-zinc-100">
                  ติดตั้งแอป Sensor Dashboard
                </h4>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  เข้าถึงได้รวดเร็ว ดึงข้อมูลแม้ offline
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>ติดตั้งแอป</span>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Instructions Banner */}
      {showIOSBanner && !isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-zinc-900/95 text-zinc-100 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-lg flex items-start justify-between gap-3 text-xs font-mono">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Share className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-100">ติดตั้งบน iPhone / iPad</div>
                <div className="text-zinc-400 mt-1">
                  1. แตะปุ่ม <span className="text-blue-400 font-semibold">แชร์ (Share)</span> ด้านล่างของ Safari<br />
                  2. เลื่อนลงแล้วเลือก <span className="text-emerald-400 font-semibold">'เพิ่มไปยังหน้าจอโฮม' (Add to Home Screen)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
