"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  assignCoinsToUser,
  getPortalHosts,
  getPortalMidUsers,
  getPortalUsersByRole,
  PortalUser,
} from "@/lib/api";

type Tier = "upper" | "mid" | "lower" | "none";

type RoleTab = {
  label: string;
  value: string;
};

function normalizeRole(value?: string): string {
  return (value ?? "").toLowerCase().trim();
}

function normalizeRoleForCoinTransfer(value?: string): string {
  const role = normalizeRole(value);
  if (role === "reseller") return "re-seller";
  if (role === "host") return "user";
  return role;
}

function getTier(role: string): Tier {
  if (role === "admin") return "upper";
  if (["sub-admin", "merchant", "country-admin"].includes(role)) return "mid";
  if (["re-seller", "agency", "country-sub-admin"].includes(role)) return "lower";
  return "none";
}

function getTabs(role: string, tier: Tier): RoleTab[] {
  if (tier === "upper") {
    return [
      { label: "Sub Admin", value: "sub-admin" },
      { label: "Merchant", value: "merchant" },
      { label: "Country Admin", value: "country-admin" },
    ];
  }

  if (tier === "mid") {
    if (role === "country-admin") {
      return [{ label: "Country Sub Admin", value: "country-sub-admin" }];
    }
    if (role === "merchant") {
      return [{ label: "Reseller", value: "re-seller" }];
    }
    return [
      { label: "Reseller", value: "re-seller" },
      { label: "Agency", value: "agency" },
    ];
  }

  if (tier === "lower") {
    return [{ label: "Hosts", value: "host" }];
  }

  return [];
}

function getAllowedCoinTargets(senderRole?: string): string[] {
  const sender = normalizeRoleForCoinTransfer(senderRole);
  if (sender === "admin") return ["merchant"];
  if (sender === "merchant") return ["re-seller", "user"];
  if (sender === "re-seller") return ["user"];
  return [];
}

