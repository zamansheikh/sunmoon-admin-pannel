"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  service: string;
  key: string;
  visible: boolean;
}

const INITIAL_KEYS: ApiKey[] = [
  { id: "firebase_server", name: "Firebase Server Key", service: "Firebase / FCM", key: "AAAA•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••", visible: false },
  { id: "agora_app_id", name: "Agora App ID", service: "Agora RTC", key: "a1b2c3d4e5f6g7h8i9j0", visible: false },
  { id: "agora_cert", name: "Agora App Certificate", service: "Agora RTC", key: "••••••••••••••••••••••••••••••••", visible: false },
  { id: "cloudinary_name", name: "Cloudinary Cloud Name", service: "Cloudinary", key: "addalive-media", visible: false },
  { id: "cloudinary_api_key", name: "Cloudinary API Key", service: "Cloudinary", key: "123456789012345", visible: false },
  { id: "cloudinary_secret", name: "Cloudinary API Secret", service: "Cloudinary", key: "••••••••••••••••••••••••••••", visible: false },
  { id: "jwt_secret", name: "JWT Secret", service: "Auth", key: "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••", visible: false },
  { id: "stripe_pk", name: "Stripe Publishable Key", service: "Stripe", key: "pk_live_••••••••••••••••••••••", visible: false },
  { id: "stripe_sk", name: "Stripe Secret Key", service: "Stripe", key: "sk_live_••••••••••••••••••••••••", visible: false },
];

const SERVICE_COLORS: Record<string, string> = {
  "Firebase / FCM": "bg-warning-subtle text-warning",
  "Agora RTC": "bg-primary-subtle text-primary",
  "Cloudinary": "bg-info-subtle text-info",
  "Auth": "bg-secondary-subtle text-secondary",
  "Stripe": "bg-success-subtle text-success",
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const toggleVisible = (id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, visible: !k.visible } : k));
  };

  const startEdit = (k: ApiKey) => {
    setEditingId(k.id);
    setEditVal(k.key);
  };

  const saveEdit = (id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, key: editVal, visible: false } : k));
    setEditingId(null);
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const groupedbyService = keys.reduce<Record<string, ApiKey[]>>((acc, k) => {
    if (!acc[k.service]) acc[k.service] = [];
    acc[k.service].push(k);
    return acc;
  }, {});

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">System Settings</li>
                <li className="breadcrumb-item active">API Keys</li>
              </ol>
            </div>
            <h4 className="page-title">API Keys</h4>
          </div>
        </div>
      </div>

      <div className="alert alert-warning py-2 mb-3">
        <i className="ri-lock-line me-1"></i>
        <strong>Security Notice:</strong> Never share API keys publicly. These keys are encrypted at rest. Changes take effect after server restart.
      </div>

      <div className="row g-3">
        {Object.entries(groupedbyService).map(([service, serviceKeys]) => (
          <div key={service} className="col-12">
            <div className="card mb-2">
              <div className="card-header">
                <h4 className="header-title mb-0">
                  <span className={`badge me-2 ${SERVICE_COLORS[service] ?? "bg-secondary-subtle text-secondary"}`}>
                    {service}
                  </span>
                </h4>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-centered mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-3" style={{ width: "30%" }}>Key Name</th>
                        <th>Value</th>
                        <th style={{ width: "120px" }} className="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceKeys.map((k) => (
                        <tr key={k.id}>
                          <td className="ps-3">
                            <span className="fw-semibold fs-14">{k.name}</span>
                          </td>
                          <td>
                            {editingId === k.id ? (
                              <div className="d-flex gap-2">
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-monospace"
                                  value={editVal}
                                  onChange={(e) => setEditVal(e.target.value)}
                                  autoFocus
                                />
                                <button className="btn btn-sm btn-primary flex-shrink-0" onClick={() => saveEdit(k.id)}>
                                  <i className="ri-check-line"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-secondary flex-shrink-0" onClick={() => setEditingId(null)}>
                                  <i className="ri-close-line"></i>
                                </button>
                              </div>
                            ) : (
                              <span className="font-monospace fs-13 text-muted">
                                {k.visible ? k.key : k.key.replace(/./g, "•").slice(0, 32) + (k.key.length > 32 ? "…" : "")}
                              </span>
                            )}
                          </td>
                          <td className="text-end pe-3">
                            <div className="d-flex gap-1 justify-content-end">
                              <button
                                className="btn btn-sm btn-soft-secondary"
                                title={k.visible ? "Hide" : "Show"}
                                onClick={() => toggleVisible(k.id)}
                              >
                                <i className={k.visible ? "ri-eye-off-line" : "ri-eye-line"}></i>
                              </button>
                              <button
                                className="btn btn-sm btn-soft-primary"
                                title="Copy"
                                onClick={() => copyKey(k.key, k.id)}
                              >
                                <i className={copied === k.id ? "ri-check-line" : "ri-file-copy-line"}></i>
                              </button>
                              <button
                                className="btn btn-sm btn-soft-warning"
                                title="Edit"
                                onClick={() => startEdit(k)}
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
