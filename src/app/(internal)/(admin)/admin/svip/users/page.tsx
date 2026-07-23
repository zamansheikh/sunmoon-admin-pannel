"use client";

import { useState, useEffect, useCallback } from "react";
import { getSvipUsers, SvipUser, PaginationMeta } from "@/lib/api";
import { PROJECT_NAME } from "@/lib/constants";
import Link from "next/link";

const LEVEL_COLORS: Record<number, string> = {
  1: "#E0A526",
  2: "#00C6FF",
  3: "#4CAF50",
  4: "#FF6B35",
  5: "#9E9E9E",
  6: "#E040FB",
  7: "#FF1744",
  8: "#00E5FF",
  9: "#FFD700",
};

const TIER_START_COLORS: Record<number, string> = {
  1: "#E0A526",
  2: "#00C6FF",
  3: "#4CAF50",
  4: "#FF6B35",
  5: "#9E9E9E",
  6: "#E040FB",
  7: "#FF1744",
  8: "#00E5FF",
  9: "#FFD700",
};

export default function SvipUsersPage() {
  const [selectedTier, setSelectedTier] = useState(1);
  const [users, setUsers] = useState<SvipUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    limit: 10,
    page: 1,
    totalPage: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async (tier: number, page: number, limit = 10) => {
    setIsLoading(true);
    setError("");
    try {
      const resp = await getSvipUsers({ tier, page, limit });
      console.log("[SVIP Users] API response:", resp);
      console.log("[SVIP Users] Users count:", resp.users.length);
      console.log("[SVIP Users] Pagination:", resp.pagination);
      setUsers(resp.users);
      setPagination(resp.pagination);
    } catch (e: unknown) {
      console.error("[SVIP Users] API error:", e);
      setError(e instanceof Error ? e.message : "Failed to load SVIP users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(selectedTier, 1);
  }, [selectedTier, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPage) return;
    fetchUsers(selectedTier, newPage, pagination.limit);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">{PROJECT_NAME}</a></li>
                <li className="breadcrumb-item">Premium Membership</li>
                <li className="breadcrumb-item active">SVIP Users</li>
              </ol>
            </div>
            <h4 className="page-title">SVIP Users by Tier</h4>
          </div>
        </div>
      </div>

      {/* Tier Selector */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted fw-semibold me-1">Select Tier:</span>
                {Array.from({ length: 9 }, (_, i) => i + 1).map((tier) => (
                  <button
                    key={tier}
                    className={`btn btn-sm ${selectedTier === tier ? "text-white" : "btn-outline-secondary"}`}
                    style={{
                      backgroundColor: selectedTier === tier ? LEVEL_COLORS[tier] : undefined,
                      borderColor: LEVEL_COLORS[tier],
                      color: selectedTier === tier ? "#fff" : LEVEL_COLORS[tier],
                    }}
                    onClick={() => setSelectedTier(tier)}
                  >
                    SVIP-{tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>
          {error}
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-vip-crown-2-line me-2" style={{ color: LEVEL_COLORS[selectedTier] }}></i>
            SVIP-{selectedTier} Users{" "}
            <span className="badge bg-secondary ms-1">
              {pagination.total}
            </span>
          </h4>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => fetchUsers(selectedTier, pagination.page, pagination.limit)}
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
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-user-unfollow-line fs-1 d-block mb-2"></i>
              No users found at SVIP-{selectedTier}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Current Tier</th>
                    <th>Monthly Recharge</th>
                    <th>Tier Start of Month</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((svipUser, idx) => (
                    <tr key={svipUser._id ?? idx}>
                      <td>
                        <Link
                          href={`/admin/users/${svipUser.userId?._id}`}
                          className="d-flex align-items-center gap-2 text-decoration-none text-reset"
                        >
                          <div
                            className="avatar-sm rounded-circle bg-primary bg-opacity-15 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-primary"
                            style={{ width: 36, height: 36, fontSize: 14 }}
                          >
                            {svipUser.userId?.avatar ? (
                              <img
                                src={svipUser.userId.avatar}
                                alt={svipUser.userId.name ?? "User"}
                                className="rounded-circle w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              (svipUser.userId?.name ?? "U").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="fw-medium">
                              {svipUser.userId?.name ?? "Unknown"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ backgroundColor: LEVEL_COLORS[svipUser.currentTier] ?? "#9E9E9E" }}
                        >
                          SVIP-{svipUser.currentTier}
                        </span>
                      </td>
                      <td>
                        <span className="fw-medium text-warning-emphasis">
                          <i className="ri-copper-coin-line me-1"></i>
                          {svipUser.monthlyRechargeCoins.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ backgroundColor: TIER_START_COLORS[svipUser.tierStartOfMonth] ?? "#9E9E9E" }}
                        >
                          SVIP-{svipUser.tierStartOfMonth}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">
                          {svipUser.month}/{svipUser.year}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPage > 1 && (
          <div className="card-footer d-flex align-items-center justify-content-between">
            <span className="text-muted fs-13">
              Page {pagination.page} of {pagination.totalPage} ({pagination.total} users)
            </span>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                <i className="ri-arrow-left-s-line"></i> Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPage || isLoading}
              >
                Next <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