function formatRoleLabel(role: string): string {
  return role
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CreatedUsersPage() {
  const { user } = useAuth();
  const viewerRole = normalizeRole(user?.userRole);
  const tier = useMemo(() => getTier(viewerRole), [viewerRole]);
  const tabs = useMemo(() => getTabs(viewerRole, tier), [viewerRole, tier]);
  const senderCoinRole = normalizeRoleForCoinTransfer(viewerRole);
  const allowedCoinTargets = useMemo(
    () => getAllowedCoinTargets(senderCoinRole),
    [senderCoinRole]
  );

  const [activeRole, setActiveRole] = useState("");
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [coinUser, setCoinUser] = useState<PortalUser | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinError, setCoinError] = useState("");

  const canCreateRoleUsers = ["admin", "sub-admin"].includes(viewerRole);

  useEffect(() => {
    if (tabs.length === 0) {
      setActiveRole("");
      return;
    }

    if (!activeRole || !tabs.find((t) => t.value === activeRole)) {
      setActiveRole(tabs[0].value);
    }
  }, [tabs, activeRole]);

  const fetchUsers = useCallback(async () => {
    if (!activeRole) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let data: PortalUser[] = [];
      if (tier === "upper") {
        data = await getPortalUsersByRole(activeRole, { page: "1", limit: "200" });
      } else if (tier === "mid") {
        if (!user?._id) throw new Error("Session is missing creator id.");
        data = await getPortalMidUsers(activeRole, user._id, {
          page: "1",
          limit: "200",
        });
      } else if (tier === "lower") {
        if (!user?._id) throw new Error("Session is missing creator id.");
        data = await getPortalHosts(user._id, { page: "1", limit: "200" });
      }
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load created users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeRole, tier, user?._id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const text = [u.name, u.userId, u.designation, u.userRole]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [users, search]);

  const canAssignCoinsTo = (targetRole?: string): boolean => {
    const normalizedTarget = normalizeRoleForCoinTransfer(targetRole);
    return allowedCoinTargets.includes(normalizedTarget);
  };

  const openCoinModal = (targetUser: PortalUser) => {
    setCoinUser(targetUser);
    setCoinAmount("");
    setCoinError("");
  };

  const closeCoinModal = () => {
    setCoinUser(null);
    setCoinAmount("");
    setCoinError("");
    setCoinLoading(false);
  };

  const handleAssignCoins = async () => {
    if (!coinUser) return;

    const amount = parseInt(coinAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      setCoinError("Coin amount must be greater than 0.");
      return;
    }

    const targetRole = normalizeRoleForCoinTransfer(coinUser.userRole);
    if (!canAssignCoinsTo(targetRole)) {
      setCoinError(
        `${formatRoleLabel(senderCoinRole || "current role")} cannot assign coins to ${formatRoleLabel(targetRole || "this role")}.`
      );
      return;
    }

    setCoinLoading(true);
    setCoinError("");
    try {
      await assignCoinsToUser({
        userId: coinUser._id,
        coins: amount,
        userRole: targetRole,
      });
      setMsg(`Assigned ${amount} coins to ${coinUser.name ?? coinUser.userId ?? "user"}.`);
      closeCoinModal();
      await fetchUsers();
    } catch (e: unknown) {
      setCoinError(e instanceof Error ? e.message : "Failed to assign coins");
    } finally {
      setCoinLoading(false);
    }
  };

  const tierInfo =
    tier === "upper"
      ? "Admin level list. You can review upper-tier creators here."
      : tier === "mid"
      ? "Your directly created accounts are listed here."
      : tier === "lower"
      ? "Your host list is shown here."
      : "Your current role cannot view created users from this page.";

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Roles</li>
                <li className="breadcrumb-item active">Created Users</li>
              </ol>
            </div>
            <h4 className="page-title">Created Users</h4>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 d-flex flex-wrap justify-content-between gap-2 align-items-center">
          <div className="alert alert-info py-2 px-3 mb-0 fs-13">
            <i className="ri-information-line me-1"></i>
            {tierInfo}
          </div>
          {canCreateRoleUsers && (
            <Link href="/admin/roles/create" className="btn btn-primary">
              <i className="ri-user-add-line me-2"></i>Create Role User
            </Link>
          )}
        </div>
      </div>

      {msg && (
        <div className="alert alert-success py-2 fs-13 mb-3">
          <i className="ri-checkbox-circle-line me-2"></i>{msg}
        </div>
      )}

      <div className="card">
        <div className="card-header pb-0">
          <ul className="nav nav-tabs nav-bordered card-header-tabs flex-nowrap overflow-auto">
            {tabs.map((tab) => (
              <li className="nav-item" key={tab.value}>
                <button
                  className={`nav-link${activeRole === tab.value ? " active" : ""}`}
                  onClick={() => setActiveRole(tab.value)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body pt-3">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text"><i className="ri-search-line"></i></span>
              <input
                className="form-control"
                placeholder="Search created users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <small className="text-muted">
              Coin chain: Admin -&gt; Merchant -&gt; Reseller -&gt; User
            </small>
          </div>

          {tier === "none" && (
            <div className="alert alert-warning py-2 fs-13 mb-0">
              <i className="ri-lock-line me-2"></i>
              Your role ({user?.userRole ?? "Unknown"}) cannot access this listing.
            </div>
          )}

          {tier !== "none" && loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          )}

          {tier !== "none" && error && (
            <div className="alert alert-danger py-2 fs-13">
              <i className="ri-error-warning-line me-2"></i>{error}
            </div>
          )}

          {tier !== "none" && !loading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="ri-user-search-line fs-1 d-block mb-2"></i>
              No users found for this role tab.
            </div>
          )}

          {tier !== "none" && !loading && filteredUsers.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover table-centered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>User ID</th>
                    <th>Designation</th>
                    <th>Role</th>
                    <th>Coins</th>
                    <th>Diamonds</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => {
                    const canAssign = canAssignCoinsTo(u.userRole);
                    return (
                      <tr key={u._id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
                              style={{ width: 36, height: 36, fontSize: 14 }}
                            >
                              {(u.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="mb-0 fw-semibold fs-13">{u.name ?? "Unknown"}</p>
                              <small className="text-muted">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="fs-12 font-monospace text-muted">{u.userId ?? "-"}</td>
                        <td className="fs-13">{u.designation ?? "-"}</td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary text-capitalize">
                            {u.userRole ?? "unknown"}
                          </span>
                        </td>
                        <td className="text-warning fw-semibold">
                          <i className="ri-copper-coin-line me-1"></i>{u.coins ?? 0}
                        </td>
                        <td className="text-info fw-semibold">
                          <i className="ri-gem-line me-1"></i>{u.diamonds ?? 0}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-soft-success"
                            disabled={!canAssign}
                            title={
                              canAssign
                                ? "Assign Coins"
                                : `Cannot assign from ${formatRoleLabel(senderCoinRole || "current role")} to ${formatRoleLabel(normalizeRoleForCoinTransfer(u.userRole) || "this role")}`
                            }
                            onClick={() => openCoinModal(u)}
                          >
                            <i className="ri-copper-coin-line me-1"></i>Assign
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

      {coinUser && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-copper-coin-line me-2 text-success"></i>
                  Assign Coins
                </h5>
                <button className="btn-close" onClick={closeCoinModal} />
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Target: <strong>{coinUser.name ?? coinUser.userId ?? "User"}</strong>
                </p>
                <p className="text-muted fs-13 mb-3">
                  Role: {formatRoleLabel(normalizeRoleForCoinTransfer(coinUser.userRole) || "unknown")}
                </p>
                {coinError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{coinError}
                  </div>
                )}
                <div>
                  <label className="form-label fs-13">Coins</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    placeholder="Enter amount"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={closeCoinModal} disabled={coinLoading}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleAssignCoins} disabled={coinLoading}>
                  {coinLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>Assigning...</>
                  ) : (
                    "Assign Coins"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
