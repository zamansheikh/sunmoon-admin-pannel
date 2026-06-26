"use client";

import { useState } from "react";

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState(
    `Privacy Policy\n\nLast updated: ${new Date().toLocaleDateString()}\n\n1. Introduction\nWelcome to AddaLive ("Company", "we", "our", "us"). By using our services you agree to be bound by this Privacy Policy.\n\n2. Information We Collect\nWe collect information you provide directly to us, such as when you create an account, update your profile, or contact us for support.\n\n3. How We Use Your Information\nWe use the information we collect to operate, maintain, and improve our services, process transactions, and communicate with you.\n\n4. Information Sharing\nWe do not share your personal information with third parties except as described in this Privacy Policy.\n\n5. Data Security\nWe take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.\n\n6. Contact Us\nIf you have any questions about this Privacy Policy, please contact us.`
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // TODO: Wire up to backend CMS API
      await new Promise((r) => setTimeout(r, 800));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">CMS</li>
                <li className="breadcrumb-item active">Privacy Policy</li>
              </ol>
            </div>
            <h4 className="page-title">Privacy Policy</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-shield-check-line me-2 text-primary"></i>Privacy Policy Content
              </h4>
              <span className="badge bg-light text-muted fs-12">Plain Text / Markdown</span>
            </div>
            <div className="card-body">
              {saved && (
                <div className="alert alert-success py-2 mb-3">
                  <i className="ri-check-line me-1"></i>Privacy policy saved successfully.
                </div>
              )}
              <textarea
                className="form-control"
                rows={22}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter privacy policy content..."
                style={{ fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
              />
              <div className="mt-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="ri-information-line me-1"></i>
                  {content.length.toLocaleString()} characters
                </small>
                <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  ) : (
                    <><i className="ri-save-line me-1"></i>Save Changes</>
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
