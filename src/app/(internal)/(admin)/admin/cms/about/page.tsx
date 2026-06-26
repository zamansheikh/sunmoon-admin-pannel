"use client";

import { useState } from "react";
import { PROJECT_NAME, SUPPORT_EMAIL, WEBSITE_DOMAIN } from "@/lib/constants";

export default function AboutUsPage() {
  const [content, setContent] = useState(
    `About ${PROJECT_NAME}\n\n${PROJECT_NAME} is a live audio streaming social platform that connects people through real-time voice conversations, games, and interactive experiences.\n\nOur Mission\nTo create a safe, engaging, and entertaining platform where users can meet new people, host live audio rooms, and build communities around shared interests.\n\nWhat We Offer\n- Live Audio Rooms: Host or join rooms with up to hundreds of participants\n- Gifting System: Send and receive virtual gifts during live streams\n- Games & PK Battles: Compete with friends and other users\n- Ranking System: Earn recognition through daily, weekly, and seasonal leaderboards\n- SVIP & Noble System: Unlock exclusive privileges and badges\n\nOur Values\nSafety, inclusivity, and genuine connection are at the heart of everything we do. We invest heavily in moderation tools and community guidelines to ensure ${PROJECT_NAME} remains a positive space.\n\nContact Us\nEmail: ${SUPPORT_EMAIL}\nWebsite: ${WEBSITE_DOMAIN}`
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
                <li className="breadcrumb-item active">About Us</li>
              </ol>
            </div>
            <h4 className="page-title">About Us</h4>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-information-line me-2 text-primary"></i>About Us Content
              </h4>
              <span className="badge bg-light text-muted fs-12">Plain Text / Markdown</span>
            </div>
            <div className="card-body">
              {saved && (
                <div className="alert alert-success py-2 mb-3">
                  <i className="ri-check-line me-1"></i>About Us content saved successfully.
                </div>
              )}
              <textarea
                className="form-control"
                rows={22}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter about us content..."
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
