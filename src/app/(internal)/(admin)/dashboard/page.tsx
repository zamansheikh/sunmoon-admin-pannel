"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import {
  getUsersByRole,
  getOnlineUsers,
  getBannedUsers,
  getStoreCategories,
  OnlineUser,
} from "@/lib/api";

// ─── Self-contained SVG donut (no chart dependency) ───────────────────────────
function Donut({
  segments,
  size = 170,
  stroke = 24,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="position-relative d-inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f5" strokeWidth={stroke} />
          {segments.map((seg, i) => {
            const len = (seg.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div className="position-absolute top-50 start-50 translate-middle text-center">
        <h3 className="fw-bold mb-0">{centerValue}</h3>
        <small className="text-muted">{centerLabel}</small>
      </div>
    </div>
  );
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
  : n.toLocaleString();

type Stats = {
  totalUsers: number;
  hosts: number;
  online: number;
  banned: number;
  categories: number;
  onlineList: OnlineUser[];
};

const EMPTY: Stats = {
  totalUsers: 0, hosts: 0, online: 0, banned: 0, categories: 0, onlineList: [],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // Parallel + allSettled so one slow/failed endpoint never blocks the rest.
    const [usersR, hostsR, onlineR, bannedR, catsR] = await Promise.allSettled([
      getUsersByRole("user", { page: "1", limit: "1" }),
      getUsersByRole("host", { page: "1", limit: "1" }),
      getOnlineUsers({ page: "1", limit: "60" }),
      getBannedUsers({ page: "1", limit: "1" }),
      getStoreCategories(),
    ]);

    const next: Stats = { ...EMPTY };
    if (usersR.status === "fulfilled") next.totalUsers = usersR.value.total ?? usersR.value.users.length;
    if (hostsR.status === "fulfilled") next.hosts = hostsR.value.total ?? hostsR.value.users.length;
    if (onlineR.status === "fulfilled") {
      next.online = onlineR.value.pagination?.total ?? onlineR.value.users.length;
      next.onlineList = onlineR.value.users;
    }
    if (bannedR.status === "fulfilled") next.banned = bannedR.value.pagination?.total ?? bannedR.value.users.length;
    if (catsR.status === "fulfilled") next.categories = catsR.value.length;

    if ([usersR, hostsR, onlineR].every((r) => r.status === "rejected")) {
      setError("Couldn't reach the server. Check your session and try again.");
    }
    setStats(next);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onlinePct = stats.totalUsers > 0
    ? Math.min(100, Math.round((stats.online / stats.totalUsers) * 100))
    : 0;
  const hostPct = stats.totalUsers > 0
    ? Math.round((stats.hosts / stats.totalUsers) * 100)
    : 0;
  const bannedPct = stats.totalUsers > 0
    ? Math.round((stats.banned / stats.totalUsers) * 100)
    : 0;

  const cards = [
    { title: "Total App Users", value: fmt(stats.totalUsers), sub: "Registered (role: user)", icon: "ri-group-line", bg: "bg-primary" },
    { title: "Hosts", value: fmt(stats.hosts), sub: "Promoted hosts", icon: "ri-mic-line", bg: "bg-purple" },
    { title: "Online Now", value: fmt(stats.online), sub: "Live socket sessions", icon: "ri-pulse-line", bg: "bg-success" },
    { title: "Banned Users", value: fmt(stats.banned), sub: "Temp + permanent", icon: "ri-forbid-line", bg: "bg-danger" },
  ];

  const donutSegments = [
    { label: "Users", value: Math.max(0, stats.totalUsers - stats.hosts - stats.banned), color: "#4f8ef7" },
    { label: "Hosts", value: stats.hosts, color: "#7c4ee4" },
    { label: "Banned", value: stats.banned, color: "#f1556c" },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <h4 className="page-title">Dashboard</h4>
            <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
              <i className={`ri-refresh-line me-1 ${loading ? "spin-anim" : ""}`}></i>Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{error}
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="row align-items-stretch g-3 mb-3">
        {cards.map((card, idx) => (
          <div key={idx} className="col-xxl-3 col-md-6 col-12 d-flex">
            <div className="card h-100 mb-0 w-100">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <p className="text-muted fs-13 mb-1">{card.title}</p>
                    {loading ? (
                      <div className="placeholder-glow"><span className="placeholder col-6" style={{ height: 28, display: "inline-block", width: 70 }} /></div>
                    ) : (
                      <h3 className="fw-bold mb-0">{card.value}</h3>
                    )}
                    <p className="text-muted fs-12 mb-0">{card.sub}</p>
                  </div>
                  <div className={`rounded ${card.bg} bg-opacity-15 d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: 48, height: 48 }}>
                    <i className={`${card.icon} fs-22 ${card.bg.replace("bg-", "text-")}`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Composition donut + snapshot + live list ── */}
      <div className="row align-items-stretch g-3 mb-3">
        {/* User Composition donut */}
        <div className="col-xxl-4 d-flex">
          <div className="card h-100 mb-0 w-100">
            <div className="card-header">
              <h4 className="header-title mb-0">User Composition</h4>
            </div>
            <div className="card-body text-center">
              <Donut
                segments={donutSegments}
                centerValue={fmt(stats.totalUsers)}
                centerLabel="Total"
              />
              <div className="mt-3">
                {donutSegments.map((s) => (
                  <div key={s.label} className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fs-13">
                      <i className="ri-circle-fill me-1" style={{ color: s.color, fontSize: 10 }}></i>
                      {s.label}
                    </span>
                    <span className="fw-semibold fs-13">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Platform snapshot — progress bars */}
        <div className="col-xxl-4 d-flex">
          <div className="card h-100 mb-0 w-100">
            <div className="card-header">
              <h4 className="header-title mb-0">Platform Snapshot</h4>
            </div>
            <div className="card-body">
              {[
                { label: "Online right now", pct: onlinePct, val: `${fmt(stats.online)} / ${fmt(stats.totalUsers)}`, cls: "bg-success" },
                { label: "Hosts share", pct: hostPct, val: `${fmt(stats.hosts)} hosts`, cls: "bg-purple" },
                { label: "Banned share", pct: bannedPct, val: `${fmt(stats.banned)} banned`, cls: "bg-danger" },
              ].map((b, i) => (
                <div key={i} className="mb-3">
                  <div className="d-flex justify-content-between fs-13 mb-1">
                    <span>{b.label}</span>
                    <span className="fw-semibold">{b.val}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className={`progress-bar ${b.cls}`} style={{ width: `${b.pct}%` }} role="progressbar" />
                  </div>
                </div>
              ))}

              <div className="d-flex align-items-center gap-3 mt-4 pt-2 border-top border-dashed">
                <div className="rounded bg-info bg-opacity-15 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                  <i className="ri-store-2-line fs-20 text-info"></i>
                </div>
                <div>
                  <p className="text-muted fs-12 mb-0">Store Categories</p>
                  <h5 className="mb-0 fw-semibold">{loading ? "…" : stats.categories}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live now list */}
        <div className="col-xxl-4 d-flex">
          <div className="card h-100 mb-0 w-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-circle-fill text-success me-1" style={{ fontSize: 9 }}></i>
                Live Now
              </h4>
              <span className="badge bg-success-subtle text-success">{fmt(stats.online)} online</span>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 360, overflowY: "auto" }}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              ) : stats.onlineList.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ri-user-line fs-1 d-block mb-2"></i>
                  No one online right now
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {stats.onlineList.map((u) => {
                    const name = u.name ?? "User";
                    const initial = name.charAt(0).toUpperCase();
                    return (
                      <li key={u._id} className="list-group-item d-flex align-items-center gap-2 py-2">
                        <div className="position-relative">
                          {u.avatar ? (
                            <img src={u.avatar} alt={name} className="rounded-circle" style={{ width: 34, height: 34, objectFit: "cover" }} />
                          ) : (
                            <span className="rounded-circle bg-success bg-opacity-15 text-success d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 34, height: 34, fontSize: 13 }}>
                              {initial}
                            </span>
                          )}
                          <span className="position-absolute bottom-0 end-0 bg-success border border-light rounded-circle" style={{ width: 9, height: 9 }} />
                        </div>
                        <div className="flex-grow-1 min-width-0">
                          <p className="mb-0 fw-medium fs-13 text-truncate">{name}</p>
                          <small className="text-muted">{u.email ?? (u.userId ? `UID ${u.userId}` : "")}</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } } .min-width-0{min-width:0;}`}</style>
    </>
  );
}
