"use client";

import { useState } from "react";

export default function MaintenanceModePage() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("We're performing scheduled maintenance. We'll be back shortly. Thank you for your patience!");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // TODO: Wire up to backend API
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
                <li className="breadcrumb-item">CMS</li>
                <li className="breadcrumb-item active">Maintenance Mode</li>
              </ol>
            </div>
            <h4 className="page-title">Maintenance Mode</h4>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">

          {/* Status Card */}
          <div className={`card border-2 mb-4 ${enabled ? "border-danger" : "border-success"}`}>
            <div className={`card-body d-flex align-items-center gap-4 py-4 ${enabled ? "bg-danger bg-opacity-10" : "bg-success bg-opacity-10"}`}>
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${enabled ? "bg-danger" : "bg-success"}`}
                style={{ width: 64, height: 64 }}
              >
                <i className={`fs-2 text-white ${enabled ? "ri-tools-line" : "ri-server-line"}`}></i>
              </div>
              <div className="flex-grow-1">
                <h4 className={`mb-1 ${enabled ? "text-danger" : "text-success"}`}>
                  {enabled ? "Maintenance Mode is ACTIVE" : "App is LIVE"}
                </h4>
                <p className="mb-0 text-muted fs-14">
                  {enabled
                    ? "Users are currently seeing the maintenance screen."
                    : "The app is operating normally. All users can access the platform."}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="form-check form-switch" style={{ transform: "scale(1.6)", transformOrigin: "right center" }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="maintenanceToggle"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="card">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-message-3-line me-2 text-primary"></i>Maintenance Message
              </h4>
            </div>
            <div className="card-body">
              {saved && (
                <div className="alert alert-success py-2 mb-3">
                  <i className="ri-check-line me-1"></i>Settings saved successfully.
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Message shown to users during maintenance</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter maintenance message..."
                />
                <small className="text-muted">This message will be displayed to users when they open the app during maintenance.</small>
              </div>

              <div className="alert alert-warning py-2 mb-3">
                <i className="ri-alert-line me-1"></i>
                <strong>Warning:</strong> Enabling maintenance mode will immediately block all users from accessing the app.
                Make sure to notify your team before enabling.
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="me-2">Current Status:</span>
                  <span className={`badge ${enabled ? "bg-danger" : "bg-success"} fs-12`}>
                    {enabled ? "MAINTENANCE" : "ONLINE"}
                  </span>
                </div>
                <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  ) : (
                    <><i className="ri-save-line me-1"></i>Save Settings</>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
