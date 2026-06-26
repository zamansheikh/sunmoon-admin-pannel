import { NextResponse } from "next/server";
import { getAppId, validateCredentials } from "@/lib/agora/configManager";

export const runtime = "nodejs";

export async function GET() {
  if (!validateCredentials()) {
    return NextResponse.json(
      {
        success: false,
        error: "Configuration error",
        message: "Agora App ID and App Certificate must be configured",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    appId: getAppId(),
    serverTime: new Date().toISOString(),
    serverTimestamp: Math.floor(Date.now() / 1000),
    availableEndpoints: {
      rtcToken: "POST /api/agora/token/rtc",
      rtmToken: "POST /api/agora/token/rtm",
      rtcTokenGet: "GET /api/agora/token/rtc",
      rtmTokenGet: "GET /api/agora/token/rtm",
    },
    rtcTokenParams: {
      channelName: "string (required)",
      uid: "number (optional, default: 0 for dynamic)",
      role: 'string (optional, default: "publisher", values: "publisher" | "subscriber")',
      expireTime: "number (optional, default: 3600 seconds)",
    },
    rtmTokenParams: {
      uid: "string (required)",
      expireTime: "number (optional, default: 3600 seconds)",
    },
  });
}
