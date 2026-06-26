"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminRooms, AudioRoom } from "@/lib/api";

export type RoomFilter = "all" | "active" | "locked";

const titles: Record<RoomFilter, { title: string; crumb: string; emptyText: string; icon: string; iconCls: string }> = {
  all:    { title: "All Rooms",    crumb: "All Rooms",    emptyText: "No rooms found",        icon: "ri-mic-line",       iconCls: "text-primary" },
  active: { title: "Active Rooms", crumb: "Active Rooms", emptyText: "No active rooms right now", icon: "ri-broadcast-line", iconCls: "text-success" },
  locked: { title: "Locked Rooms", crumb: "Locked Rooms", emptyText: "No locked rooms",       icon: "ri-lock-line",      iconCls: "text-warning" },
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return "—"; }
};

export default function RoomListView({ filter }: { filter: RoomFilter }) {
  const meta = titles[filter];
  const [rooms, setRooms] = useState<AudioRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    setPageError("");
    // The admin room endpoints run a heavy per-room hydration pipeline,
    // so large lists can take ~1 minute. Abort after 2 min so a stalled
    // request fails cleanly instead of spinning forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      // Server-side filtered via the admin endpoints
      // (/api/audio-room/admin/{all|active|locked}).
      const { rooms } = await getAdminRooms(filter, controller.signal);
      setRooms(rooms);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setPageError(
          "Loading the room list timed out (the server took over 2 minutes). Try again, or narrow the view (Active / Locked)."
        );
      } else {
        setPageError(e instanceof Error ? e.message : "Failed to load rooms");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    // Backend already scopes the list (all / active / locked); we only
    // apply the client-side search box here.
    const list = rooms;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.title ?? "").toLowerCase().includes(q) ||
        (r.roomId ?? "").toLowerCase().includes(q) ||
        (r.hostSeat?.member?.name ?? "").toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Rooms</li>
                <li className="breadcrumb-item active">{meta.crumb}</li>
              </ol>
            </div>
            <h4 className="page-title">{meta.title}</h4>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text"><i className="ri-search-line"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, ID, or host…"
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
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className={`${meta.icon} me-2 ${meta.iconCls}`}></i>
            {meta.title}{" "}
            <span className="badge bg-secondary ms-1">{filtered.length}</span>
          </h4>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchRooms} disabled={loading}>
            <i className={`ri-refresh-line me-1 ${loading ? "spin-anim" : ""}`}></i>Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="text-muted fs-13 mt-3">
                Loading rooms… large lists can take up to a minute.
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className={`${meta.icon} fs-1 d-block mb-2`}></i>
              {meta.emptyText}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Room</th>
                    <th>Host</th>
                    <th>Seats</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Lock</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const host = r.hostSeat?.member;
                    const initial = (r.title ?? "R").charAt(0).toUpperCase();
                    return (
                      <tr key={r._id ?? r.roomId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded bg-primary bg-opacity-15 d-flex align-items-center justify-content-center fw-bold text-primary"
                              style={{ width: 38, height: 38, fontSize: 14 }}
                            >
                              {r.roomPhoto ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={r.roomPhoto} alt={initial} className="w-100 h-100 object-fit-cover rounded" />
                              ) : initial}
                            </div>
                            <div>
                              <div className="fw-medium">{r.title ?? "Untitled"}</div>
                              <div className="text-muted fs-12">ID: {r.roomId ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {host ? (
                            <div className="d-flex align-items-center gap-2">
                              {host.avatar && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={host.avatar} alt="" className="rounded-circle" style={{ width: 28, height: 28, objectFit: "cover" }} />
                              )}
                              <div>
                                <div className="fs-13">{host.name ?? "—"}</div>
                                <div className="text-muted fs-12">UID {host.userId ?? "—"}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted fs-13">—</span>
                          )}
                        </td>
                        <td>{r.numberOfSeats ?? "—"}</td>
                        <td>{r.membersCount ?? r.membersArray?.length ?? 0}</td>
                        <td>
                          {r.isHostPresent ? (
                            <span className="badge bg-success">Live</span>
                          ) : (
                            <span className="badge bg-secondary">Idle</span>
                          )}
                        </td>
                        <td>
                          {r.isLocked ? (
                            <span className="badge bg-warning text-dark"><i className="ri-lock-line me-1"></i>Locked</span>
                          ) : (
                            <span className="badge bg-light text-muted"><i className="ri-lock-unlock-line me-1"></i>Open</span>
                          )}
                        </td>
                        <td className="fs-13 text-muted">{formatDate(r.createdAt)}</td>
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
