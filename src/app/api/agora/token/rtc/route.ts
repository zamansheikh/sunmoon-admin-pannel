import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import {
  getAppId,
  getAppCertificate,
  getConfig,
  validateCredentials,
  incrementStat,
} from "@/lib/agora/configManager";

export const runtime = "nodejs";

function rtcRoleFor(role: string): number | null {
  switch (role.toLowerCase()) {
    case "publisher":
      return RtcRole.PUBLISHER;
    case "subscriber":
      return RtcRole.SUBSCRIBER;
    default:
      return null;
  }
}

function buildRtcToken(channelName: string, uid: number, role: number, expireTime: number) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;
  const token = RtcTokenBuilder.buildTokenWithUid(
    getAppId(),
    getAppCertificate(),
    channelName,
    uid,
    role,
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
    const channelName = search.get("channelName") ?? cfg.defaultChannelName;
    const uid = search.get("uid") ? parseInt(search.get("uid") as string, 10) : parseInt(cfg.defaultUid, 10);
    const role = (search.get("role") ?? cfg.defaultRole).toString();
    const expireTime = search.get("expireTime")
      ? parseInt(search.get("expireTime") as string, 10)
      : cfg.defaultExpireTime;

    const rtcRole = rtcRoleFor(role);
    if (rtcRole === null) {
      return NextResponse.json(
        { success: false, error: 'Role must be either "publisher" or "subscriber"' },
        { status: 400 }
      );
    }

    if (Number.isNaN(uid)) {
      return NextResponse.json(
        { success: false, error: "UID must be a valid number or 0 for dynamic assignment" },
        { status: 400 }
      );
    }

    const { token, privilegeExpiredTs } = buildRtcToken(channelName, uid, rtcRole, expireTime);
    incrementStat("rtc");

    return NextResponse.json({
      success: true,
      token,
      appId: getAppId(),
      channelName,
      uid,
      role,
      expireTime,
      expireAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to generate RTC token", message },
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
      channelName?: string;
      uid?: number | string;
      role?: string;
      expireTime?: number | string;
    };

    const channelName = body.channelName;
    if (!channelName) {
      return NextResponse.json(
        { success: false, error: "Channel name is required" },
        { status: 400 }
      );
    }

    const role = (body.role ?? "publisher").toString();
    const rtcRole = rtcRoleFor(role);
    if (rtcRole === null) {
      return NextResponse.json(
        { success: false, error: 'Role must be either "publisher" or "subscriber"' },
        { status: 400 }
      );
    }

    const uid = body.uid !== undefined && body.uid !== "" ? parseInt(String(body.uid), 10) : 0;
    if (Number.isNaN(uid)) {
      return NextResponse.json(
        { success: false, error: "UID must be a valid number or 0 for dynamic assignment" },
        { status: 400 }
      );
    }

    const expireTime =
      body.expireTime !== undefined ? parseInt(String(body.expireTime), 10) : 3600;

    const { token, privilegeExpiredTs } = buildRtcToken(channelName, uid, rtcRole, expireTime);
    incrementStat("rtc");

    return NextResponse.json({
      success: true,
      token,
      appId: getAppId(),
      channelName,
      uid,
      role,
      expireTime,
      expireAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to generate RTC token", message },
      { status: 500 }
    );
  }
}
