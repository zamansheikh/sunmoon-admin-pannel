"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getAllPortalUsers,
  addPermissions,
  removePermissions,
  deleteRole,
  assignCoinsToUser,
  PortalUser,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Backend coin-assignment hierarchy (assignCoinToUser):
//   Admin    → sub-admin, re-seller, user
//   SubAdmin → user
//   Reseller → user
// Only these sender→receiver pairs are accepted; everything else is
// rejected server-side, so we gate the Coin Adjust button accordingly.
const COIN_RECEIVERS: Record<string, string[]> = {
  admin: ["sub-admin", "re-seller", "user"],
  "sub-admin": ["user"],
  "re-seller": ["user"],
};

const canAssignCoinTo = (senderRole: string | undefined, targetRole?: string) => {
  const s = (senderRole ?? "").toLowerCase();
  const t = (targetRole ?? "").toLowerCase();
  return (COIN_RECEIVERS[s] ?? []).includes(t);
};

// The 7 staff permissions the backend recognises (hyphen form is what
// create-role / the permission endpoints expect).
const ALL_PERMISSIONS = [
  { value: "coin-distributor", label: "Coin Distributor" },
  { value: "promote-user", label: "Promote User" },
  { value: "update-users", label: "Update Users" },
  { value: "block-user", label: "Block User" },
  { value: "device-ban", label: "Device Ban" },
  { value: "live-room-close", label: "Live Room Close" },
  { value: "create-user-account", label: "Create User Account" },
];

const formatRole = (r?: string) =>
  (r ?? "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getZoneBadge = (zone?: string) => {
  const z = (zone ?? "safe").toLowerCase();
  if (z === "permanent_block") return { cls: "bg-danger", label: "Banned" };
  if (z === "temp_block") return { cls: "bg-warning text-dark", label: "Temp Blocked" };
  return { cls: "bg-success", label: "Active" };
};

