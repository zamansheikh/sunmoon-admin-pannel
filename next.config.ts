import type { NextConfig } from "next";

// Backend origin — change this if the API server moves
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Allow opening dev server from local network device(s).
  allowedDevOrigins: ["192.168.68.51"],
  experimental: {
    // Large multipart uploads pass through Next.js rewrite proxy.
    // Default is 10MB; increase to avoid truncated file bodies.
    proxyClientMaxBodySize: "100mb",
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
  },
  // Proxy all /api/* and /uploads/* requests to the backend.
  // The browser always calls the Next.js server (same origin),
  // Next.js forwards to localhost:8000 — no CORS issues.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
