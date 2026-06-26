"use client";

import { useState, useEffect } from "react";
import {
  getUsersByRole,
  assignUserRole,
  updateUserActivityZone,
  updateUserStats,
  assignCoinsToUser,
  updateUserXp,
  ACTIVITY_ZONES,
  FullAppUser,
  ActivityZoneValue,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// Only roles actually supported by the backend's app side. Staff roles
// (admin / merchant / agency / country-admin …) are panel-only and are
// not assignable here, so the Change Role action is limited to these two.
const APP_ROLES = [
  { value: "user", label: "User", color: "bg-secondary" },
  { value: "host", label: "Host", color: "bg-purple" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStats = (user: FullAppUser) => ({
  stars:    user.stats?.stars    ?? user.stars    ?? 0,
  diamonds: user.stats?.diamonds ?? user.diamonds ?? 0,
  coins:    user.stats?.coins    ?? user.totalBoughtCoins ?? user.coins ?? 0,
});

const getRoleBadgeCls = (role?: string) => {
  const map: Record<string, string> = {
    "admin":             "bg-danger",
    "sub-admin":         "bg-warning text-dark",
    "merchant":          "bg-success",
    "re-seller":         "bg-info text-dark",
    "agency":            "bg-primary",
    "host":              "bg-purple",
    "user":              "bg-secondary",
    "country-admin":     "bg-teal",
    "country-sub-admin": "bg-cyan text-dark",
  };
  return map[role ?? ""] ?? "bg-secondary";
};

const getZoneBadgeCls = (zone?: string) =>
  ACTIVITY_ZONES.find((z) => z.value === zone)?.badgeCls ?? "bg-success";

const getZoneLabel = (zone?: string) =>
  ACTIVITY_ZONES.find((z) => z.value === zone)?.label ?? "Active";

const normalizeRoleForCoinTransfer = (role?: string) => {
  const r = (role ?? "").toLowerCase().trim();
  if (r === "reseller") return "re-seller";
  if (r === "host") return "user";
  return r;
};

const getAllowedCoinTargets = (senderRole?: string): string[] => {
  const sender = normalizeRoleForCoinTransfer(senderRole);
  // Admin can assign coins to a merchant or directly to an end user
  // (hosts normalize to "user"). Mirrors the backend chain rule.
  if (sender === "admin") return ["merchant", "user"];
  if (sender === "merchant") return ["re-seller", "user"];
  if (sender === "re-seller") return ["user"];
  return [];
};

const formatRoleLabel = (role: string) =>
  role
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Types for modal ──────────────────────────────────────────────────────────
type ModalType = "role" | "zone" | "stats" | "xp" | null;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AllUsersPage() {
  const { user: authUser } = useAuth();
  // Admin + Sub Admin can manage users (change role, update status,
  // adjust stars/diamonds). Sub Admin has admin-like power EXCEPT they
  // can't assign coins to users — that's enforced separately by the
  // coin-target rules (getAllowedCoinTargets returns [] for sub-admin).
  // Other roles (reseller, merchant) only get the coin action.
  const role = (authUser?.userRole ?? "").toLowerCase();
  const canManageUsers = role === "admin" || role === "sub-admin";
  // The XP grant endpoint is Admin-only (sub-admin would get 403), so the
  // Grant XP action is shown to full admins only.
  const canGrantXp = role === "admin";
  const [users, setUsers] = useState<FullAppUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalUser, setModalUser] = useState<FullAppUser | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form values
  const [newRole, setNewRole] = useState("");
  const [newZone, setNewZone] = useState<ActivityZoneValue>("safe");
  const [zoneTill, setZoneTill] = useState("");
  const [statsForm, setStatsForm] = useState({ stars: "", diamonds: "", coins: "" });
  const [xpAmount, setXpAmount] = useState("");
  const [xpResult, setXpResult] = useState<{ totalEarnedXp: number; level: number } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setPageError("");
    try {
      // App User list shows end users only (role "user"); staff-role
      // filtering was removed from this page.
      const resp = await getUsersByRole("user", { page: "1", limit: "100" });
      setUsers(resp.users);
      // Real total from the server's pagination, not the page-limited
      // length of the rows we just received.
      setTotalUsers(resp.total ?? resp.users.length);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.username ?? u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  // ── Open modals ──────────────────────────────────────────────────────────────
  const openRoleModal = (user: FullAppUser) => {
    setNewRole(user.userRole ?? user.role ?? "user");
    setModalUser(user);
    setModalType("role");
    setModalError("");
  };
  const openZoneModal = (user: FullAppUser) => {
    setNewZone((user.activityZone?.zone ?? "safe") as ActivityZoneValue);
    setZoneTill("");
    setModalUser(user);
    setModalType("zone");
    setModalError("");
  };
  const openStatsModal = (user: FullAppUser) => {
    setStatsForm({ stars: "", diamonds: "", coins: "" });
    setModalUser(user);
    setModalType("stats");
    setModalError("");
  };
  const openXpModal = (user: FullAppUser) => {
    setXpAmount("");
    setXpResult(null);
    setModalUser(user);
    setModalType("xp");
    setModalError("");
  };
  const closeModal = () => {
    setModalType(null);
    setModalUser(null);
    setModalLoading(false);
    setModalError("");
    setXpResult(null);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleRoleChange = async () => {
    if (!modalUser) return;
    setModalLoading(true);
    setModalError("");
    try {
      await assignUserRole(newRole, modalUser._id);
      closeModal();
      fetchUsers();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to assign role");
    } finally {
      setModalLoading(false);
    }
  };

  const handleZoneChange = async () => {
    if (!modalUser) return;
    setModalLoading(true);
    setModalError("");
    try {
      await updateUserActivityZone({
        id: modalUser._id,
        zone: newZone,
        ...(newZone === "temp_block" && zoneTill ? { dateTill: new Date(zoneTill).toISOString() } : {}),
      });
      closeModal();
      fetchUsers();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatsUpdate = async () => {
    if (!modalUser) return;
    setModalLoading(true);
    setModalError("");
    try {
      const promises: Promise<unknown>[] = [];
      const starsRaw = parseInt(statsForm.stars, 10);
      const diamondsRaw = parseInt(statsForm.diamonds, 10);
      const coinsRaw = parseInt(statsForm.coins, 10);

      const stars = Number.isNaN(starsRaw) ? 0 : starsRaw;
      const diamonds = Number.isNaN(diamondsRaw) ? 0 : diamondsRaw;
      const coins = Number.isNaN(coinsRaw) ? 0 : coinsRaw;

      if (stars !== 0 || diamonds !== 0) {
        promises.push(
          updateUserStats(modalUser._id, {
            ...(stars    !== 0 ? { stars }    : {}),
            ...(diamonds !== 0 ? { diamonds } : {}),
          })
        );
      }
      if (coins !== 0) {
        if (coins < 0) {
          throw new Error("Coin transfer amount must be greater than 0.");
        }

        const senderRole = normalizeRoleForCoinTransfer(authUser?.userRole);
        const targetRole = normalizeRoleForCoinTransfer(
          modalUser.userRole ?? modalUser.role ?? "user"
        );
        const allowedTargets = getAllowedCoinTargets(senderRole);

        if (!allowedTargets.includes(targetRole)) {
          const senderLabel = senderRole ? formatRoleLabel(senderRole) : "Current Role";
          const targetsLabel =
            allowedTargets.length > 0
              ? allowedTargets.map(formatRoleLabel).join(", ")
              : "none";
          throw new Error(
            `${senderLabel} can assign coins only to: ${targetsLabel}.`
          );
        }

        promises.push(
          assignCoinsToUser({
            userId:   modalUser._id,
            coins,
            userRole: targetRole,
          })
        );
      }
      if (promises.length > 0) await Promise.all(promises);
      closeModal();
      fetchUsers();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to update credits");
    } finally {
      setModalLoading(false);
    }
  };

  const handleXpGrant = async () => {
    if (!modalUser) return;
    const amount = Number(xpAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setModalError("XP amount must be a number greater than 0.");
      return;
    }
    setModalLoading(true);
    setModalError("");
    try {
      const result = await updateUserXp(modalUser._id, amount);
      // Show the new total/level inline rather than closing immediately, so
      // the admin sees the effect (and any level-up) of the grant.
      setXpResult(result);
      setXpAmount("");
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to update user XP");
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
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
                <li className="breadcrumb-item active">App User</li>
              </ol>
            </div>
            <h4 className="page-title">User Management</h4>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        {/* Search */}
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

      {/* Error */}
      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>
          {pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}

      {/* Table Card */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-group-line me-2 text-primary"></i>
            Users{" "}
            <span className="badge bg-secondary ms-1">
              {searchQuery ? filtered.length : (totalUsers ?? filtered.length)}
            </span>
          </h4>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <i className={`ri-refresh-line me-1 ${isLoading ? "spin-anim" : ""}`}></i>
            Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-group-line fs-1 d-block mb-2"></i>
              No users found
            </div>
          ) : (
            <div className="table-responsive users-table-wrap">
              <table className="table table-hover table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>User ID</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Stars</th>
                    <th>Diamonds</th>
                    <th>Coins</th>
                    <th className="text-center sticky-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => {
                    const stats = getStats(user);
                    const initial = (user.username ?? user.name ?? "U").charAt(0).toUpperCase();
                    return (
                      <tr key={user._id ?? idx}>
                        <td>
                          {/* Whole cell is a link to the user detail page,
                              where richer actions (Grant Item with preview,
                              etc.) live. */}
                          <Link
                            href={`/admin/users/${user._id}`}
                            className="d-flex align-items-center gap-2 text-decoration-none text-reset"
                          >
                            <div
                              className="avatar-sm rounded-circle bg-primary bg-opacity-15 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-primary"
                              style={{ width: 36, height: 36, fontSize: 14 }}
                            >
                              {user.profileImage || user.avatar ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={user.profileImage ?? user.avatar}
                                  alt={initial}
                                  className="rounded-circle w-100 h-100 object-fit-cover"
                                />
                              ) : initial}
                            </div>
                            <div>
                              <div className="fw-medium">
                                {user.username ?? user.name ?? "Unknown"}
                              </div>
                              <div className="text-muted fs-12">
                                {user.email ?? "–"}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td>
                          <span className="fw-medium text-muted">
                            {user.userId ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeCls(user.userRole ?? user.role)} text-capitalize`}>
                            {user.userRole ?? user.role ?? "user"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getZoneBadgeCls(user.activityZone?.zone)}`}>
                            {getZoneLabel(user.activityZone?.zone)}
                          </span>
                        </td>
                        <td>
                          <span className="text-warning fw-medium">
                            <i className="ri-star-line me-1"></i>
                            {stats.stars.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className="text-info fw-medium">
                            <i className="ri-gem-line me-1"></i>
                            {stats.diamonds.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className="text-warning-emphasis fw-medium">
                            <i className="ri-copper-coin-line me-1"></i>
                            {stats.coins.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-center sticky-actions-col">
                          <div className="d-flex gap-1 justify-content-center">
                            {canManageUsers && (
                              <>
                                <button
                                  className="btn btn-sm btn-soft-primary"
                                  title="Change Role"
                                  onClick={() => openRoleModal(user)}
                                >
                                  <i className="ri-admin-line"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-soft-warning"
                                  title="Update Status"
                                  onClick={() => openZoneModal(user)}
                                >
                                  <i className="ri-shield-user-line"></i>
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-sm btn-soft-success"
                              title="Update Credits (Stars / Diamonds / Coins)"
                              onClick={() => openStatsModal(user)}
                            >
                              <i className="ri-copper-coin-line"></i>
                            </button>
                            {canGrantXp && (
                              <button
                                className="btn btn-sm btn-soft-info"
                                title="Grant XP"
                                onClick={() => openXpModal(user)}
                              >
                                <i className="ri-medal-line"></i>
                              </button>
                            )}
                          </div>
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

      {/* ── Role Modal ──────────────────────────────────────────────────────────── */}
      {modalType === "role" && modalUser && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-admin-line me-2 text-primary"></i>
                  Change Role
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Update role for{" "}
                  <strong>{modalUser.username ?? modalUser.name}</strong>
                </p>
                {modalError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{modalError}
                  </div>
                )}
                <div className="row g-2">
                  {APP_ROLES.map((r) => (
                    <div key={r.value} className="col-6">
                      <div
                        className={`p-2 border rounded-2 cursor-pointer ${newRole === r.value ? "border-primary bg-primary bg-opacity-10" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setNewRole(r.value)}
                      >
                        <span className={`badge ${r.color} me-2`}>&nbsp;</span>
                        <span className="fs-13">{r.label}</span>
                        {newRole === r.value && (
                          <i className="ri-check-line float-end text-primary"></i>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRoleChange}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  ) : "Save Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Zone Modal ──────────────────────────────────────────────────────────── */}
      {modalType === "zone" && modalUser && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-shield-user-line me-2 text-warning"></i>
                  Update Status
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Update activity status for{" "}
                  <strong>{modalUser.username ?? modalUser.name}</strong>
                </p>
                {modalError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{modalError}
                  </div>
                )}
                <div className="list-group mb-3">
                  {ACTIVITY_ZONES.map((z) => (
                    <button
                      key={z.value}
                      className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${newZone === z.value ? "active" : ""}`}
                      onClick={() => setNewZone(z.value as ActivityZoneValue)}
                    >
                      <span className={`badge ${z.badgeCls}`}>&nbsp;</span>
                      {z.label}
                      {newZone === z.value && (
                        <i className="ri-check-line ms-auto"></i>
                      )}
                    </button>
                  ))}
                </div>
                {newZone === "temp_block" && (
                  <div className="mb-2">
                    <label className="form-label fs-13">Block Until</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={zoneTill}
                      onChange={(e) => setZoneTill(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-warning text-dark"
                  onClick={handleZoneChange}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  ) : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Modal ─────────────────────────────────────────────────────────── */}
      {modalType === "stats" && modalUser && (() => {
        const cur = getStats(modalUser);
        const senderRole = normalizeRoleForCoinTransfer(authUser?.userRole);
        const targetRole = normalizeRoleForCoinTransfer(
          modalUser.userRole ?? modalUser.role ?? "user"
        );
        const allowedTargets = getAllowedCoinTargets(senderRole);
        const canTransferCoins = allowedTargets.includes(targetRole);
        return (
          <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="ri-copper-coin-line me-2 text-success"></i>
                    Update Credits
                  </h5>
                  <button className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-3">
                    Adjust credits for{" "}
                    <strong>{modalUser.username ?? modalUser.name}</strong>
                  </p>
                  {modalError && (
                    <div className="alert alert-danger py-2 fs-13">
                      <i className="ri-error-warning-line me-1"></i>{modalError}
                    </div>
                  )}
                  <div className="alert alert-info py-2 fs-12 mb-3">
                    <i className="ri-information-line me-1"></i>
                    Stars and diamonds can be positive/negative. Coin transfer must be a
                    positive value and follows chain rules.
                    <br />
                    <strong>Your role:</strong> {senderRole ? formatRoleLabel(senderRole) : "Unknown"}
                    <span className="mx-1">|</span>
                    <strong>Allowed targets:</strong>{" "}
                    {allowedTargets.length > 0
                      ? allowedTargets.map(formatRoleLabel).join(", ")
                      : "None"}
                  </div>

                  {/* Stars + Diamonds — admin / sub-admin only. Other
                      roles (reseller, merchant) only transfer coins. */}
                  {canManageUsers && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fs-13 d-flex justify-content-between">
                          <span><i className="ri-star-line me-1 text-warning"></i>Stars</span>
                          <span className="text-muted">Current: {cur.stars.toLocaleString()}</span>
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Amount to add (e.g. 100 or -50)"
                          value={statsForm.stars}
                          onChange={(e) => setStatsForm({ ...statsForm, stars: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fs-13 d-flex justify-content-between">
                          <span><i className="ri-gem-line me-1 text-info"></i>Diamonds</span>
                          <span className="text-muted">Current: {cur.diamonds.toLocaleString()}</span>
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Amount to add (e.g. 100 or -50)"
                          value={statsForm.diamonds}
                          onChange={(e) => setStatsForm({ ...statsForm, diamonds: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* Coins */}
                  <div className="mb-0">
                    <label className="form-label fs-13 d-flex justify-content-between">
                      <span><i className="ri-copper-coin-line me-1 text-warning-emphasis"></i>Coins</span>
                      <span className="text-muted">Current: {cur.coins.toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder={
                        canTransferCoins
                          ? "Amount to transfer (e.g. 100)"
                          : `Coin transfer not allowed for target role ${formatRoleLabel(targetRole)}`
                      }
                      value={statsForm.coins}
                      onChange={(e) => setStatsForm({ ...statsForm, coins: e.target.value })}
                      disabled={!canTransferCoins}
                    />
                    {!canTransferCoins && (
                      <p className="text-danger fs-12 mt-1 mb-0">
                        {senderRole ? formatRoleLabel(senderRole) : "Current role"} cannot transfer coins to {formatRoleLabel(targetRole)}.
                      </p>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleStatsUpdate}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <><span className="spinner-border spinner-border-sm me-1" />Updating…</>
                    ) : "Update Credits"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Grant XP Modal ──────────────────────────────────────────────────────── */}
      {modalType === "xp" && modalUser && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-medal-line me-2 text-info"></i>
                  Grant XP
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Add XP for{" "}
                  <strong>{modalUser.username ?? modalUser.name}</strong>. The user&apos;s
                  level is recalculated from their new total; a level-up notifies them in
                  real time.
                </p>
                {modalError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{modalError}
                  </div>
                )}
                {xpResult && (
                  <div className="alert alert-success py-2 fs-13">
                    <i className="ri-check-line me-1"></i>
                    XP added. New total:{" "}
                    <strong>{xpResult.totalEarnedXp.toLocaleString()}</strong> XP — Level{" "}
                    <strong>{xpResult.level}</strong>.
                  </div>
                )}
                <label className="form-label fs-13">XP to add</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                />
                <p className="text-muted fs-12 mt-1 mb-0">
                  Must be greater than 0. XP only increases — it is added to the existing total.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>
                  {xpResult ? "Close" : "Cancel"}
                </button>
                <button
                  className="btn btn-info text-white"
                  onClick={handleXpGrant}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Granting…</>
                  ) : "Grant XP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline style for spin animation */}
      <style>{`
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* Pin the Actions column to the right edge so the Update
           Credits button is reachable without horizontal scroll on
           narrower viewports. */
        .users-table-wrap { position: relative; }
        .users-table-wrap .sticky-actions-col {
          position: sticky;
          right: 0;
          background: inherit;
          z-index: 2;
          box-shadow: -6px 0 8px -6px rgba(0, 0, 0, 0.08);
        }
        .users-table-wrap thead .sticky-actions-col {
          background: var(--bs-table-bg, #f3f3f9);
        }
        .users-table-wrap tbody tr { background-color: #fff; }
        .users-table-wrap tbody tr:hover { background-color: var(--bs-table-hover-bg, #f8f9fa); }
        .users-table-wrap tbody tr:hover .sticky-actions-col {
          background: var(--bs-table-hover-bg, #f8f9fa);
        }
        .users-table-wrap tbody .sticky-actions-col { background: #fff; }
      `}</style>
    </>
  );
}