export default function AllRolesPage() {
  const { user: authUser } = useAuth();
  const senderRole = (authUser?.userRole ?? "").toLowerCase();

  const [staff, setStaff] = useState<PortalUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Permission editor modal
  const [editUser, setEditUser] = useState<PortalUser | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Coin adjust modal
  const [coinUser, setCoinUser] = useState<PortalUser | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinSaving, setCoinSaving] = useState(false);
  const [coinMsg, setCoinMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const { users } = await getAllPortalUsers({ page: "1", limit: "200" });
      setStaff(users);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((u) =>
      [u.name, u.userId, u.designation, u.userRole]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [staff, searchQuery]);

  const openEdit = (u: PortalUser) => {
    setEditUser(u);
    setEditPerms([...(u.userPermissions ?? [])]);
    setModalMsg("");
  };
  const closeEdit = () => { setEditUser(null); setSaving(false); };

  const togglePerm = (p: string) =>
    setEditPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const savePerms = async () => {
    if (!editUser) return;
    setSaving(true);
    setModalMsg("");
    try {
      const current = new Set(editUser.userPermissions ?? []);
      const selected = new Set(editPerms);
      const toAdd = [...selected].filter((p) => !current.has(p));
      const toRemove = [...current].filter((p) => !selected.has(p));

      if (toAdd.length === 0 && toRemove.length === 0) {
        setModalMsg("No changes to save.");
        setSaving(false);
        return;
      }

      let updated: PortalUser = editUser;
      if (toAdd.length) updated = await addPermissions(editUser._id, toAdd);
      if (toRemove.length) updated = await removePermissions(editUser._id, toRemove);

      const merged: PortalUser = {
        ...editUser,
        ...updated,
        userPermissions: updated.userPermissions ?? editPerms,
      };
      setStaff((prev) => prev.map((u) => (u._id === merged._id ? merged : u)));
      const name = merged.name ?? merged.userId;
      closeEdit();
      setSuccessMsg(`Permissions updated for ${name}.`);
    } catch (e: unknown) {
      setModalMsg(e instanceof Error ? e.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const openCoin = (u: PortalUser) => {
    setCoinUser(u);
    setCoinAmount("");
    setCoinMsg("");
  };
  const closeCoin = () => { setCoinUser(null); setCoinSaving(false); };

  const submitCoin = async () => {
    if (!coinUser) return;
    const coins = parseInt(coinAmount, 10);
    if (Number.isNaN(coins) || coins <= 0) {
      setCoinMsg("Enter a positive coin amount.");
      return;
    }
    setCoinSaving(true);
    setCoinMsg("");
    try {
      await assignCoinsToUser({
        userId: coinUser._id,
        coins,
        userRole: coinUser.userRole,
      });
      // Reflect the new balance locally so the Coins column updates
      // without a full refetch.
      const targetId = coinUser._id;
      const name = coinUser.name ?? coinUser.userId;
      setStaff((prev) =>
        prev.map((u) =>
          u._id === targetId ? { ...u, coins: (u.coins ?? 0) + coins } : u
        )
      );
      closeCoin();
      setSuccessMsg(`Sent ${coins.toLocaleString()} coins to ${name}.`);
    } catch (e: unknown) {
      setCoinMsg(e instanceof Error ? e.message : "Failed to assign coins");
    } finally {
      setCoinSaving(false);
    }
  };

  const handleDelete = async (u: PortalUser) => {
    if (!confirm(`Delete staff "${u.name ?? u.userId}" (${formatRole(u.userRole)})?`)) return;
    setDeletingId(u._id);
    try {
      await deleteRole(u._id);
      setStaff((prev) => prev.filter((x) => x._id !== u._id));
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to delete staff");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Roles</li>
                <li className="breadcrumb-item active">All Roles</li>
              </ol>
            </div>
            <h4 className="page-title">Staff Role &amp; Permission Management</h4>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center py-2 mb-3">
          <i className="ri-checkbox-circle-line me-2"></i>{successMsg}
          <button className="btn-close ms-auto" onClick={() => setSuccessMsg("")} />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <h4 className="header-title mb-0">
                <i className="ri-shield-user-line me-2 text-primary"></i>
                Staff
                <span className="badge bg-secondary ms-2">{filtered.length}</span>
              </h4>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2 justify-content-md-end">
                <div className="input-group" style={{ maxWidth: 320 }}>
                  <span className="input-group-text"><i className="ri-search-line"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, ID, role…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
                  <i className={`ri-refresh-line ${loading ? "spin-anim" : ""}`}></i>
                </button>
                <Link href="/admin/roles/create" className="btn btn-primary text-nowrap">
                  <i className="ri-user-add-line me-1"></i>Create Role
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-user-search-line fs-1 d-block mb-2"></i>
              No staff yet. Use “Create Role” to add one.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-centered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Staff</th>
                    <th>Role</th>
                    <th>Designation</th>
                    <th>Coins</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const zone = getZoneBadge(u.activityZone?.zone);
                    const perms = u.userPermissions ?? [];
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="fw-medium">{u.name ?? "—"}</div>
                          <div className="text-muted fs-12">ID: {u.userId ?? "—"}</div>
                        </td>
                        <td><span className="badge bg-primary">{formatRole(u.userRole)}</span></td>
                        <td className="fs-13">{u.designation ?? "—"}</td>
                        <td>
                          <span className="text-warning-emphasis fw-medium">
                            <i className="ri-copper-coin-line me-1"></i>
                            {(u.coins ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          {perms.length === 0 ? (
                            <span className="text-muted fs-13">None</span>
                          ) : (
                            <span className="badge bg-info-subtle text-info">
                              {perms.length} permission{perms.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </td>
                        <td><span className={`badge ${zone.cls}`}>{zone.label}</span></td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            {(() => {
                              const allowed = canAssignCoinTo(senderRole, u.userRole);
                              return (
                                <button
                                  className="btn btn-sm btn-soft-success"
                                  title={
                                    allowed
                                      ? "Adjust coins"
                                      : `You can't assign coins to a ${formatRole(u.userRole)}`
                                  }
                                  onClick={() => openCoin(u)}
                                  disabled={!allowed}
                                >
                                  <i className="ri-copper-coin-line"></i>
                                </button>
                              );
                            })()}
                            <button
                              className="btn btn-sm btn-soft-primary"
                              title="Edit permissions"
                              onClick={() => openEdit(u)}
                            >
                              <i className="ri-shield-keyhole-line"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-soft-danger"
                              title="Delete staff"
                              onClick={() => handleDelete(u)}
                              disabled={deletingId === u._id}
                            >
                              {deletingId === u._id
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="ri-delete-bin-line"></i>}
                            </button>
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

      {/* Permission editor modal */}
      {editUser && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-shield-keyhole-line me-2 text-primary"></i>
                  Permissions — {editUser.name ?? editUser.userId}
                </h5>
                <button className="btn-close" onClick={closeEdit} />
              </div>
              <div className="modal-body">
                <p className="text-muted fs-13 mb-3">
                  <span className="badge bg-primary me-1">{formatRole(editUser.userRole)}</span>
                  Toggle the permissions for this staff member.
                </p>
                {modalMsg && (
                  <div className="alert alert-info py-2 fs-13">
                    <i className="ri-information-line me-1"></i>{modalMsg}
                  </div>
                )}
                <div className="list-group">
                  {ALL_PERMISSIONS.map((p) => {
                    const checked = editPerms.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${checked ? "active" : ""}`}
                        onClick={() => togglePerm(p.value)}
                      >
                        <span>{p.label}</span>
                        {checked && <i className="ri-check-line"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeEdit}>Close</button>
                <button className="btn btn-primary" onClick={savePerms} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                    : <><i className="ri-save-line me-1"></i>Save Permissions</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coin adjust modal */}
      {coinUser && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-copper-coin-line me-2 text-success"></i>
                  Assign Coins — {coinUser.name ?? coinUser.userId}
                </h5>
                <button className="btn-close" onClick={closeCoin} />
              </div>
              <div className="modal-body">
                <p className="text-muted fs-13 mb-2">
                  <span className="badge bg-primary me-1">{formatRole(coinUser.userRole)}</span>
                  Coins are transferred from your balance to this staff member.
                </p>
                <div className="alert alert-secondary py-2 fs-12 mb-3">
                  <i className="ri-information-line me-1"></i>
                  Must be a positive whole number. The backend deducts it from your
                  balance and blocks the transfer if you have insufficient coins.
                </div>
                {coinMsg && (
                  <div className="alert alert-info py-2 fs-13">
                    <i className="ri-information-line me-1"></i>{coinMsg}
                  </div>
                )}
                <label className="form-label fs-13">Coins to send</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 10000"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  min={1}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeCoin}>Close</button>
                <button className="btn btn-success" onClick={submitCoin} disabled={coinSaving}>
                  {coinSaving
                    ? <><span className="spinner-border spinner-border-sm me-1" />Sending…</>
                    : <><i className="ri-send-plane-line me-1"></i>Send Coins</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
