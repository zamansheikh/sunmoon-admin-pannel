import { NextRequest, NextResponse } from "next/server";
import { RtmTokenBuilder } from "agora-access-token";
import {
  getAppId,
  getAppCertificate,
  getConfig,
  validateCredentials,
  incrementStat,
} from "@/lib/agora/configManager";

export const runtime = "nodejs";

function buildRtmToken(uid: string, expireTime: number) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;
  const token = RtmTokenBuilder.buildToken(
    getAppId(),
    getAppCertificate(),
    uid,
    privilegeExpiredTs
  );
  return { token, privilegeExpiredTs };
}

export async function GET(req: NextRequest) {
  try {
    if (!validateCredentials()) {
      return NextResponse.json(
        { success: false, error: "Agora App ID and App Certificate must be configured" },
        { status: 500 }
      );
    }

    const cfg = getConfig();
    const search = req.nextUrl.searchParams;
    const uid = (search.get("uid") ?? cfg.defaultUid).toString();
    const expireTime = search.get("expireTime")
      ? parseInt(search.get("expireTime") as string, 10)
      : cfg.defaultExpireTime;

    const { token, privilegeExpiredTs } = buildRtmToken(uid, expireTime);
    incrementStat("rtm");

    return NextResponse.json({
      success: true,
      token,
      appId: getAppId(),
      uid,
      expireTime,
      expireAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to generate RTM token", message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCredentials()) {
      return NextResponse.json(
        { success: false, error: "Agora App ID and App Certificate must be configured" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      uid?: number | string;
      expireTime?: number | string;
    };

    if (body.uid === undefined || body.uid === null || body.uid === "") {
      return NextResponse.json(
        { success: false, error: "UID is required for RTM token" },
        { status: 400 }
      );
    }

    const uid = String(body.uid);
    const expireTime =
      body.expireTime !== undefined ? parseInt(String(body.expireTime), 10) : 3600;

    const { token, privilegeExpiredTs } = buildRtmToken(uid, expireTime);
    incrementStat("rtm");

    return NextResponse.json({
      success: true,
      token,
      appId: getAppId(),
      uid,
      expireTime,
      expireAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to generate RTM token", message },
      { status: 500 }
    );
  }
}
