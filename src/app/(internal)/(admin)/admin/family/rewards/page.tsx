"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFamilyRewardConfigs,
  createFamilyRewardConfig,
  updateFamilyRewardConfig,
  deleteFamilyRewardConfig,
  browseStoreItems,
  FamilyRewardConfig,
  StoreItem,
} from "@/lib/api";
import { PROJECT_NAME } from "@/lib/constants";

type Flash = { type: "success" | "danger"; text: string } | null;
type CategorizedItems = Record<string, StoreItem[]>;

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

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' fill='%23adb5bd'%3E%3Crect width='28' height='28' rx='4' fill='%23e9ecef'/%3E%3Cpath d='M8 20l4-5 3 4 4-6 5 7H3z' fill='%23ced4da'/%3E%3Ccircle cx='10' cy='10' r='2' fill='%23ced4da'/%3E%3C/svg%3E";

export default function FamilyRewardRankingsPage() {
  const [configs, setConfigs] = useState<FamilyRewardConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Per-row store item cache: row index → categorized items
  const [itemsByRow, setItemsByRow] = useState<Record<number, CategorizedItems>>({});
  const [itemsLoading, setItemsLoading] = useState<Record<number, boolean>>({});

  // Custom dropdown state
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Popover state for item details
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  // Click-outside handler for custom dropdown
  useEffect(() => {
    if (openDropdownRow === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownRow(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownRow]);

  // Click-outside handler for item popover
  useEffect(() => {
    if (openPopoverId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopoverId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPopoverId]);

  // Fetch store items for a specific row based on its exclusive flag
  const fetchItemsForRow = useCallback(async (rowIndex: number, isExclusive: boolean) => {
    setItemsLoading((prev) => ({ ...prev, [rowIndex]: true }));
    try {
      // exclusive ON → canUserBuyThis=false (exclusive/grant-only items)
      const data = await browseStoreItems(!isExclusive);
      setItemsByRow((prev) => ({ ...prev, [rowIndex]: data }));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load store items" });
    } finally {
      setItemsLoading((prev) => ({ ...prev, [rowIndex]: false }));
    }
  }, []);

  const openCreate = () => {
    setEditId(null);
    setLabel("");
    setStarRating(3);
    setRankMode("single");
    setRank("");
    setStartRank("");
    setEndRank("");
    setRewardItems([emptyItemRow()]);
    setItemsByRow({});
    setItemsLoading({});
    setModalError("");
    setOpenDropdownRow(null);
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
    const rows: RewardItemRow[] =
      cfg.items.length > 0
        ? cfg.items.map((i) => ({ itemId: i.itemId, duration: String(i.duration), isExclusive: i.isExclusive }))
        : [emptyItemRow()];
    setRewardItems(rows);
    setItemsByRow({});
    setItemsLoading({});
    setModalError("");
    setOpenDropdownRow(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSaving(false);
    setItemsByRow({});
    setItemsLoading({});
    setOpenDropdownRow(null);
  };

  const updateItemRow = (index: number, field: keyof RewardItemRow, value: string | boolean) => {
    setRewardItems((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, [field]: value } : r));
      // If exclusive toggle changed, clear selected itemId and cached items for this row
      if (field === "isExclusive" && prev[index].isExclusive !== value) {
        next[index].itemId = "";
        setItemsByRow((prev2) => {
          const copy = { ...prev2 };
          delete copy[index];
          return copy;
        });
      }
      return next;
    });
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

  const toggleDropdown = useCallback((rowIndex: number, isExclusive: boolean) => {
    if (openDropdownRow === rowIndex) {
      setOpenDropdownRow(null);
      return;
    }
    setOpenDropdownRow(rowIndex);
    // Lazy fetch if not loaded
    if (!itemsByRow[rowIndex]) {
      fetchItemsForRow(rowIndex, isExclusive);
    }
  }, [openDropdownRow, itemsByRow, fetchItemsForRow]);

  const selectItem = (rowIndex: number, itemId: string) => {
    setRewardItems((prev) => prev.map((r, i) => (i === rowIndex ? { ...r, itemId } : r)));
    setOpenDropdownRow(null);
  };

  const renderDropdown = (rowIndex: number, value: string, isExclusive: boolean) => {
    const categorized = itemsByRow[rowIndex] ?? {};
    const isLoading = itemsLoading[rowIndex] ?? false;
    const categories = Object.keys(categorized);
    const isOpen = openDropdownRow === rowIndex;

    // Find selected item name
    let selectedName = "";
    for (const items of Object.values(categorized)) {
      const found = items.find((i) => i._id === value);
      if (found) { selectedName = found.name; break; }
    }

    return (
      <div className="position-relative" ref={isOpen ? dropdownRef : undefined}>
        <div
          className={`form-select form-select-sm ${isOpen ? "shadow" : ""}`}
          style={{ cursor: "pointer", minHeight: "31.5px" }}
          onClick={() => toggleDropdown(rowIndex, isExclusive)}
        >
          {isLoading && !selectedName ? (
            <span className="text-muted">Loading items…</span>
          ) : selectedName ? (
            <span>{selectedName}</span>
          ) : (
            <span className="text-muted">Select item…</span>
          )}
          <i className="ri-arrow-down-s-line position-absolute" style={{ right: "0.5rem", top: "50%", transform: "translateY(-50%)" }}></i>
        </div>

        {isOpen && (
          <div
            className="position-absolute w-100 mt-1 border rounded shadow-sm bg-white"
            style={{ zIndex: 1050, maxHeight: "250px", overflowY: "auto" }}
          >
            {isLoading && categories.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center py-3 text-muted fs-13">
                <div className="spinner-border spinner-border-sm me-2" role="status" />
                Loading items…
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-3 text-muted fs-13">No items available</div>
            ) : (
              categories.map((cat) => {
                const items = categorized[cat];
                if (!items || items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="fw-bold fs-12 text-muted px-2 py-1" style={{ background: "#f8f9fa" }}>{cat}</div>
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className={`d-flex align-items-center gap-2 px-2 py-1 ${value === item._id ? "bg-primary-subtle" : ""}`}
                        style={{ cursor: "pointer", transition: "background 0.1s" }}
                        onMouseEnter={(e) => { if (value !== item._id) e.currentTarget.classList.add("bg-light"); }}
                        onMouseLeave={(e) => { if (value !== item._id) e.currentTarget.classList.remove("bg-light"); }}
                        onClick={() => selectItem(rowIndex, item._id)}
                      >
                        <img
                          src={item.previewFile || item.logo || PLACEHOLDER_IMG}
                          alt={item.name}
                          width={28}
                          height={28}
                          style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
                          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                        />
                        <span className="fs-13 text-truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
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
                        <div className="position-relative d-inline-block">
                          <span
                            className="badge bg-info-subtle text-info"
                            style={{ cursor: "pointer" }}
                            onClick={() => setOpenPopoverId(openPopoverId === cfg._id ? null : cfg._id)}
                          >
                            <i className="ri-gift-line me-1"></i>
                            {cfg.items.length} item{cfg.items.length !== 1 ? "s" : ""}
                          </span>
                          {openPopoverId === cfg._id && (
                            <div
                              ref={popoverRef}
                              className="position-absolute border rounded shadow-sm bg-white mt-1"
                              style={{ zIndex: 1050, width: "280px", maxHeight: "200px", overflowY: "auto", left: 0 }}
                            >
                              {cfg.items.length === 0 ? (
                                <div className="text-center py-3 text-muted fs-13">No items</div>
                              ) : (
                                cfg.items.map((item, i) => {
                                  const populated = typeof item.itemId === "object" && item.itemId !== null
                                    ? item.itemId as { _id: string; name: string; previewFile?: string; logo?: string }
                                    : null;
                                  const itemName = item.itemName || populated?.name || String(item.itemId);
                                  const itemImage = item.itemImage || populated?.previewFile || populated?.logo;
                                  return (
                                    <div key={i} className="d-flex align-items-center gap-2 px-2 py-1 border-bottom">
                                      <img
                                        src={itemImage || PLACEHOLDER_IMG}
                                        alt={itemName}
                                        width={28}
                                        height={28}
                                        style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
                                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                                      />
                                      <div className="flex-grow-1 min-width-0">
                                        <div className="fs-13 fw-medium text-truncate">{itemName}</div>
                                        <div className="d-flex gap-1 align-items-center">
                                          <span className="badge bg-light text-dark fs-11">{item.duration}d</span>
                                          {item.isExclusive && <span className="badge bg-warning-subtle text-warning fs-11">Exclusive</span>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
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
                      {renderDropdown(idx, row.itemId, row.isExclusive)}
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
