"use client";

import { useState } from "react";
import { PROJECT_NAME, PLAYSTORE_URL, APP_STORE_URL, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/constants";

export default function AppConfigPage() {
  const [form, setForm] = useState({
    appName: PROJECT_NAME,
    appVersion: "2.1.0",
    minAndroidVersion: "1.8.0",
    minIosVersion: "1.8.0",
    playStoreUrl: PLAYSTORE_URL,
    appStoreUrl: APP_STORE_URL,
    supportEmail: SUPPORT_EMAIL,
    supportWhatsapp: SUPPORT_WHATSAPP,
    maxRoomCapacity: "200",
    maxSeats: "8",
    defaultLanguage: "en",
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

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">{PROJECT_NAME}</a></li>
                <li className="breadcrumb-item">System Settings</li>
                <li className="breadcrumb-item active">App Config</li>
              </ol>
            </div>
            <h4 className="page-title">App Configuration</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-xl-8">
          {saved && (
            <div className="alert alert-success py-2 mb-3">
              <i className="ri-check-line me-1"></i>App configuration saved successfully.
            </div>
          )}

          {/* App Info */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-smartphone-line me-2 text-primary"></i>App Information
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">App Name</label>
                  <input type="text" className="form-control" value={form.appName} onChange={(e) => set("appName", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Current Version</label>
                  <input type="text" className="form-control" value={form.appVersion} onChange={(e) => set("appVersion", e.target.value)} placeholder="e.g. 2.1.0" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Min Android Version</label>
                  <input type="text" className="form-control" value={form.minAndroidVersion} onChange={(e) => set("minAndroidVersion", e.target.value)} placeholder="e.g. 1.8.0" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Min iOS Version</label>
                  <input type="text" className="form-control" value={form.minIosVersion} onChange={(e) => set("minIosVersion", e.target.value)} placeholder="e.g. 1.8.0" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Play Store URL</label>
                  <input type="url" className="form-control" value={form.playStoreUrl} onChange={(e) => set("playStoreUrl", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">App Store URL</label>
                  <input type="url" className="form-control" value={form.appStoreUrl} onChange={(e) => set("appStoreUrl", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-customer-service-2-line me-2 text-primary"></i>Support Contact
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Support Email</label>
                  <input type="email" className="form-control" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">WhatsApp Support</label>
                  <input type="text" className="form-control" value={form.supportWhatsapp} onChange={(e) => set("supportWhatsapp", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Room Settings */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-mic-line me-2 text-primary"></i>Room Settings
              </h4>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Max Room Capacity</label>
                  <input type="number" className="form-control" value={form.maxRoomCapacity} onChange={(e) => set("maxRoomCapacity", e.target.value)} min="1" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Max Seats Per Room</label>
                  <input type="number" className="form-control" value={form.maxSeats} onChange={(e) => set("maxSeats", e.target.value)} min="1" max="20" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Default Language</label>
                  <select className="form-select" value={form.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value)}>
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="tr">Turkish</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="text-end">
            <button className="btn btn-primary px-4" disabled={saving} onClick={handleSave}>
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
              ) : (
                <><i className="ri-save-line me-1"></i>Save Configuration</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
