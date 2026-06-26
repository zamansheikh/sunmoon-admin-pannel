import { NextRequest, NextResponse } from "next/server";

interface UpstreamUser {
  _id?: string;
  userRole?: string;
  username?: string;
}

interface CacheEntry {
  user: UpstreamUser;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

export function backendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function extractBearer(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1].trim() : null;
}

async function fetchUpstreamUser(token: string): Promise<UpstreamUser | null> {
  try {
    const r = await fetch(`${backendBaseUrl()}/api/admin/auth`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    const user = Array.isArray(data?.result) ? data.result[0] : data?.result;
    return user ?? null;
  } catch {
    return null;
  }
}

async function verifySuperAdmin(token: string): Promise<UpstreamUser | null> {
  const cached = cache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user.userRole?.toLowerCase() === "admin" ? cached.user : null;
  }

  const user = await fetchUpstreamUser(token);
  if (!user) {
    cache.delete(token);
    return null;
  }
  cache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  return user.userRole?.toLowerCase() === "admin" ? user : null;
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Super admin access required") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Returns null if the request is allowed (super admin),
 * otherwise a NextResponse to short-circuit the handler.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = extractBearer(req);
  if (!token) return unauthorized();
  const user = await verifySuperAdmin(token);
  if (!user) return forbidden();
  return null;
}
