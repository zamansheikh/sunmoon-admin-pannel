"use client";

import { useEffect, useState } from "react";
import { getOnlineUsers, OnlineUser } from "@/lib/api";

const initialOf = (s?: string) => (s ?? "U").charAt(0).toUpperCase();

export default function ActiveUsersPage() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setPageError("");
    try {
      // Live presence from the socket server (GET /api/auth/online-users).
      const resp = await getOnlineUsers({ page: "1", limit: "200" });
      setUsers(resp.users ?? []);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load online users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Users</li>
                <li className="breadcrumb-item active">Active App User</li>
              </ol>
            </div>
            <h4 className="page-title">Active App User</h4>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-6">
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
            <i className="ri-pulse-line me-2 text-success"></i>
            Active App User{" "}
            <span className="badge bg-secondary ms-1">{filtered.length}</span>
          </h4>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchUsers} disabled={loading}>
            <i className={`ri-refresh-line me-1 ${loading ? "spin-anim" : ""}`}></i>Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-group-line fs-1 d-block mb-2"></i>
              No users online right now
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>User ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const display = u.name ?? "Unknown";
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-success bg-opacity-15 d-flex align-items-center justify-content-center fw-bold text-success position-relative"
                              style={{ width: 36, height: 36, fontSize: 14 }}
                            >
                              {u.avatar ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={u.avatar} alt={display} className="rounded-circle w-100 h-100 object-fit-cover" />
                              ) : initialOf(display)}
                            </div>
                            <div>
                              <div className="fw-medium">{display}</div>
                              <div className="text-muted fs-12">{u.email ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted fs-13">{u.userId ?? "—"}</td>
                        <td>
                          <span className="badge bg-success">
                            <i className="ri-circle-fill me-1" style={{ fontSize: 8 }}></i>
                            Online
                          </span>
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
