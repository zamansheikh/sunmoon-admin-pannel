"use client";

import Link from "next/link";
import { ReactNode, createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/api";

interface AgoraAuthContextType {
  authedFetch: <T = unknown>(input: string, init?: RequestInit) => Promise<T>;
}

const AgoraAuthContext = createContext<AgoraAuthContextType | null>(null);

export function useAgoraAuth(): AgoraAuthContextType {
  const ctx = useContext(AgoraAuthContext);
  if (!ctx) throw new Error("useAgoraAuth must be used inside <AgoraGate>");
  return ctx;
}

function isSuperAdmin(role?: string): boolean {
  return (role ?? "").trim().toLowerCase() === "admin";
}

export default function AgoraGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  const authedFetch = useCallback(async <T,>(input: string, init: RequestInit = {}): Promise<T> => {
    const token = getToken();
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const r = await fetch(input, { ...init, headers });
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
    return data as T;
  }, []);

  const ctxValue = useMemo<AgoraAuthContextType>(() => ({ authedFetch }), [authedFetch]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin(user?.userRole)) {
    return (
      <div className="row justify-content-center mt-4">
        <div className="col-md-7 col-lg-6">
          <div className="card">
            <div className="card-body p-4 text-center">
              <i className="ri-shield-cross-line text-danger" style={{ fontSize: 48 }}></i>
              <h4 className="mt-3 mb-2">Super Admin Only</h4>
              <p className="text-muted fs-13 mb-3">
                The Agora server console is restricted to super admins. Your current role
                {user?.userRole ? <> (<code>{user.userRole}</code>)</> : null} doesn&apos;t have access.
              </p>
              <Link href="/dashboard" className="btn btn-primary">
                <i className="ri-arrow-left-line me-1"></i> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AgoraAuthContext.Provider value={ctxValue}>{children}</AgoraAuthContext.Provider>;
}
