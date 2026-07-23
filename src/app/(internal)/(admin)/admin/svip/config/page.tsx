"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSvipConfig,
  updateSvipConfig,
  SvipConfig,
  SvipTierConfig,
} from "@/lib/api";
import { PROJECT_NAME } from "@/lib/constants";

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

type Flash = { type: "success" | "danger"; text: string } | null;

export default function SvipConfigPage() {
  const [config, setConfig] = useState<SvipConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  // Edit modal state
  const [editTier, setEditTier] = useState<SvipTierConfig | null>(null);
  const [editMilestone, setEditMilestone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Retention threshold editing
  const [editingRetention, setEditingRetention] = useState(false);
  const [retentionValue, setRetentionValue] = useState("");
  const [isSavingRetention, setIsSavingRetention] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setFlash(null);
    try {
      const data = await getSvipConfig();
      setConfig(data);
      setRetentionValue(String(data.retentionThreshold));
    } catch (e: unknown) {
      setFlash({
        type: "danger",
        text: e instanceof Error ? e.message : "Failed to load SVIP config",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const openEditModal = (tier: SvipTierConfig) => {
    setEditTier(tier);
    setEditMilestone(String(tier.milestoneCoins));
    setEditError("");
  };

  const closeEditModal = () => {
    setEditTier(null);
    setEditMilestone("");
    setEditError("");
    setIsSaving(false);
  };

  const handleSaveTier = async () => {
    if (!editTier || !config) return;
    const milestone = Number(editMilestone);
    if (Number.isNaN(milestone) || milestone <= 0) {
      setEditError("Milestone must be a positive number.");
      return;
    }
    setIsSaving(true);
    setEditError("");
    try {
      const updatedTiers = config.tiers.map((t) =>
        t.tier === editTier.tier ? { ...t, milestoneCoins: milestone } : t
      );
      const result = await updateSvipConfig({
        tiers: updatedTiers.map((t) => ({
          tier: t.tier,
          milestoneCoins: t.milestoneCoins,
        })),
        retentionThreshold: config.retentionThreshold,
      });
      setConfig(result);
      setRetentionValue(String(result.retentionThreshold));
      setFlash({ type: "success", text: `SVIP-${editTier.tier} milestone updated to ${milestone.toLocaleString()} coins.` });
      closeEditModal();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRetention = async () => {
    if (!config) return;
    const val = Number(retentionValue);
    if (Number.isNaN(val) || val <= 0 || val > 1) {
      setFlash({ type: "danger", text: "Retention threshold must be between 0 and 1." });
      return;
    }
    setIsSavingRetention(true);
    try {
      const result = await updateSvipConfig({
        tiers: config.tiers.map((t) => ({
          tier: t.tier,
          milestoneCoins: t.milestoneCoins,
        })),
        retentionThreshold: val,
      });
      setConfig(result);
      setRetentionValue(String(result.retentionThreshold));
      setFlash({ type: "success", text: "Retention threshold updated." });
      setEditingRetention(false);
    } catch (e: unknown) {
      setFlash({
        type: "danger",
        text: e instanceof Error ? e.message : "Failed to update retention threshold",
      });
    } finally {
      setIsSavingRetention(false);
    }
  };

  const formatCoins = (n: number) => n.toLocaleString();

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
                <li className="breadcrumb-item active">SVIP Config</li>
              </ol>
            </div>
            <h4 className="page-title">SVIP Tier Configuration</h4>
          </div>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`alert alert-${flash.type} py-2 mb-3`}>
          <i className={`me-1 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
          {flash.text}
          <button className="btn-close float-end" onClick={() => setFlash(null)} />
        </div>
      )}

      {/* Retention Threshold Card */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="mb-1">
                    <i className="ri-shield-check-line me-2 text-info"></i>
                    Retention Threshold
                  </h5>
                  <p className="text-muted mb-0 fs-13">
                    Fraction of a tier&apos;s milestone a user must recharge to retain their tier next month.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {editingRetention ? (
                    <>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: 100 }}
                        step="0.1"
                        min="0.01"
                        max="1"
                        value={retentionValue}
                        onChange={(e) => setRetentionValue(e.target.value)}
                        disabled={isSavingRetention}
                      />
                      <button
                        className="btn btn-sm btn-success"
                        onClick={handleSaveRetention}
                        disabled={isSavingRetention}
                      >
                        {isSavingRetention ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <i className="ri-check-line"></i>
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setEditingRetention(false);
                          setRetentionValue(String(config?.retentionThreshold ?? 0.5));
                        }}
                        disabled={isSavingRetention}
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="badge bg-info fs-14 px-3 py-2">
                        {config?.retentionThreshold ?? "—"}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => setEditingRetention(true)}
                        disabled={isLoading}
                      >
                        <i className="ri-pencil-line"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-vip-crown-2-line me-2 text-warning"></i>
            Tier Milestones
          </h4>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchConfig}
            disabled={isLoading}
          >
            <i className={`ri-refresh-line me-1 ${isLoading ? "spin-anim" : ""}`}></i>
            Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status" />
            </div>
          ) : !config || config.tiers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-settings-3-line fs-1 d-block mb-2"></i>
              No SVIP configuration found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Tier</th>
                    <th>Milestone Coins</th>
                    <th>Store Item</th>
                    <th className="text-center" style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {config.tiers.map((tier) => (
                    <tr key={tier.tier}>
                      <td>
                        <span
                          className="badge"
                          style={{ backgroundColor: LEVEL_COLORS[tier.tier] ?? "#9E9E9E" }}
                        >
                          {tier.tier}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold">SVIP-{tier.tier}</span>
                      </td>
                      <td>
                        <span className="text-warning-emphasis fw-medium">
                          <i className="ri-copper-coin-line me-1"></i>
                          {formatCoins(tier.milestoneCoins)}
                        </span>
                      </td>
                      <td>
                        {tier.storeItemId ? (
                          <span className="badge bg-success">
                            <i className="ri-link me-1"></i>
                            {tier.storeItemId}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-soft-primary"
                          title="Edit milestone"
                          onClick={() => openEditModal(tier)}
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Tier Modal */}
      {editTier && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <span
                    className="badge me-2"
                    style={{ backgroundColor: LEVEL_COLORS[editTier.tier] ?? "#9E9E9E" }}
                  >
                    SVIP-{editTier.tier}
                  </span>
                  Edit Milestone
                </h5>
                <button className="btn-close" onClick={closeEditModal} disabled={isSaving} />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Monthly recharge milestone for <strong>SVIP-{editTier.tier}</strong>.
                  Users must recharge this many coins in a calendar month to reach this tier.
                </p>
                {editError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{editError}
                  </div>
                )}
                <label className="form-label fs-13">Milestone Coins</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 1000000"
                  value={editMilestone}
                  onChange={(e) => setEditMilestone(e.target.value)}
                  disabled={isSaving}
                  autoFocus
                />
                {editTier.storeItemId && (
                  <div className="alert alert-info py-2 mt-3 mb-0 fs-13">
                    <i className="ri-information-line me-1"></i>
                    Linked store item: <code>{editTier.storeItemId}</code> (auto-synced, do not edit manually).
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeEditModal} disabled={isSaving}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveTier}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  ) : "Save Milestone"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
