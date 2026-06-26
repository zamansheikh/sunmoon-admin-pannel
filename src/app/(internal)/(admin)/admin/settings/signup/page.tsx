"use client";

import { useState } from "react";

export default function SignupBonusPage() {
  const [form, setForm] = useState({
    enabled: true,
    signupBonus: "50",
    emailVerifyBonus: "25",
    phoneVerifyBonus: "25",
    profileCompleteBonus: "50",
    firstRechargeBonus: "100",
    firstRechargeMultiplier: "2",
    newUserDailyBonus: "10",
    newUserDailyDays: "7",
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
                <li className="breadcrumb-item active">Signup Bonus</li>
              </ol>
            </div>
            <h4 className="page-title">Signup Bonus Settings</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-xl-8">
          {saved && (
            <div className="alert alert-success py-2 mb-3">
              <i className="ri-check-line me-1"></i>Signup bonus settings saved.
            </div>
          )}

          {/* Status Toggle */}
          <div className="card mb-4">
            <div className="card-body d-flex align-items-center justify-content-between py-3">
              <div>
                <h5 className="mb-1">Signup Bonus Program</h5>
                <p className="text-muted mb-0 fs-13">Enable or disable bonuses given to new users when they register.</p>
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

          {/* Registration Bonuses */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-user-add-line me-2 text-primary"></i>Registration Bonuses
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">Account Created</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.signupBonus} onChange={(e) => set("signupBonus", e.target.value)} min="0" />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">Email Verified</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.emailVerifyBonus} onChange={(e) => set("emailVerifyBonus", e.target.value)} min="0" />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">Phone Verified</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.phoneVerifyBonus} onChange={(e) => set("phoneVerifyBonus", e.target.value)} min="0" />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">Profile Completed</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.profileCompleteBonus} onChange={(e) => set("profileCompleteBonus", e.target.value)} min="0" />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* First Recharge Bonus */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-bank-card-line me-2 text-success"></i>First Recharge Bonus
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Bonus Coins on First Recharge</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.firstRechargeBonus} onChange={(e) => set("firstRechargeBonus", e.target.value)} min="0" />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">First Recharge Multiplier</label>
                  <div className="input-group">
                    <span className="input-group-text">×</span>
                    <input type="number" className="form-control" value={form.firstRechargeMultiplier} onChange={(e) => set("firstRechargeMultiplier", e.target.value)} min="1" step="0.5" />
                  </div>
                  <small className="text-muted">Multiply coins received on first purchase</small>
                </div>
              </div>
            </div>
          </div>

          {/* New User Daily Bonus */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-calendar-check-line me-2 text-info"></i>New User Daily Login Bonus
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Daily Bonus Amount</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.newUserDailyBonus} onChange={(e) => set("newUserDailyBonus", e.target.value)} min="0" />
                    <span className="input-group-text">coins / day</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Active for (days after signup)</label>
                  <div className="input-group">
                    <input type="number" className="form-control" value={form.newUserDailyDays} onChange={(e) => set("newUserDailyDays", e.target.value)} min="1" />
                    <span className="input-group-text">days</span>
                  </div>
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
