"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getUserDetailsById,
  getStoreCategories,
  getStoreItemsByCategory,
  grantStoreItem,
  FullAppUser,
  StoreCategory,
  StoreItem,
} from "@/lib/api";

type Flash = { type: "success" | "danger"; text: string } | null;

type UserDetails = FullAppUser & Record<string, unknown>;

// The richer fields surfaced by /api/auth/user/:id that we read here. We type
// them through indexed access rather than augmenting FullAppUser so the rest
// of the panel isn't affected.
const num = (v: unknown): number =>
  typeof v === "number" ? v : Number(v) || 0;
const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [flash, setFlash] = useState<Flash>(null);

  // Grant Item modal state.
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantCategories, setGrantCategories] = useState<StoreCategory[]>([]);
  const [grantItemsByCat, setGrantItemsByCat] = useState<Record<string, StoreItem[]>>({});
  const [grantCategoryId, setGrantCategoryId] = useState("");
  const [grantSelected, setGrantSelected] = useState<StoreItem | null>(null);
  const [grantValidity, setGrantValidity] = useState("30");
  const [grantLoadingCats, setGrantLoadingCats] = useState(false);
  const [grantLoadingItems, setGrantLoadingItems] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [grantSubmitting, setGrantSubmitting] = useState(false);

  // Resolve route params (Next 15 hands them in as a Promise).
  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setPageError("");
    try {
      const u = await getUserDetailsById(userId);
      setUser(u);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ─── Grant Item modal ─────────────────────────────────────────────────────
  const openGrant = async () => {
    setGrantOpen(true);
    setGrantError("");
    setGrantSelected(null);
    setGrantValidity("30");
    if (grantCategories.length === 0) {
      setGrantLoadingCats(true);
      try {
        const cats = await getStoreCategories();
        // Premium bundles can't be granted by the backend Grant API.
        const nonPremium = cats.filter((c) => !c.isPremium);
        setGrantCategories(nonPremium);
        if (nonPremium.length > 0) {
          // Auto-pick the first category for convenience.
          selectGrantCategory(nonPremium[0]._id, nonPremium);
        }
      } catch (e: unknown) {
        setGrantError(e instanceof Error ? e.message : "Failed to load categories");
      } finally {
        setGrantLoadingCats(false);
      }
    } else if (grantCategoryId) {
      // Re-pick whatever category was selected last time, so the grid shows
      // immediately on reopen.
      selectGrantCategory(grantCategoryId, grantCategories);
    }
  };

  const selectGrantCategory = async (
    catId: string,
    cats: StoreCategory[] = grantCategories
  ) => {
    setGrantCategoryId(catId);
    setGrantSelected(null);
    if (grantItemsByCat[catId]) return; // already cached
    const cat = cats.find((c) => c._id === catId);
    if (!cat) return;
    setGrantLoadingItems(true);
    try {
      const { items } = await getStoreItemsByCategory(catId, { limit: 200 });
      // Backend Grant rule: non-premium AND canUserBuyThis === false.
      const filtered = items.filter(
        (it) => !it.isPremium && it.canUserBuyThis === false
      );
      setGrantItemsByCat((prev) => ({ ...prev, [catId]: filtered }));
    } catch (e: unknown) {
      setGrantError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setGrantLoadingItems(false);
    }
  };

  const handleGrantSubmit = async () => {
    if (!user || !grantSelected) return;
    const shortId = typeof user.userId === "number" ? user.userId : Number(user.userId);
    if (!Number.isInteger(shortId) || shortId <= 0) {
      setGrantError("This user has no numeric User ID — cannot grant.");
      return;
    }
    const validity = Number(grantValidity);
    if (!Number.isInteger(validity) || validity <= 0) {
      setGrantError("Validity must be a positive whole number of days.");
      return;
    }
    setGrantSubmitting(true);
    setGrantError("");
    try {
      await grantStoreItem({ itemId: grantSelected._id, userId: shortId, validity });
      setFlash({
        type: "success",
        text: `Granted "${grantSelected.name}" for ${validity} day(s).`,
      });
      setGrantOpen(false);
      // Refresh the user so the new item shows up under "Owned items".
      loadUser();
    } catch (e: unknown) {
      setGrantError(e instanceof Error ? e.message : "Failed to grant item");
    } finally {
      setGrantSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }
  if (pageError || !user) {
    return (
      <div className="alert alert-danger d-flex align-items-center">
        <i className="ri-error-warning-line me-2"></i>
        {pageError || "User not found."}
        <Link href="/admin/users/all" className="btn btn-sm btn-outline-secondary ms-auto">
          <i className="ri-arrow-left-line me-1"></i>Back to users
        </Link>
      </div>
    );
  }

  const role = str(user.userRole || user.role || "user");
  const stats =
    (user.stats as { coins?: number; diamonds?: number; stars?: number } | undefined) ?? {};
  const totalEarnedXp = num(user.totalEarnedXp);
  const level = num(user.level);
  const bucket =
    (user.myBucketItems as Record<string, unknown[]> | undefined) ?? {};

  const itemsForSelectedCat = grantCategoryId ? grantItemsByCat[grantCategoryId] ?? [] : [];

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">
                  <Link href="/admin/users/all">App User</Link>
                </li>
                <li className="breadcrumb-item active">
                  {user.username ?? user.name ?? "User"}
                </li>
              </ol>
            </div>
            <h4 className="page-title">User Details</h4>
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

      <div className="row g-3">
        {/* Identity card */}
        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-body text-center">
              <div
                className="rounded-circle mx-auto mb-3 bg-primary bg-opacity-15 d-flex align-items-center justify-content-center fw-bold text-primary"
                style={{ width: 96, height: 96, fontSize: 36 }}
              >
                {user.avatar || user.profileImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.avatar ?? user.profileImage}
                    alt=""
                    className="rounded-circle w-100 h-100 object-fit-cover"
                  />
                ) : (
                  (user.username ?? user.name ?? "U").charAt(0).toUpperCase()
                )}
              </div>
              <h4 className="mb-1">{user.username ?? user.name ?? "Unknown"}</h4>
              <p className="text-muted mb-2">
                {user.email ? user.email : "—"}
                {typeof user.userId === "number" && (
                  <> · <code>ID {user.userId}</code></>
                )}
              </p>
              <span className="badge bg-secondary text-capitalize">{role}</span>
            </div>
            <div className="card-body border-top">
              <h6 className="text-muted text-uppercase fs-12 mb-3">Quick Actions</h6>
              <div className="d-grid gap-2">
                <button className="btn btn-success" onClick={openGrant}>
                  <i className="ri-gift-line me-1"></i>Grant Store Item
                </button>
                <Link
                  href="/admin/users/all"
                  className="btn btn-outline-secondary"
                >
                  <i className="ri-arrow-left-line me-1"></i>Back to App User
                </Link>
              </div>
              <p className="text-muted fs-12 mt-3 mb-0">
                Role / status / credits / XP changes still live on the App User
                list — open the modal there for now.
              </p>
            </div>
          </div>
        </div>

        {/* Stats + inventory */}
        <div className="col-12 col-lg-7">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="card text-center">
                <div className="card-body p-3">
                  <i className="ri-copper-coin-line fs-3 text-warning-emphasis"></i>
                  <div className="fw-semibold mt-1">{num(stats.coins).toLocaleString()}</div>
                  <div className="text-muted fs-12">Coins</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center">
                <div className="card-body p-3">
                  <i className="ri-gem-line fs-3 text-info"></i>
                  <div className="fw-semibold mt-1">{num(stats.diamonds).toLocaleString()}</div>
                  <div className="text-muted fs-12">Diamonds</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center">
                <div className="card-body p-3">
                  <i className="ri-star-line fs-3 text-warning"></i>
                  <div className="fw-semibold mt-1">{num(stats.stars).toLocaleString()}</div>
                  <div className="text-muted fs-12">Stars</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center">
                <div className="card-body p-3">
                  <i className="ri-medal-line fs-3 text-primary"></i>
                  <div className="fw-semibold mt-1">{level}</div>
                  <div className="text-muted fs-12">Level</div>
                  <div className="text-muted fs-12">{totalEarnedXp.toLocaleString()} XP</div>
                </div>
              </div>
            </div>
          </div>

          {/* Owned items, grouped by store category */}
          <div className="card mt-3">
            <div className="card-header">
              <h5 className="header-title mb-0">
                <i className="ri-shopping-bag-line me-2 text-primary"></i>
                Owned Store Items
              </h5>
            </div>
            <div className="card-body">
              {Object.keys(bucket).length === 0 ? (
                <p className="text-muted mb-0">This user has no store items.</p>
              ) : (
                Object.entries(bucket).map(([cat, items]) => {
                  const arr = (items as Array<Record<string, unknown>>).filter(Boolean);
                  if (arr.length === 0) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <div className="fw-medium text-capitalize mb-2">
                        {cat.replace(/[-_]/g, " ")}{" "}
                        <span className="badge bg-light text-dark">{arr.length}</span>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {arr.map((it, idx) => {
                          const name = str(it.name) || "Item";
                          const preview = str(it.previewFile || it.logo || "");
                          return (
                            <div
                              key={idx}
                              className="text-center"
                              style={{ width: 80 }}
                              title={name}
                            >
                              <div
                                className="border rounded bg-light d-flex align-items-center justify-content-center"
                                style={{ width: 64, height: 64, margin: "0 auto" }}
                              >
                                {preview ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={preview}
                                    alt={name}
                                    style={{ maxWidth: 56, maxHeight: 56, objectFit: "contain" }}
                                  />
                                ) : (
                                  <i className="ri-image-line text-muted fs-3"></i>
                                )}
                              </div>
                              <div className="fs-12 mt-1 text-truncate">{name}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grant Item modal — visual grid picker. */}
      {grantOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-gift-line me-2 text-success"></i>
                  Grant Store Item to {user.username ?? user.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setGrantOpen(false)}
                  disabled={grantSubmitting}
                />
              </div>
              <div className="modal-body">
                {grantError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{grantError}
                  </div>
                )}

                {/* Category tabs — keeps the grid readable instead of dumping
                    every exclusive on screen at once. */}
                {grantLoadingCats ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" />
                  </div>
                ) : grantCategories.length === 0 ? (
                  <p className="text-muted mb-3">No non-premium categories found.</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {grantCategories.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        className={`btn btn-sm ${
                          grantCategoryId === c._id
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => selectGrantCategory(c._id)}
                        disabled={grantSubmitting}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Item grid */}
                <div className="border rounded p-2" style={{ minHeight: 200 }}>
                  {grantLoadingItems ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status" />
                    </div>
                  ) : !grantCategoryId ? (
                    <p className="text-muted text-center my-4">
                      Pick a category to see grantable items.
                    </p>
                  ) : itemsForSelectedCat.length === 0 ? (
                    <p className="text-muted text-center my-4 mb-2">
                      No exclusive items in this category yet.
                      <br />
                      <span className="fs-12">
                        Create or edit an item in Store Management with{" "}
                        <strong>Available in store</strong> turned off.
                      </span>
                    </p>
                  ) : (
                    <div className="row g-2">
                      {itemsForSelectedCat.map((it) => {
                        const selected = grantSelected?._id === it._id;
                        const preview = it.previewFile || it.logo || "";
                        return (
                          <div key={it._id} className="col-6 col-md-4 col-lg-3">
                            <button
                              type="button"
                              onClick={() => setGrantSelected(it)}
                              className={`btn w-100 p-2 text-start ${
                                selected
                                  ? "btn-primary text-white"
                                  : "btn-outline-light text-dark border"
                              }`}
                              disabled={grantSubmitting}
                              style={{ minHeight: 130 }}
                            >
                              <div
                                className="d-flex align-items-center justify-content-center bg-white rounded mb-2"
                                style={{ height: 72 }}
                              >
                                {preview ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={preview}
                                    alt={it.name}
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: 68,
                                      objectFit: "contain",
                                    }}
                                  />
                                ) : (
                                  <i className="ri-image-line fs-3 text-muted"></i>
                                )}
                              </div>
                              <div
                                className="fs-13 fw-medium text-truncate"
                                title={it.name}
                              >
                                {it.name}
                              </div>
                              {selected && (
                                <div className="fs-12">
                                  <i className="ri-check-line me-1"></i>Selected
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected summary + validity */}
                <div className="mt-3 d-flex flex-wrap gap-3 align-items-end">
                  <div style={{ minWidth: 200 }}>
                    <label className="form-label fs-13 mb-1">Selected</label>
                    <div className="fs-13 text-muted">
                      {grantSelected ? grantSelected.name : "None yet"}
                    </div>
                  </div>
                  <div style={{ width: 160 }}>
                    <label className="form-label fs-13 mb-1">Validity (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={grantValidity}
                      onChange={(e) => setGrantValidity(e.target.value)}
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setGrantOpen(false)}
                  disabled={grantSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleGrantSubmit}
                  disabled={!grantSelected || grantSubmitting}
                >
                  {grantSubmitting ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Granting…</>
                  ) : (
                    <><i className="ri-gift-line me-1"></i>Grant Item</>
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
