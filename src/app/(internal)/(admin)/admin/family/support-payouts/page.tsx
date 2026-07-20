"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getFamilySupportRewards,
  updateFamilySupportReward,
  FamilySupportReward,
} from "@/lib/api";
import { PROJECT_NAME } from "@/lib/constants";

type Flash = { type: "success" | "danger"; text: string } | null;

const fmt = (n?: number) => (n ?? 0).toLocaleString();

export default function FamilySupportPayoutsPage() {
  const [levels, setLevels] = useState<FamilySupportReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editLevel, setEditLevel] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form state
  const [form, setForm] = useState({
    targetPoints: "",
    totalBonus: "",
    leaderCut: "",
    top1Cut: "",
    top2Cut: "",
    top3Cut: "",
    top4To10Cut: "",
    top11To15Cut: "",
    top16To20Cut: "",
    minContributionRequired: "",
  });

  const loadLevels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFamilySupportRewards();
      setLevels(data.sort((a, b) => a.level - b.level));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load support rewards" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLevels(); }, [loadLevels]);

  const openEdit = (lvl: FamilySupportReward) => {
    setEditLevel(lvl.level);
    setForm({
      targetPoints: String(lvl.targetPoints),
      totalBonus: String(lvl.totalBonus),
      leaderCut: String(lvl.leaderCut),
      top1Cut: String(lvl.top1Cut),
      top2Cut: String(lvl.top2Cut),
      top3Cut: String(lvl.top3Cut),
      top4To10Cut: String(lvl.top4To10Cut),
      top11To15Cut: String(lvl.top11To15Cut),
      top16To20Cut: String(lvl.top16To20Cut),
      minContributionRequired: String(lvl.minContributionRequired),
    });
    setModalError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setSaving(false); };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (editLevel == null) return;
    const numFields: Record<string, number> = {};
    for (const [k, v] of Object.entries(form)) {
      const n = Number(v);
      if (n < 0) return setModalError(`${k} cannot be negative.`);
      numFields[k] = n;
    }

    setSaving(true);
    setModalError("");
    try {
      await updateFamilySupportReward(editLevel, numFields);
      setFlash({ type: "success", text: `Level ${editLevel} updated.` });
      closeModal();
      loadLevels();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
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
                <li className="breadcrumb-item active">Support Payouts</li>
              </ol>
            </div>
            <h4 className="page-title">Family Support Payouts</h4>
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
        Configure the <strong>coin payout distribution</strong> for each family ranking level. Each level defines how coins are split among family members based on their weekly contribution.
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri coins-line me-2 text-primary"></i>
            Support Reward Levels <span className="badge bg-secondary ms-1">{levels.length}</span>
          </h4>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadLevels} disabled={loading}>
            <i className={`ri-refresh-line ${loading ? "spin-anim" : ""}`}></i>
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : levels.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-coins-line fs-1 d-block mb-2"></i>
              No support reward levels configured.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Level</th>
                    <th>Target Pts</th>
                    <th>Total Bonus</th>
                    <th>Leader</th>
                    <th>Top 1</th>
                    <th>Top 2</th>
                    <th>Top 3</th>
                    <th>Min Contrib.</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((lvl) => (
                    <tr key={lvl.level}>
                      <td>
                        <span className="badge bg-primary-subtle text-primary fw-semibold">Lv.{lvl.level}</span>
                      </td>
                      <td>{fmt(lvl.targetPoints)}</td>
                      <td className="text-warning-emphasis fw-medium">{fmt(lvl.totalBonus)}</td>
                      <td>{fmt(lvl.leaderCut)}</td>
                      <td>{fmt(lvl.top1Cut)}</td>
                      <td>{fmt(lvl.top2Cut)}</td>
                      <td>{fmt(lvl.top3Cut)}</td>
                      <td className="fs-13 text-muted">{fmt(lvl.minContributionRequired)}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-soft-primary" title="Edit" onClick={() => openEdit(lvl)}>
                          <i className="ri-edit-line"></i>
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

      {modalOpen && editLevel != null && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-settings-3-line me-2 text-primary"></i>
                  Edit Level {editLevel} Support Rewards
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{modalError}
                  </div>
                )}

                <div className="mb-3">
                  <span className="badge bg-primary-subtle text-primary fs-13">Level {editLevel}</span>
                </div>

                <h6 className="text-muted mb-2">
                  <i className="ri-flag-line me-1"></i>Performance Targets
                </h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fs-13">Target Points</label>
                    <input type="number" className="form-control" value={form.targetPoints}
                      onChange={(e) => set("targetPoints", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fs-13">Min Contribution Required</label>
                    <input type="number" className="form-control" value={form.minContributionRequired}
                      onChange={(e) => set("minContributionRequired", e.target.value)} min="0" />
                  </div>
                </div>

                <h6 className="text-muted mb-2">
                  <i className="ri-coins-line me-1"></i>Coin Distribution
                </h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fs-13">Total Bonus</label>
                    <input type="number" className="form-control" value={form.totalBonus}
                      onChange={(e) => set("totalBonus", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fs-13">Leader Cut</label>
                    <input type="number" className="form-control" value={form.leaderCut}
                      onChange={(e) => set("leaderCut", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13">Top 1 Cut</label>
                    <input type="number" className="form-control" value={form.top1Cut}
                      onChange={(e) => set("top1Cut", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13">Top 2 Cut</label>
                    <input type="number" className="form-control" value={form.top2Cut}
                      onChange={(e) => set("top2Cut", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13">Top 3 Cut</label>
                    <input type="number" className="form-control" value={form.top3Cut}
                      onChange={(e) => set("top3Cut", e.target.value)} min="0" />
                  </div>
                </div>

                <h6 className="text-muted mb-2">
                  <i className="ri-group-line me-1"></i>Group Cuts
                </h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fs-13">Top 4–10 Cut (each)</label>
                    <input type="number" className="form-control" value={form.top4To10Cut}
                      onChange={(e) => set("top4To10Cut", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13">Top 11–15 Cut (each)</label>
                    <input type="number" className="form-control" value={form.top11To15Cut}
                      onChange={(e) => set("top11To15Cut", e.target.value)} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13">Top 16–20 Cut (each)</label>
                    <input type="number" className="form-control" value={form.top16To20Cut}
                      onChange={(e) => set("top16To20Cut", e.target.value)} min="0" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : <><i className="ri-save-line me-1"></i>Save Changes</>}
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
