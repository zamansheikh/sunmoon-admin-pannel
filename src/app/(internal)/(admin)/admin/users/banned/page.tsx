"use client";

import { useEffect, useState } from "react";
import {
  getBannedUsers,
  updateUserActivityZone,
  BannedUser,
  ACTIVITY_ZONES,
} from "@/lib/api";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const zoneLabel = (zone?: string) =>
  ACTIVITY_ZONES.find((z) => z.value === zone)?.label ?? "Banned";

const zoneBadgeCls = (zone?: string) =>
  ACTIVITY_ZONES.find((z) => z.value === zone)?.badgeCls ?? "bg-danger";

export default function BannedUsersPage() {
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [unbanning, setUnbanning] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setPageError("");
    try {
      const resp = await getBannedUsers({ page: "1", limit: "200" });
      setUsers(resp.users ?? []);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load banned users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.username ?? u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  const handleUnban = async (user: BannedUser) => {
    if (!confirm(`Unban "${user.username ?? user.name ?? user._id}"?`)) return;
    setUnbanning(user._id);
    try {
      await updateUserActivityZone({ id: user._id, zone: "safe" });
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to unban user");
    } finally {
      setUnbanning(null);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Users</li>
                <li className="breadcrumb-item active">Banned Users</li>
              </ol>
            </div>
            <h4 className="page-title">Banned Users</h4>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text"><i className="ri-search-line"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by username or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn btn-outline-secondary" onClick={() => setSearchQuery("")}>
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>
          {pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-forbid-line me-2 text-danger"></i>
            Banned Users{" "}
            <span className="badge bg-secondary ms-1">{filtered.length}</span>
          </h4>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchUsers}
            disabled={loading}
          >
            <i className={`ri-refresh-line me-1 ${loading ? "spin-anim" : ""}`}></i>
            Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-forbid-line fs-1 d-block mb-2"></i>
              No banned users
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Banned Till</th>
                    <th>Reason</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const display = u.username ?? u.name ?? "Unknown";
                    const initial = display.charAt(0).toUpperCase();
                    const zone = u.activityZone?.zone ?? "permanent_block";
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-danger bg-opacity-15 d-flex align-items-center justify-content-center fw-bold text-danger"
                              style={{ width: 36, height: 36, fontSize: 14 }}
                            >
                              {u.profileImage || u.avatar ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={u.profileImage ?? u.avatar}
                                  alt={initial}
                                  className="rounded-circle w-100 h-100 object-fit-cover"
                                />
                              ) : initial}
                            </div>
                            <div>
                              <div className="fw-medium">{display}</div>
                              <div className="text-muted fs-12">ID: {u._id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted fs-13">{u.email ?? "—"}</td>
                        <td>
                          <span className={`badge ${zoneBadgeCls(zone)}`}>
                            {zoneLabel(zone)}
                          </span>
                        </td>
                        <td className="fs-13">
                          {u.activityZone?.expire ? formatDate(u.activityZone.expire) : "Permanent"}
                        </td>
                        <td className="fs-13 text-muted">
                          {u.banReason ?? "—"}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-soft-success"
                            title="Unban user"
                            onClick={() => handleUnban(u)}
                            disabled={unbanning === u._id}
                          >
                            {unbanning === u._id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <>
                                <i className="ri-check-double-line me-1"></i>
                                Unban
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
