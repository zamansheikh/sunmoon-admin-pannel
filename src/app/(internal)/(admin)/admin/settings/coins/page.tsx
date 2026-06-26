"use client";

import { useState } from "react";

export default function CoinRateSetupPage() {
  const [form, setForm] = useState({
    // Purchase rates
    coins100: "0.99",
    coins500: "4.99",
    coins1000: "8.99",
    coins2000: "16.99",
    coins5000: "39.99",
    coins10000: "74.99",
    // Diamond to USD rate
    diamondToUsd: "0.001",
    // Name change cost (from update-cost API)
    nameUpdateCost: "100",
    expEquivalentCoin: "10",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

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

  const coinPackages = [
    { key: "coins100", label: "100 Coins" },
    { key: "coins500", label: "500 Coins" },
    { key: "coins1000", label: "1,000 Coins" },
    { key: "coins2000", label: "2,000 Coins" },
    { key: "coins5000", label: "5,000 Coins" },
    { key: "coins10000", label: "10,000 Coins" },
  ];

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">System Settings</li>
                <li className="breadcrumb-item active">Coin Rate Setup</li>
              </ol>
            </div>
            <h4 className="page-title">Coin Rate Setup</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-xl-9">
          {saved && (
            <div className="alert alert-success py-2 mb-3">
              <i className="ri-check-line me-1"></i>Coin rates saved successfully.
            </div>
          )}

          {/* Coin Packages */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-copper-coin-line me-2 text-warning"></i>Coin Purchase Packages (USD)
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {coinPackages.map(({ key, label }) => (
                  <div key={key} className="col-sm-6 col-md-4">
                    <label className="form-label fw-semibold">{label}</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={form[key as keyof typeof form]}
                        onChange={(e) => set(key, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diamond Rate */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-gem-line me-2 text-info"></i>Diamond Conversion Rate
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">1 Diamond = (USD)</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      value={form.diamondToUsd}
                      onChange={(e) => set("diamondToUsd", e.target.value)}
                      min="0"
                      step="0.0001"
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-5 d-flex align-items-end pb-1">
                  <div className="alert alert-info py-2 mb-0 fs-13 w-100">
                    <i className="ri-information-line me-1"></i>
                    Example: 1000 diamonds = ${(1000 * parseFloat(form.diamondToUsd || "0")).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Update Cost */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-price-tag-3-line me-2 text-primary"></i>In-App Action Costs (Coins)
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">Name Change Cost</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={form.nameUpdateCost}
                      onChange={(e) => set("nameUpdateCost", e.target.value)}
                      min="0"
                    />
                    <span className="input-group-text">coins</span>
                  </div>
                </div>
                <div className="col-sm-6 col-md-4">
                  <label className="form-label">EXP per Coin</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={form.expEquivalentCoin}
                      onChange={(e) => set("expEquivalentCoin", e.target.value)}
                      min="1"
                    />
                    <span className="input-group-text">EXP</span>
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
                <><i className="ri-save-line me-1"></i>Save Rates</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
