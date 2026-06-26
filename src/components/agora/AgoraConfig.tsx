"use client";

import { FormEvent, useEffect, useState } from "react";
import AgoraSubnav from "./AgoraSubnav";
import { useAgoraAuth } from "./AgoraGate";

interface ConfigData {
  agoraAppId: string;
  agoraAppCertificate: string;
  defaultChannelName: string;
  defaultUid: string;
  defaultRole: "publisher" | "subscriber";
  defaultExpireTime: number;
}

const EMPTY: ConfigData = {
  agoraAppId: "",
  agoraAppCertificate: "",
  defaultChannelName: "",
  defaultUid: "0",
  defaultRole: "publisher",
  defaultExpireTime: 3600,
};

export default function AgoraConfig() {
  const { authedFetch } = useAgoraAuth();
  const [form, setForm] = useState<ConfigData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await authedFetch<{ success: boolean; config: ConfigData }>("/api/agora/admin/config");
      setForm({
        agoraAppId: r.config.agoraAppId ?? "",
        agoraAppCertificate: r.config.agoraAppCertificate ?? "",
        defaultChannelName: r.config.defaultChannelName ?? "",
        defaultUid: r.config.defaultUid ?? "0",
        defaultRole: (r.config.defaultRole as ConfigData["defaultRole"]) ?? "publisher",
        defaultExpireTime: r.config.defaultExpireTime ?? 3600,
      });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await authedFetch("/api/agora/admin/config", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage({ kind: "success", text: "Configuration saved." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <>
      <AgoraSubnav />

      <div className="row mb-3">
        <div className="col-12">
          <h4 className="mb-1">Server Configuration</h4>
          <p className="text-muted fs-13">
            Credentials are stored in the backend database (and cached locally for token
            generation), so they persist across deploys. Updates take effect immediately.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Agora Credentials</h5>

              <div className="mb-3">
                <label className="form-label">App ID</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={form.agoraAppId}
                    onChange={(e) => setForm({ ...form, agoraAppId: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => copy(form.agoraAppId)}
                    title="Copy"
                  >
                    <i className="ri-file-copy-line"></i>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">App Certificate</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={form.agoraAppCertificate}
                    onChange={(e) => setForm({ ...form, agoraAppCertificate: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => copy(form.agoraAppCertificate)}
                    title="Copy"
                  >
                    <i className="ri-file-copy-line"></i>
                  </button>
                </div>
              </div>

              <h5 className="card-title mt-4">Default Token Parameters</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Default Channel</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.defaultChannelName}
                    onChange={(e) => setForm({ ...form, defaultChannelName: e.target.value })}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Default UID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.defaultUid}
                    onChange={(e) => setForm({ ...form, defaultUid: e.target.value })}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Default Role</label>
                  <select
                    className="form-select"
                    value={form.defaultRole}
                    onChange={(e) =>
                      setForm({ ...form, defaultRole: e.target.value as ConfigData["defaultRole"] })
                    }
                  >
                    <option value="publisher">Publisher</option>
                    <option value="subscriber">Subscriber</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Token Expiry (seconds)</label>
                  <input
                    type="number"
                    min={60}
                    className="form-control"
                    value={form.defaultExpireTime}
                    onChange={(e) =>
                      setForm({ ...form, defaultExpireTime: parseInt(e.target.value, 10) })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center mt-3">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="ri-save-line me-1"></i> {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn btn-light" onClick={load} disabled={saving}>
              <i className="ri-refresh-line me-1"></i> Reset to Saved
            </button>
            {message && (
              <span
                className={`fs-13 ${message.kind === "success" ? "text-success" : "text-danger"}`}
              >
                {message.text}
              </span>
            )}
          </div>
        </form>
      )}
    </>
  );
}
