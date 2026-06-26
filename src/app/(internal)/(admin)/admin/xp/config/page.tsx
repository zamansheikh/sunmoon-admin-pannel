"use client";

import { useEffect, useState } from "react";
import { getXpConfig, updateXpConfig, SvipMultiplier } from "@/lib/api";

type SvipRow = { minLevel: string; multiplier: string };

const emptySvip = (): SvipRow => ({ minLevel: "", multiplier: "" });

export default function XpConfigPage() {
  // xpLevels is edited as free text (comma / space / newline separated) since
  // there are ~52 thresholds — far nicer than 52 inputs.
  const [levelsText, setLevelsText] = useState("");
  const [giftSendXp, setGiftSendXp] = useState("");
  const [svipRows, setSvipRows] = useState<SvipRow[]>([emptySvip()]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setPageError("");
    try {
      const cfg = await getXpConfig();
      if (cfg) {
        setLevelsText(cfg.xpLevels.join(", "));
        setGiftSendXp(String(cfg.giftSendXp));
        setSvipRows(
          cfg.svipMultipliers.length > 0
            ? cfg.svipMultipliers.map((s) => ({
                minLevel: String(s.minLevel),
                multiplier: String(s.multiplier),
              }))
            : [emptySvip()]
        );
      }
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load XP config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parsedLevels = levelsText
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s));

  const updateSvip = (idx: number, key: keyof SvipRow, value: string) =>
    setSvipRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const addSvip = () => setSvipRows((prev) => [...prev, emptySvip()]);
  const removeSvip = (idx: number) =>
    setSvipRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleSave = async () => {
    setSaving(true);
    setPageError("");
    setSuccess("");
    try {
      // ── xpLevels: positive numbers, strictly ascending ──
      if (parsedLevels.length === 0)
        throw new Error("Enter at least one XP level threshold.");
      if (parsedLevels.some((n) => Number.isNaN(n) || n <= 0))
        throw new Error("Every XP level must be a positive number.");
      for (let i = 1; i < parsedLevels.length; i++) {
        if (parsedLevels[i] <= parsedLevels[i - 1]) {
          throw new Error(
            `xpLevels must be strictly ascending. Level ${i + 1} (${parsedLevels[i]}) is not greater than level ${i} (${parsedLevels[i - 1]}).`
          );
        }
      }

      // ── giftSendXp: positive number ──
      const gift = Number(giftSendXp);
      if (Number.isNaN(gift) || gift <= 0)
        throw new Error("Gift Send XP (coin → XP divisor) must be a positive number.");

      // ── svipMultipliers: minLevel ≥ 0, multiplier > 0 ──
      const svipMultipliers: SvipMultiplier[] = [];
      for (const r of svipRows) {
        const minLevel = Number(r.minLevel);
        const multiplier = Number(r.multiplier);
        if (Number.isNaN(minLevel) || minLevel < 0)
          throw new Error("Each SVIP tier needs a non-negative Min Level.");
        if (Number.isNaN(multiplier) || multiplier <= 0)
          throw new Error("Each SVIP tier needs a positive Multiplier.");
        svipMultipliers.push({ minLevel, multiplier });
      }
      if (svipMultipliers.length === 0)
        throw new Error("Add at least one SVIP multiplier tier.");

      await updateXpConfig({ xpLevels: parsedLevels, giftSendXp: gift, svipMultipliers });
      setSuccess("XP configuration saved and cache synchronized.");
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to save XP config");
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
                <li className="breadcrumb-item">XP &amp; Levels</li>
                <li className="breadcrumb-item active">XP Configuration</li>
              </ol>
            </div>
            <h4 className="page-title">XP Configuration</h4>
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
          {/* Level thresholds */}
          <div className="col-12 col-lg-7">
            <div className="card">
              <div className="card-header">
                <h4 className="header-title mb-0">
                  <i className="ri-bar-chart-2-line me-2 text-primary"></i>
                  Level Thresholds
                </h4>
              </div>
              <div className="card-body">
                <p className="text-muted fs-13 mb-2">
                  The XP needed to reach each level, as a <strong>strictly ascending</strong>
                  list of positive numbers (comma, space, or newline separated). Level 1 is
                  the first value, level 2 the second, and so on. A user with XP below the
                  first value is level 0.
                </p>
                <textarea
                  className="form-control font-monospace"
                  rows={8}
                  placeholder="160, 325, 460, 625, 805, …"
                  value={levelsText}
                  onChange={(e) => setLevelsText(e.target.value)}
                />
                <div className="d-flex justify-content-between mt-2 fs-13">
                  <span className="text-muted">
                    {parsedLevels.length} level{parsedLevels.length === 1 ? "" : "s"} parsed
                  </span>
                  {parsedLevels.length > 0 && (
                    <span className="text-muted">
                      Max level {parsedLevels.length} at{" "}
                      {parsedLevels[parsedLevels.length - 1].toLocaleString()} XP
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SVIP multipliers */}
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h4 className="header-title mb-0">
                  <i className="ri-vip-crown-2-line me-2 text-warning"></i>
                  SVIP Multipliers
                </h4>
                <button className="btn btn-sm btn-soft-primary" onClick={addSvip}>
                  <i className="ri-add-line me-1"></i>Add Tier
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted fs-13 mb-3">
                  Boosts XP earned from spending coins, based on the user&apos;s highest owned
                  SVIP tier. <strong>Min Level</strong> is the SVIP tier (0 = no SVIP / base),
                  <strong> Multiplier</strong> scales the XP (1.0 = no boost).
                </p>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>SVIP Tier (Min Level)</th>
                        <th>Multiplier</th>
                        <th style={{ width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {svipRows.map((r, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="e.g. 0"
                              value={r.minLevel}
                              onChange={(e) => updateSvip(idx, "minLevel", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              className="form-control form-control-sm"
                              placeholder="e.g. 1.2"
                              value={r.multiplier}
                              onChange={(e) => updateSvip(idx, "multiplier", e.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-soft-danger"
                              title="Remove tier"
                              onClick={() => removeSvip(idx)}
                              disabled={svipRows.length <= 1}
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

          {/* Coin → XP + Save */}
          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-header">
                <h4 className="header-title mb-0">
                  <i className="ri-copper-coin-line me-2 text-warning"></i>
                  Coin → XP Conversion
                </h4>
              </div>
              <div className="card-body">
                <label className="form-label fs-13">Gift Send XP (divisor)</label>
                <input
                  type="number"
                  className="form-control"
                  value={giftSendXp}
                  onChange={(e) => setGiftSendXp(e.target.value)}
                  placeholder="e.g. 600"
                />
                <p className="text-muted fs-12 mt-2 mb-0">
                  XP earned = coins ÷ this value × SVIP multiplier. A <strong>lower</strong>
                  number means more XP per coin spent. e.g. 600 → 3000 coins = 5 XP at base.
                </p>
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
