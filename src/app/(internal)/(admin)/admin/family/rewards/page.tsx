"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getFamilyRewardConfigs,
  createFamilyRewardConfig,
  updateFamilyRewardConfig,
  deleteFamilyRewardConfig,
  getAllStoreItems,
  FamilyRewardConfig,
  StoreItem,
} from "@/lib/api";
import { PROJECT_NAME } from "@/lib/constants";

type Flash = { type: "success" | "danger"; text: string } | null;

interface RewardItemRow {
  itemId: string;
  duration: string;
  isExclusive: boolean;
}

const emptyItemRow = (): RewardItemRow => ({ itemId: "", duration: "30", isExclusive: false });

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
};

export default function FamilyRewardRankingsPage() {
  const [configs, setConfigs] = useState<FamilyRewardConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [starRating, setStarRating] = useState(3);
  const [rankMode, setRankMode] = useState<"single" | "range">("single");
  const [rank, setRank] = useState("");
  const [startRank, setStartRank] = useState("");
  const [endRank, setEndRank] = useState("");
  const [rewardItems, setRewardItems] = useState<RewardItemRow[]>([emptyItemRow()]);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      setConfigs(await getFamilyRewardConfigs());
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load reward configs" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStoreItems = useCallback(async () => {
    try {
      setStoreItems(await getAllStoreItems());
    } catch {
      // Silently fail — dropdown will just be empty
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);
  useEffect(() => { loadStoreItems(); }, [loadStoreItems]);

  const openCreate = () => {
    setEditId(null);
    setLabel("");
    setStarRating(3);
    setRankMode("single");
    setRank("");
    setStartRank("");
    setEndRank("");
    setRewardItems([emptyItemRow()]);
    setModalError("");
    setModalOpen(true);
  };

  const openEdit = (cfg: FamilyRewardConfig) => {
    setEditId(cfg._id);
    setLabel(cfg.label);
    setStarRating(cfg.starRating);
    if (cfg.startRank != null && cfg.endRank != null) {
      setRankMode("range");
      setStartRank(String(cfg.startRank));
      setEndRank(String(cfg.endRank));
      setRank("");
    } else {
      setRankMode("single");
      setRank(cfg.rank != null ? String(cfg.rank) : "");
      setStartRank("");
      setEndRank("");
    }
    setRewardItems(
      cfg.items.length > 0
        ? cfg.items.map((i) => ({ itemId: i.itemId, duration: String(i.duration), isExclusive: i.isExclusive }))
        : [emptyItemRow()]
    );
    setModalError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setSaving(false); };

  const updateItemRow = (index: number, field: keyof RewardItemRow, value: string | boolean) => {
    setRewardItems((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addItemRow = () => setRewardItems((prev) => [...prev, emptyItemRow()]);
  const removeItemRow = (index: number) => {
    if (rewardItems.length <= 1) return;
    setRewardItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!label.trim()) return setModalError("Label is required.");
    if (starRating < 1 || starRating > 5) return setModalError("Star rating must be between 1 and 5.");

    if (rankMode === "single") {
      const r = Number(rank);
      if (!(r > 0)) return setModalError("Rank must be a positive number.");
    } else {
      const sr = Number(startRank);
      const er = Number(endRank);
      if (!(sr > 0) || !(er > 0) || sr > er) return setModalError("Invalid rank range.");
    }

    const items = rewardItems
      .filter((r) => r.itemId)
      .map((r) => ({ itemId: r.itemId, duration: Number(r.duration) || 30, isExclusive: r.isExclusive }));
    if (items.length === 0) return setModalError("Add at least one reward item.");

    setSaving(true);
    setModalError("");
    try {
      const body: Parameters<typeof createFamilyRewardConfig>[0] = {
        label: label.trim(),
        starRating,
        items,
      };
      if (rankMode === "single") {
        body.rank = Number(rank);
      } else {
        body.startRank = Number(startRank);
        body.endRank = Number(endRank);
      }

      if (editId) {
        await updateFamilyRewardConfig(editId, body);
        setFlash({ type: "success", text: "Reward config updated." });
      } else {
        await createFamilyRewardConfig(body);
        setFlash({ type: "success", text: "Reward config created." });
      }
      closeModal();
      loadConfigs();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cfg: FamilyRewardConfig) => {
    if (!confirm(`Delete "${cfg.label}"? This cannot be undone.`)) return;
    setDeletingId(cfg._id);
    try {
      await deleteFamilyRewardConfig(cfg._id);
      setConfigs((prev) => prev.filter((c) => c._id !== cfg._id));
      setFlash({ type: "success", text: "Reward config deleted." });
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to delete" });
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (count: number, interactive = false) => (
    <span className="d-inline-flex gap-0">
      {[1, 2, 3, 4, 5].map((s) => (
        <i
          key={s}
          className={s <= count ? "ri-star-fill text-warning" : "ri-star-line text-muted"}
          style={{ fontSize: interactive ? "1.2rem" : "0.9rem", cursor: interactive ? "pointer" : "default" }}
          onClick={interactive ? () => setStarRating(s) : undefined}
        />
      ))}
    </span>
  );

  const getRankDisplay = (cfg: FamilyRewardConfig) => {
    if (cfg.startRank != null && cfg.endRank != null) return `#${cfg.startRank} – #${cfg.endRank}`;
    return cfg.rank != null ? `#${cfg.rank}` : "—";
  };

  const getItemName = (itemId: string) => {
    const item = storeItems.find((i) => i._id === itemId);
    return item?.name || itemId;
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">{PROJECT_NAME}</a></li>
                <li className="breadcrumb-item">Family</li>
                <li className="breadcrumb-item active">Reward Rankings</li>
              </ol>
            </div>
            <h4 className="page-title">Family Reward Rankings</h4>
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

      <div className="alert alert-info py-2 fs-13 mb-3">
        <i className="ri-information-line me-1"></i>
        Configure <strong>rank-based item rewards</strong> for families. Each config assigns store items to a specific rank or rank range.
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-trophy-line me-2 text-primary"></i>
            Reward Configs <span className="badge bg-secondary ms-1">{configs.length}</span>
          </h4>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" onClick={loadConfigs} disabled={loading}>
              <i className={`ri-refresh-line ${loading ? "spin-anim" : ""}`}></i>
            </button>
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="ri-add-line me-1"></i>Add Reward
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : configs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-trophy-line fs-1 d-block mb-2"></i>
              No reward configs yet. Add one to define rank-based rewards.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Label</th>
                    <th>Rank</th>
                    <th>Stars</th>
                    <th>Items</th>
                    <th>Created</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => (
                    <tr key={cfg._id}>
                      <td className="fw-medium">{cfg.label}</td>
                      <td><span className="badge bg-light text-dark">{getRankDisplay(cfg)}</span></td>
                      <td>{renderStars(cfg.starRating)}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info">{cfg.items.length} item{cfg.items.length !== 1 ? "s" : ""}</span>
                      </td>
                      <td className="fs-13 text-muted">{formatDate(cfg.createdAt)}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button className="btn btn-sm btn-soft-primary" title="Edit" onClick={() => openEdit(cfg)}>
                            <i className="ri-edit-line"></i>
                          </button>
                          <button className="btn btn-sm btn-soft-danger" title="Delete" onClick={() => handleDelete(cfg)} disabled={deletingId === cfg._id}>
                            {deletingId === cfg._id ? <span className="spinner-border spinner-border-sm" /> : <i className="ri-delete-bin-line"></i>}
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

      {modalOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-trophy-line me-2 text-primary"></i>
                  {editId ? "Edit Reward Config" : "Create Reward Config"}
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{modalError}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label fs-13">Label <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={label}
                      onChange={(e) => setLabel(e.target.value)} placeholder="e.g. TOP1 Reward" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13">Star Rating <span className="text-danger">*</span></label>
                    <div className="mt-1">{renderStars(starRating, true)}</div>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-12">
                    <label className="form-label fs-13">Rank Mode</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="rankMode" id="rankSingle"
                          checked={rankMode === "single"} onChange={() => setRankMode("single")} />
                        <label className="form-check-label" htmlFor="rankSingle">Single Rank</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="rankMode" id="rankRange"
                          checked={rankMode === "range"} onChange={() => setRankMode("range")} />
                        <label className="form-check-label" htmlFor="rankRange">Rank Range</label>
                      </div>
                    </div>
                  </div>
                  {rankMode === "single" ? (
                    <div className="col-md-4">
                      <label className="form-label fs-13">Rank <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={rank}
                        onChange={(e) => setRank(e.target.value)} placeholder="e.g. 1" min="1" />
                    </div>
                  ) : (
                    <>
                      <div className="col-md-4">
                        <label className="form-label fs-13">Start Rank <span className="text-danger">*</span></label>
                        <input type="number" className="form-control" value={startRank}
                          onChange={(e) => setStartRank(e.target.value)} placeholder="e.g. 3" min="1" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fs-13">End Rank <span className="text-danger">*</span></label>
                        <input type="number" className="form-control" value={endRank}
                          onChange={(e) => setEndRank(e.target.value)} placeholder="e.g. 5" min="1" />
                      </div>
                    </>
                  )}
                </div>

                <hr className="my-3" />
                <h6 className="mb-2">
                  <i className="ri-gift-line me-1 text-primary"></i>Reward Items
                  <button className="btn btn-sm btn-outline-success ms-2" onClick={addItemRow} type="button">
                    <i className="ri-add-line me-1"></i>Add Item
                  </button>
                </h6>

                {rewardItems.map((row, idx) => (
                  <div key={idx} className="row g-2 mb-2 align-items-end">
                    <div className="col-md-6">
                      {idx === 0 && <label className="form-label fs-13">Store Item</label>}
                      <select className="form-select form-select-sm" value={row.itemId}
                        onChange={(e) => updateItemRow(idx, "itemId", e.target.value)}>
                        <option value="">Select item…</option>
                        {storeItems.map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      {idx === 0 && <label className="form-label fs-13">Duration (days)</label>}
                      <input type="number" className="form-control form-control-sm" value={row.duration}
                        onChange={(e) => updateItemRow(idx, "duration", e.target.value)} min="1" />
                    </div>
                    <div className="col-md-2">
                      {idx === 0 && <label className="form-label fs-13">Exclusive</label>}
                      <div className="form-check form-switch mt-1">
                        <input className="form-check-input" type="checkbox"
                          checked={row.isExclusive}
                          onChange={(e) => updateItemRow(idx, "isExclusive", e.target.checked)} />
                      </div>
                    </div>
                    <div className="col-md-1">
                      {idx === 0 && <label className="form-label fs-13">&nbsp;</label>}
                      <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeItemRow(idx)}
                        disabled={rewardItems.length <= 1} type="button">
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : <><i className="ri-save-line me-1"></i>{editId ? "Save Changes" : "Create Config"}</>}
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
