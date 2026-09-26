import { NextRequest, NextResponse } from "next/server";
import { fetchSensorHistory } from "@/lib/influxdb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "24h";

    const { data, isSimulated } = await fetchSensorHistory(range);
    return NextResponse.json(
      {
        success: true,
        range,
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
        error: error.message || "Failed to fetch historical sensor data",
      },
      { status: 500 }
    );
  }
}
