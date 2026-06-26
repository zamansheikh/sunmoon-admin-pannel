"use client";

import { useState } from "react";
import { PROJECT_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export default function TermsConditionsPage() {
  const [content, setContent] = useState(
    `Terms & Conditions\n\nLast updated: ${new Date().toLocaleDateString()}\n\n1. Acceptance of Terms\nBy accessing or using ${PROJECT_NAME}, you agree to be bound by these Terms and Conditions. If you do not agree to all these terms, you may not use our services.\n\n2. Use of Service\nYou must be at least 18 years old to use ${PROJECT_NAME}. You are responsible for maintaining the confidentiality of your account credentials.\n\n3. User Conduct\nYou agree not to use the service to: (a) upload unlawful content; (b) harass or harm other users; (c) impersonate any person; (d) violate any applicable laws or regulations.\n\n4. Virtual Currency\n${PROJECT_NAME} uses virtual coins that have no real-world monetary value and cannot be exchanged for cash, except as described in our reward program.\n\n5. Content Ownership\nYou retain ownership of content you create. By posting content, you grant ${PROJECT_NAME} a non-exclusive license to use, display, and distribute your content.\n\n6. Termination\nWe reserve the right to terminate or suspend accounts that violate these Terms at our sole discretion.\n\n7. Limitation of Liability\n${PROJECT_NAME} is not liable for any indirect, incidental, or consequential damages arising from your use of the service.\n\n8. Contact\nFor questions about these Terms, contact us at ${SUPPORT_EMAIL}.`
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await new Promise((r) => setTimeout(r, 800));
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
                <li className="breadcrumb-item">CMS</li>
                <li className="breadcrumb-item active">Terms & Conditions</li>
              </ol>
            </div>
            <h4 className="page-title">Terms & Conditions</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-file-text-line me-2 text-primary"></i>Terms & Conditions Content
              </h4>
              <span className="badge bg-light text-muted fs-12">Plain Text / Markdown</span>
            </div>
            <div className="card-body">
              {saved && (
                <div className="alert alert-success py-2 mb-3">
                  <i className="ri-check-line me-1"></i>Terms & Conditions saved successfully.
                </div>
              )}
              <textarea
                className="form-control"
                rows={22}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter terms and conditions..."
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
