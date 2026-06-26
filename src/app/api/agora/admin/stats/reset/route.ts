import { NextRequest, NextResponse } from "next/server";
import { resetStats } from "@/lib/agora/configManager";
import { requireSuperAdmin } from "@/lib/agora/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;

  const stats = resetStats();
  return NextResponse.json({
    success: true,
    message: "Statistics reset successfully",
    stats,
  });
}
