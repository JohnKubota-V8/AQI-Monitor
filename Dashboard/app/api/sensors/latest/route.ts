import { NextResponse } from "next/server";
import { fetchLatestSensorData } from "@/lib/influxdb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, isSimulated } = await fetchLatestSensorData();
    return NextResponse.json(
      {
        success: true,
        data,
        isSimulated,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch latest sensor data",
      },
      { status: 500 }
    );
  }
}
