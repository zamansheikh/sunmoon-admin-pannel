import { NextRequest, NextResponse } from "next/server";
import http from "http";
import https from "https";

export const runtime = "nodejs";

// The backend's GET /api/power-shared/users/exact-search reads `shortId` from
// the request BODY. Browsers (and undici/global fetch) refuse to attach a body
// to a GET request, so the admin panel can't call it directly. This route
// accepts `shortId` as a normal query param from the browser and forwards it
// to the backend as a GET-with-body using Node's http/https (which allows it),
// passing through the caller's Authorization header. No backend change needed.

function backendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export async function GET(req: NextRequest) {
  const shortId = req.nextUrl.searchParams.get("shortId");
  const auth = req.headers.get("authorization") ?? "";

  if (!shortId || !/^\d+$/.test(shortId)) {
    return NextResponse.json(
      { success: false, message: "A numeric shortId query parameter is required" },
      { status: 400 }
    );
  }

  const base = backendBaseUrl().replace(/\/$/, "");
  const target = new URL(`${base}/api/power-shared/users/exact-search`);
  const isHttps = target.protocol === "https:";
  const lib = isHttps ? https : http;
  const body = JSON.stringify({ shortId: Number(shortId) });

  try {
    const result = await new Promise<{ status: number; text: string }>(
      (resolve, reject) => {
        const upstream = lib.request(
          {
            protocol: target.protocol,
            hostname: target.hostname,
            port: target.port || (isHttps ? 443 : 80),
            path: target.pathname + target.search,
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
              ...(auth ? { Authorization: auth } : {}),
            },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () =>
              resolve({ status: res.statusCode ?? 502, text: data })
            );
          }
        );
        upstream.on("error", reject);
        upstream.write(body);
        upstream.end();
      }
    );

    let json: unknown;
    try {
      json = JSON.parse(result.text);
    } catch {
      json = { success: false, message: result.text || "Upstream returned no JSON" };
    }
    return NextResponse.json(json, { status: result.status });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to reach backend",
      },
      { status: 502 }
    );
  }
}
