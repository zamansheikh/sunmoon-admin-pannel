"use client";

import { useEffect, useState } from "react";
import { getRocketConfig, updateRocketConfig, RocketConfig } from "@/lib/api";

type LevelRow = { milestone: string; rewardNumber: string };

const emptyRow = (): LevelRow => ({ milestone: "", rewardNumber: "" });

export default function RocketSetupPage() {
  const [rows, setRows] = useState<LevelRow[]>([emptyRow()]);
  const [coinMin, setCoinMin] = useState("");
  const [coinMax, setCoinMax] = useState("");
  const [xpMin, setXpMin] = useState("");
  const [xpMax, setXpMax] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setPageError("");
    try {
      const cfg = await getRocketConfig();
      if (cfg) {
        const len = Math.max(cfg.milestones.length, cfg.rewardNumbers.length);
        setRows(
          Array.from({ length: len }, (_, i) => ({
            milestone: String(cfg.milestones[i] ?? ""),
            rewardNumber: String(cfg.rewardNumbers[i] ?? ""),
          }))
        );
        setCoinMin(String(cfg.coinMin));
        setCoinMax(String(cfg.coinMax));
        setXpMin(String(cfg.xpMin));
        setXpMax(String(cfg.xpMax));
      }
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load rocket config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateRow = (idx: number, key: keyof LevelRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleSave = async () => {
    setSaving(true);
    setPageError("");
    setSuccess("");
    try {
      const milestones = rows.map((r) => Number(r.milestone));
      const rewardNumbers = rows.map((r) => Number(r.rewardNumber));

      // ── Client-side validation mirroring the backend rules ──
      if (rows.length === 0)
        throw new Error("Add at least one level.");
      if (milestones.some((n) => Number.isNaN(n)) || rewardNumbers.some((n) => Number.isNaN(n)))
        throw new Error("Every level needs a numeric milestone and reward count.");
      const cMin = Number(coinMin), cMax = Number(coinMax);
      const xMin = Number(xpMin), xMax = Number(xpMax);
      if ([cMin, cMax, xMin, xMax].some((n) => Number.isNaN(n)))
        throw new Error("Coin and XP min/max must be numbers.");
      if (cMin > cMax) throw new Error("Coin Min cannot be greater than Coin Max.");
      if (xMin > xMax) throw new Error("XP Min cannot be greater than XP Max.");

      const payload: RocketConfig = {
        milestones,
        rewardNumbers,
        coinMin: cMin,
        coinMax: cMax,
        xpMin: xMin,
        xpMax: xMax,
      };
      await updateRocketConfig(payload);
      setSuccess("Rocket configuration saved and synchronized.");
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to save rocket config");
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
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Rooms</li>
                <li className="breadcrumb-item active">Rocket Setup</li>
              </ol>
            </div>
            <h4 className="page-title">Rocket Setup</h4>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex align-items-center py-2 mb-3">
          <i className="ri-check-line me-2"></i>{success}
          <button className="btn-close ms-auto" onClick={() => setSuccess("")} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="row">
          {/* Levels: milestone + reward count per level */}
          <div className="col-12 col-lg-7">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h4 className="header-title mb-0">
                  <i className="ri-rocket-2-line me-2 text-primary"></i>
                  Levels &amp; Milestones
                </h4>
                <button className="btn btn-sm btn-soft-primary" onClick={addRow}>
                  <i className="ri-add-line me-1"></i>Add Level
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted fs-13 mb-3">
                  Each level needs a fuel <strong>milestone</strong> (coins to launch)
                  and a <strong>reward count</strong> (how many users are rewarded).
                  Both lists must stay the same length.
                </p>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 70 }}>Level</th>
                        <th>Milestone (fuel)</th>
                        <th>Reward Count</th>
                        <th style={{ width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx}>
                          <td className="fw-medium">{idx + 1}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="e.g. 30000000"
                              value={r.milestone}
                              onChange={(e) => updateRow(idx, "milestone", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="e.g. 20"
                              value={r.rewardNumber}
                              onChange={(e) => updateRow(idx, "rewardNumber", e.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-soft-danger"
                              title="Remove level"
                              onClick={() => removeRow(idx)}
                              disabled={rows.length <= 1}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Reward ranges */}
          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-header">
                <h4 className="header-title mb-0">
                  <i className="ri-coin-line me-2 text-warning"></i>
                  Reward Ranges
                </h4>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fs-13">Coin Min</label>
                    <input type="number" className="form-control" value={coinMin}
                      onChange={(e) => setCoinMin(e.target.value)} placeholder="e.g. 1000" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Coin Max</label>
                    <input type="number" className="form-control" value={coinMax}
                      onChange={(e) => setCoinMax(e.target.value)} placeholder="e.g. 10000" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">XP Min</label>
                    <input type="number" className="form-control" value={xpMin}
                      onChange={(e) => setXpMin(e.target.value)} placeholder="e.g. 100" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">XP Max</label>
                    <input type="number" className="form-control" value={xpMax}
                      onChange={(e) => setXpMax(e.target.value)} placeholder="e.g. 1000" />
                  </div>
                </div>
                <hr className="my-3" />
                <button
                  className="btn btn-primary w-100"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  ) : (
                    <><i className="ri-save-line me-1"></i>Save Configuration</>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary w-100 mt-2"
                  onClick={load}
                  disabled={loading || saving}
                >
                  <i className="ri-refresh-line me-1"></i>Reset to Saved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
