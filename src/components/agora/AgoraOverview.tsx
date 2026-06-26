"use client";

import { useEffect, useState } from "react";
import AgoraSubnav from "./AgoraSubnav";
import { useAgoraAuth } from "./AgoraGate";

interface Stats {
  totalRequests: number;
  rtcRequests: number;
  rtmRequests: number;
  adminRequests: number;
  lastReset: string;
}

interface PublicConfig {
  agoraAppId?: string;
  defaultChannelName?: string;
}

const STAT_CARDS: Array<{ key: keyof Stats; label: string; icon: string; iconBg: string }> = [
  { key: "totalRequests", label: "Total Requests", icon: "ri-server-line", iconBg: "bg-primary" },
  { key: "rtcRequests", label: "RTC Tokens",     icon: "ri-vidicon-line", iconBg: "bg-danger" },
  { key: "rtmRequests", label: "RTM Tokens",     icon: "ri-message-3-line", iconBg: "bg-info" },
  { key: "adminRequests", label: "Admin Actions", icon: "ri-settings-3-line", iconBg: "bg-warning" },
];

export default function AgoraOverview() {
  const { authedFetch } = useAgoraAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statsRes, configRes] = await Promise.all([
          authedFetch<{ success: boolean; stats: Stats }>("/api/agora/admin/stats"),
          authedFetch<{ success: boolean; config: PublicConfig }>("/api/agora/admin/config"),
        ]);
        if (cancelled) return;
        setStats(statsRes.stats);
        setConfig(configRes.config);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [authedFetch]);

  return (
    <>
      <AgoraSubnav />

      <div className="row mb-3">
        <div className="col-12">
          <h4 className="mb-1">Agora Server Overview</h4>
          <p className="text-muted fs-13">
            Real-time stats from the bundled Agora token service. Updates every 5 seconds.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger fs-13">{error}</div>}

      <div className="row">
        {STAT_CARDS.map((card) => (
          <div className="col-md-6 col-xl-3" key={card.key}>
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <div className={`avatar-md ${card.iconBg} text-white d-flex align-items-center justify-content-center rounded`}>
                    <i className={`${card.icon} fs-22`}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-1 fs-13">{card.label}</p>
                    <h3 className="mb-0">{stats ? stats[card.key].toLocaleString() : "—"}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">System Status</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <span className="text-muted">Server</span>
                  <span className="badge bg-success-subtle text-success">
                    <i className="ri-checkbox-blank-circle-fill fs-10 me-1"></i> Operational
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span className="text-muted">Active App ID</span>
                  <code className="fs-13">
                    {config?.agoraAppId
                      ? `${config.agoraAppId.slice(0, 8)}…${config.agoraAppId.slice(-4)}`
                      : "Not configured"}
                  </code>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span className="text-muted">Default channel</span>
                  <code className="fs-13">{config?.defaultChannelName || "—"}</code>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span className="text-muted">Stats since</span>
                  <span className="fs-13">
                    {stats?.lastReset ? new Date(stats.lastReset).toLocaleString() : "—"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Public API Endpoints</h5>
              <p className="text-muted fs-13 mb-3">
                These routes are unauthenticated and ready for app clients.
              </p>
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <span className="badge bg-success-subtle text-success me-2">GET</span>
                  <code>/api/agora/token/rtc</code>
                </li>
                <li className="mb-2">
                  <span className="badge bg-success-subtle text-success me-2">GET</span>
                  <code>/api/agora/token/rtm</code>
                </li>
                <li className="mb-2">
                  <span className="badge bg-primary-subtle text-primary me-2">POST</span>
                  <code>/api/agora/token/rtc</code>
                </li>
                <li>
                  <span className="badge bg-primary-subtle text-primary me-2">POST</span>
                  <code>/api/agora/token/rtm</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
