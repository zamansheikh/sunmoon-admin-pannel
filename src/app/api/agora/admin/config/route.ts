import { NextRequest, NextResponse } from "next/server";
import {
  AgoraConfig,
  AgoraRole,
  getPublicConfig,
  updateConfig,
} from "@/lib/agora/configManager";
import { requireSuperAdmin, extractBearer, backendBaseUrl } from "@/lib/agora/auth";

export const runtime = "nodejs";

// This route bridges the Agora config UI to the backend's DB-backed store
// (/api/admin/agora-config) so credentials persist across deploys. It also
// mirrors whatever it reads/writes into the local file (configManager) so the
// token-generation routes — which read the local file synchronously — keep
// working exactly as before. DB = source of truth; local file = live cache.

interface BackendAgoraConfig {
  _id: string;
  appId: string;
  appCertificate: string;
  defaultChannel: string;
  defaultUid: number;
  defaultRole: string;
  tokenExpiry: number;
}

// Backend (DB) shape → local file / UI shape.
function fromBackend(c: BackendAgoraConfig): AgoraConfig {
  return {
    agoraAppId: c.appId ?? "",
    agoraAppCertificate: c.appCertificate ?? "",
    defaultChannelName: c.defaultChannel ?? "",
    defaultUid: String(c.defaultUid ?? 0),
    defaultRole: (c.defaultRole as AgoraRole) ?? "publisher",
    defaultExpireTime: c.tokenExpiry ?? 3600,
  };
}

// Local file / UI shape → backend (DB) payload.
function toBackendPayload(c: AgoraConfig) {
  return {
    appId: c.agoraAppId,
    appCertificate: c.agoraAppCertificate,
    defaultChannel: c.defaultChannelName,
    defaultUid: parseInt(String(c.defaultUid), 10) || 0,
    defaultRole: c.defaultRole,
    tokenExpiry: Number(c.defaultExpireTime) || 3600,
  };
}

async function fetchNewestFromDb(token: string): Promise<BackendAgoraConfig | null> {
  const r = await fetch(`${backendBaseUrl()}/api/admin/agora-config`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Backend responded ${r.status}`);
  const data = await r.json();
  const list = Array.isArray(data?.result) ? (data.result as BackendAgoraConfig[]) : [];
  return list[0] ?? null; // backend sorts newest-first
}

export async function GET(req: NextRequest) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;

  const token = extractBearer(req);
  try {
    const dbConfig = token ? await fetchNewestFromDb(token) : null;
    if (dbConfig) {
      // Mirror DB → local file so token routes use the live credentials.
      updateConfig(fromBackend(dbConfig));
    }
  } catch (err) {
    // Backend unreachable — fall back to the local cache so the page and
    // the token tester keep working instead of hard-failing.
    console.error("Agora config: DB load failed, using local cache:", err);
  }

  return NextResponse.json({ success: true, config: getPublicConfig() });
}

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;

  const token = extractBearer(req);
  const body = (await req.json().catch(() => ({}))) as Partial<AgoraConfig>;

  // Merge submitted fields onto the current config, then mirror locally first
  // so the token routes immediately reflect the entered credentials — this
  // preserves the previous behaviour even if the DB write later fails.
  const merged: AgoraConfig = { ...getPublicConfig() };
  if (body.agoraAppId !== undefined) merged.agoraAppId = body.agoraAppId;
  if (body.agoraAppCertificate !== undefined) merged.agoraAppCertificate = body.agoraAppCertificate;
  if (body.defaultChannelName !== undefined) merged.defaultChannelName = body.defaultChannelName;
  if (body.defaultUid !== undefined) merged.defaultUid = body.defaultUid;
  if (body.defaultRole !== undefined) merged.defaultRole = body.defaultRole as AgoraRole;
  if (body.defaultExpireTime !== undefined) {
    merged.defaultExpireTime = parseInt(String(body.defaultExpireTime), 10);
  }
  updateConfig(merged);

  // Persist to the backend DB (source of truth that survives deploys).
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Missing authorization token" },
      { status: 401 }
    );
  }

  try {
    const existing = await fetchNewestFromDb(token);
    const payload = toBackendPayload(merged);
    const url = existing
      ? `${backendBaseUrl()}/api/admin/agora-config/${existing._id}`
      : `${backendBaseUrl()}/api/admin/agora-config`;
    const r = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      // Saved locally, but DB persistence failed — tell the admin so they
      // know it won't survive a deploy until the backend issue is resolved.
      return NextResponse.json(
        {
          success: false,
          error:
            (data?.message as string) ||
            `Saved locally, but failed to persist to database (${r.status}).`,
        },
        { status: 502 }
      );
    }
    // Sync the canonical DB record back into the local cache.
    if (data?.result) updateConfig(fromBackend(data.result as BackendAgoraConfig));
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? `Saved locally, but database persistence failed: ${err.message}`
            : "Saved locally, but database persistence failed.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Configuration updated successfully",
    config: getPublicConfig(),
  });
}
