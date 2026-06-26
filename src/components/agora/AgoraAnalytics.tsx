"use client";

import { useEffect, useState } from "react";
import AgoraSubnav from "./AgoraSubnav";
import { useAgoraAuth } from "./AgoraGate";

interface HistoryItem {
  type: "rtc" | "rtm" | "admin";
  timestamp: string;
}

interface Stats {
  totalRequests: number;
  rtcRequests: number;
  rtmRequests: number;
  adminRequests: number;
  lastReset: string;
  requestHistory: HistoryItem[];
}

const TYPE_BADGE: Record<HistoryItem["type"], string> = {
  rtc: "bg-danger-subtle text-danger",
  rtm: "bg-info-subtle text-info",
  admin: "bg-warning-subtle text-warning",
};

export default function AgoraAnalytics() {
  const { authedFetch } = useAgoraAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const r = await authedFetch<{ success: boolean; stats: Stats }>("/api/agora/admin/stats");
      setStats(r.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async () => {
    if (!confirm("Reset all Agora statistics? This cannot be undone.")) return;
    setResetting(true);
    try {
      await authedFetch("/api/agora/admin/stats/reset", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <AgoraSubnav />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">Analytics &amp; Request History</h4>
          <p className="text-muted fs-13 mb-0">
            Last 100 token requests are kept in memory and persisted to disk.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light" onClick={load} disabled={loading}>
            <i className="ri-refresh-line me-1"></i> Refresh
          </button>
          <button className="btn btn-outline-danger" onClick={handleReset} disabled={resetting}>
            <i className="ri-delete-bin-line me-1"></i> {resetting ? "Resetting…" : "Reset Stats"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger fs-13">{error}</div>}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Recent Requests</h5>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" />
            </div>
          ) : !stats?.requestHistory?.length ? (
            <p className="text-muted text-center py-4 mb-0">No requests recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Type</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.requestHistory.slice(0, 50).map((item, idx) => (
                    <tr key={`${item.timestamp}-${idx}`}>
                      <td>
                        <span className={`badge ${TYPE_BADGE[item.type]} text-uppercase`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="font-monospace fs-13">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
