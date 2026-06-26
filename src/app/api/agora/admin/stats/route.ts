import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/agora/configManager";
import { requireSuperAdmin } from "@/lib/agora/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;

  return NextResponse.json({ success: true, stats: getStats() });
}
