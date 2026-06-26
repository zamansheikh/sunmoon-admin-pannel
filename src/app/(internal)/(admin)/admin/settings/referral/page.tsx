"use client";

import { useState } from "react";

export default function ReferralBonusPage() {
  const [form, setForm] = useState({
    enabled: true,
    referrerBonus: "200",
    referredBonus: "100",
    bonusType: "coins",
    minLevelToRefer: "1",
    maxReferralsPerUser: "50",
    expiryDays: "30",
    termsText: "Referral bonus is credited once the referred user completes their first recharge of at least 100 coins.",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
                <li className="breadcrumb-item">System Settings</li>
                <li className="breadcrumb-item active">Referral Bonus</li>
              </ol>
            </div>
            <h4 className="page-title">Referral Bonus Settings</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-xl-8">
          {saved && (
            <div className="alert alert-success py-2 mb-3">
              <i className="ri-check-line me-1"></i>Referral bonus settings saved.
            </div>
          )}

          {/* Status Toggle */}
          <div className="card mb-4">
            <div className="card-body d-flex align-items-center justify-content-between py-3">
              <div>
                <h5 className="mb-1">Referral Program</h5>
                <p className="text-muted mb-0 fs-13">Enable or disable the referral bonus program for all users.</p>
              </div>
              <div className="form-check form-switch ms-3" style={{ transform: "scale(1.4)", transformOrigin: "right center" }}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={form.enabled}
                  onChange={(e) => set("enabled", e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Bonus Amounts */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-gift-line me-2 text-primary"></i>Bonus Amounts
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Referrer Bonus (person who refers)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={form.referrerBonus}
                      onChange={(e) => set("referrerBonus", e.target.value)}
                      min="0"
                    />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Referred Bonus (new user)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={form.referredBonus}
                      onChange={(e) => set("referredBonus", e.target.value)}
                      min="0"
                    />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-settings-3-line me-2 text-primary"></i>Rules & Limits
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-4">
                  <label className="form-label">Min Level to Refer</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.minLevelToRefer}
                    onChange={(e) => set("minLevelToRefer", e.target.value)}
                    min="1"
                  />
                </div>
                <div className="col-sm-4">
                  <label className="form-label">Max Referrals / User</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.maxReferralsPerUser}
                    onChange={(e) => set("maxReferralsPerUser", e.target.value)}
                    min="1"
                  />
                </div>
                <div className="col-sm-4">
                  <label className="form-label">Bonus Expiry (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.expiryDays}
                    onChange={(e) => set("expiryDays", e.target.value)}
                    min="1"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Referral Terms Text</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.termsText}
                    onChange={(e) => set("termsText", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-end">
            <button className="btn btn-primary px-4" disabled={saving} onClick={handleSave}>
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
              ) : (
                <><i className="ri-save-line me-1"></i>Save Settings</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
