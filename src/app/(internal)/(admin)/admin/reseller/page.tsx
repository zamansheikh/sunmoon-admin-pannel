"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getResellers,
  changeResellerRole,
  searchUserByShortId,
  giveCoinsToReseller,
  ResellerUser,
  FullAppUser,
} from "@/lib/api";

type Flash = { type: "success" | "danger"; text: string } | null;

const initial = (name?: string) => (name ?? "U").charAt(0).toUpperCase();

export default function AppResellerPage() {
  const [resellers, setResellers] = useState<ResellerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [flash, setFlash] = useState<Flash>(null);

  // Search to find a user to promote.
  const [shortId, setShortId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [found, setFound] = useState<FullAppUser | null>(null);

  const [actingId, setActingId] = useState<string | null>(null);

  // Give-coins modal (admin funds a reseller's wallet).
  const [coinTarget, setCoinTarget] = useState<ResellerUser | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [givingCoins, setGivingCoins] = useState(false);
  const [coinError, setCoinError] = useState("");

  const loadResellers = useCallback(async () => {
    setLoading(true);
    try {
      const { resellers, total } = await getResellers(1, 50);
      setResellers(resellers);
      setTotal(total);
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load resellers" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadResellers(); }, [loadResellers]);

  const handleSearch = async () => {
    const id = shortId.trim();
    setSearchError("");
    setFound(null);
    if (!id) return setSearchError("Enter a user ID to search.");
    if (!/^\d+$/.test(id)) return setSearchError("User ID must be a number (e.g. 100245).");

    setSearching(true);
    try {
      const user = await searchUserByShortId(id);
      if (!user) {
        setSearchError(`No user found with ID ${id}.`);
      } else {
        setFound(user);
      }
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleMakeReseller = async (user: FullAppUser) => {
    setActingId(user._id);
    setFlash(null);
    try {
      await changeResellerRole(user._id, "re-seller");
      setFlash({ type: "success", text: `${user.username ?? user.name ?? "User"} is now a reseller.` });
      setFound(null);
      setShortId("");
      loadResellers();
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to make reseller" });
    } finally {
      setActingId(null);
    }
  };

  const handleRemoveReseller = async (u: ResellerUser) => {
    if (!confirm(`Remove reseller role from ${u.username ?? u.name ?? "this user"}? They will become a regular user.`)) return;
    setActingId(u._id);
    setFlash(null);
    try {
      await changeResellerRole(u._id, "user");
      setResellers((prev) => prev.filter((x) => x._id !== u._id));
      setTotal((t) => Math.max(0, t - 1));
      setFlash({ type: "success", text: "Reseller role removed." });
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to remove reseller" });
    } finally {
      setActingId(null);
    }
  };

  const openGiveCoins = (u: ResellerUser) => {
    setCoinTarget(u);
    setCoinAmount("");
    setCoinError("");
  };
  const handleGiveCoins = async () => {
    if (!coinTarget) return;
    const coins = Number(coinAmount);
    if (!Number.isInteger(coins) || coins <= 0) {
      setCoinError("Enter a whole number of coins greater than 0.");
      return;
    }
    setGivingCoins(true);
    setCoinError("");
    try {
      const res = await giveCoinsToReseller(coinTarget._id, coins);
      setFlash({
        type: "success",
        text: `Added ${coins.toLocaleString()} coins to ${coinTarget.username ?? coinTarget.name ?? "reseller"}'s R balance (now ${res.receiver.coins.toLocaleString()}).`,
      });
      setCoinTarget(null);
    } catch (e: unknown) {
      setCoinError(e instanceof Error ? e.message : "Failed to give coins");
    } finally {
      setGivingCoins(false);
    }
  };

  const foundRole = (found?.userRole ?? found?.role ?? "user").toLowerCase();
  const foundIsReseller = foundRole === "re-seller";
  const foundEligible = foundRole === "user"; // backend only toggles user <-> re-seller

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Staff Management</li>
                <li className="breadcrumb-item active">App Reseller</li>
              </ol>
            </div>
            <h4 className="page-title">App Reseller</h4>
          </div>
        </div>
      </div>

      {flash && (
        <div className={`alert alert-${flash.type} d-flex align-items-center py-2 mb-3`}>
          <i className={`me-2 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
          {flash.text}
          <button className="btn-close ms-auto" onClick={() => setFlash(null)} />
        </div>
      )}

      {/* Make a reseller — search by user ID */}
      <div className="card">
        <div className="card-header">
          <h4 className="header-title mb-0">
            <i className="ri-user-add-line me-2 text-primary"></i>Make a Reseller
          </h4>
        </div>
        <div className="card-body">
          <p className="text-muted fs-13 mb-2">
            Find a user by their numeric <strong>User ID</strong> (e.g. 100245), then promote
            them to a reseller. Only regular <code>user</code> accounts can be made resellers.
          </p>
          <div className="row g-2">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text"><i className="ri-hashtag"></i></span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="User ID, e.g. 100245"
                  value={shortId}
                  onChange={(e) => setShortId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
                <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                  {searching ? <span className="spinner-border spinner-border-sm" /> : <><i className="ri-search-line me-1"></i>Search</>}
                </button>
              </div>
            </div>
          </div>

          {searchError && (
            <div className="alert alert-warning py-2 fs-13 mt-3 mb-0">
              <i className="ri-error-warning-line me-1"></i>{searchError}
            </div>
          )}

          {found && (
            <div className="border rounded-2 p-3 mt-3 d-flex align-items-center gap-3 flex-wrap">
              <div
                className="rounded-circle bg-primary bg-opacity-15 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-primary"
                style={{ width: 48, height: 48, fontSize: 18 }}
              >
                {found.avatar || found.profileImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={found.avatar ?? found.profileImage} alt="" className="rounded-circle w-100 h-100 object-fit-cover" />
                ) : initial(found.username ?? found.name)}
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{found.username ?? found.name ?? "Unknown"}</div>
                <div className="text-muted fs-13">
                  ID: {found.userId ?? "—"}{found.email ? ` · ${found.email}` : ""}
                </div>
                <span className="badge bg-secondary text-capitalize mt-1">{foundRole}</span>
              </div>
              {foundIsReseller ? (
                <span className="badge bg-info-subtle text-info align-self-center">Already a reseller</span>
              ) : foundEligible ? (
                <button
                  className="btn btn-success"
                  onClick={() => handleMakeReseller(found)}
                  disabled={actingId === found._id}
                >
                  {actingId === found._id
                    ? <><span className="spinner-border spinner-border-sm me-1" />Promoting…</>
                    : <><i className="ri-vip-crown-line me-1"></i>Make Reseller</>}
                </button>
              ) : (
                <span className="text-danger fs-13 align-self-center">
                  Role <code>{foundRole}</code> can&apos;t be made a reseller.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Existing resellers */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-vip-crown-line me-2 text-info"></i>
            Resellers <span className="badge bg-secondary ms-1">{total || resellers.length}</span>
          </h4>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadResellers} disabled={loading}>
            <i className={`ri-refresh-line ${loading ? "spin-anim" : ""}`}></i>
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : resellers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-vip-crown-line fs-1 d-block mb-2"></i>
              No resellers yet. Search a user above to promote one.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resellers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-info bg-opacity-15 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-info"
                            style={{ width: 36, height: 36, fontSize: 14 }}
                          >
                            {u.avatar ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={u.avatar} alt="" className="rounded-circle w-100 h-100 object-fit-cover" />
                            ) : initial(u.username ?? u.name)}
                          </div>
                          <span className="fw-medium">{u.username ?? u.name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="text-muted">{u.userId ?? "—"}</td>
                      <td className="text-muted fs-13">{u.email ?? "—"}</td>
                      <td><span className="badge bg-info">re-seller</span></td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-soft-success"
                            title="Give coins to this reseller"
                            onClick={() => openGiveCoins(u)}
                          >
                            <i className="ri-copper-coin-line me-1"></i>Give Coins
                          </button>
                          <button
                            className="btn btn-sm btn-soft-danger"
                            title="Remove reseller role"
                            onClick={() => handleRemoveReseller(u)}
                            disabled={actingId === u._id}
                          >
                            {actingId === u._id
                              ? <span className="spinner-border spinner-border-sm" />
                              : <i className="ri-user-unfollow-line"></i>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Give coins modal */}
      {coinTarget && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-copper-coin-line me-2 text-success"></i>Give Coins
                </h5>
                <button className="btn-close" onClick={() => setCoinTarget(null)} />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Add coins to{" "}
                  <strong>{coinTarget.username ?? coinTarget.name ?? "reseller"}</strong>
                  {coinTarget.userId ? ` (ID ${coinTarget.userId})` : ""}&apos;s reseller
                  balance (R). They can then distribute these to app users.
                </p>
                {coinError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{coinError}
                  </div>
                )}
                <label className="form-label fs-13">Coins</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGiveCoins(); }}
                />
                <p className="text-muted fs-12 mt-1 mb-0">
                  Whole number greater than 0. Deducted from your admin balance and
                  added to the reseller&apos;s R balance.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setCoinTarget(null)}>Cancel</button>
                <button className="btn btn-success" onClick={handleGiveCoins} disabled={givingCoins}>
                  {givingCoins
                    ? <><span className="spinner-border spinner-border-sm me-1" />Sending…</>
                    : <><i className="ri-send-plane-line me-1"></i>Give Coins</>}
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
