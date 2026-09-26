import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const googleSans = Plus_Jakarta_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Air Quality",
  description:
    "Real-time environmental and air quality monitoring dashboard featuring DHT22 temperature/humidity and SPS30 particulate matter (PM1, PM2.5, PM4, PM10) telemetry with InfluxDB integration.",
  keywords: [
    "Air Quality",
    "PM2.5",
    "Sensor Dashboard",
    "InfluxDB",
    "SPS30",
    "DHT22",
    "ESP32",
    "Next.js",
    "PWA",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Air Quality",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${googleSans.variable} ${notoSansThai.variable} ${monoFont.variable} dark`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased transition-colors">
        {children}
      </body>
    </html>
  );
}
