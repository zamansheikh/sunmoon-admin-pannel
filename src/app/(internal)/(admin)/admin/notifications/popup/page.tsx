"use client";

import { useState, useEffect, useRef } from "react";
import { getBannerDocs, createBanner, deleteBanner, BannerDoc } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const filenameFromUrl = (url: string): string => {
  try {
    const parts = url.split("/");
    const name = parts[parts.length - 1];
    return name.length > 35 ? name.slice(0, 35) + "…" : name;
  } catch {
    return "banner image";
  }
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PopupBannerPage() {
  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Form
  const [altText, setAltText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchBanners = async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const data = await getBannerDocs();
      setBanners(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load banners");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const filtered = banners.filter((banner) =>
    banner.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    banner.alt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const openModal = () => {
    setAltText("");
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) { setFormError("Please select an image"); return; }
    setFormLoading(true);
    setFormError("");
    try {
      await createBanner({ alt: altText || "banner", image: imageFile });
      closeModal();
      fetchBanners();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (banner: BannerDoc) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    setDeleteLoading(banner._id);
    try {
      await deleteBanner(banner._id);
      fetchBanners();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete banner");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Breadcrumb */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item">Notifications</li>
                <li className="breadcrumb-item active">Popup Banners</li>
              </ol>
            </div>
            <h4 className="page-title">Popup Banners</h4>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="row g-2 mb-3 align-items-center">
        <div className="col-12 col-md-5">
          <div className="input-group">
            <span className="input-group-text"><i className="ri-search-line"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search banners…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn btn-outline-secondary" onClick={() => setSearchQuery("")}>
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
        <div className="col-auto ms-auto d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={fetchBanners}
            disabled={isLoading}
            title="Refresh"
          >
            <i className={`ri-refresh-line${isLoading ? " spin-anim" : ""}`}></i>
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            <i className="ri-add-line me-1"></i>Add Banner
          </button>
        </div>
      </div>

      {/* Error */}
      {pageError && (
        <div className="alert alert-danger py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close float-end" onClick={() => setPageError("")} />
        </div>
      )}

      {/* Banner Grid */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-image-2-line me-2 text-primary"></i>
            Banners{" "}
            <span className="badge bg-secondary ms-1">{filtered.length}</span>
          </h4>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-image-2-line fs-1 d-block mb-2"></i>
              {searchQuery ? "No banners match your search" : "No banners yet"}
              {!searchQuery && (
                <div className="mt-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={openModal}>
                    <i className="ri-add-line me-1"></i>Add First Banner
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="row g-3">
              {filtered.map((banner) => (
                <div key={banner._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="card border mb-0 overflow-hidden position-relative">
                    {/* Banner image — contains all aspect ratios without cropping */}
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{ height: 200, overflow: "hidden" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={banner.url}
                        alt={banner.alt || `Banner`}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="card-body p-2 d-flex align-items-center justify-content-between gap-2">
                      <div className="flex-grow-1 overflow-hidden">
                        {banner.alt && (
                          <p className="fs-12 fw-medium mb-0 text-truncate" title={banner.alt}>
                            {banner.alt}
                          </p>
                        )}
                        <p className="fs-12 text-muted mb-0 text-truncate" title={banner.url}>
                          {filenameFromUrl(banner.url)}
                        </p>
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <a
                          href={banner.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-soft-primary"
                          title="Open"
                        >
                          <i className="ri-external-link-line"></i>
                        </a>
                        <button
                          className="btn btn-sm btn-soft-danger"
                          title="Delete"
                          onClick={() => handleDelete(banner)}
                          disabled={deleteLoading === banner._id}
                        >
                          {deleteLoading === banner._id ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <i className="ri-delete-bin-line"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Upload Modal ────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)", zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-add-line me-2 text-primary"></i>Add Banner
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      <i className="ri-error-warning-line me-1"></i>{formError}
                    </div>
                  )}

                  {/* Image Upload */}
                  <div className="mb-3">
                    <label className="form-label">
                      Banner Image <span className="text-danger">*</span>
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleImageChange}
                    />
                    <div
                      className="border rounded overflow-hidden d-flex align-items-center justify-content-center bg-light"
                      style={{ cursor: "pointer", minHeight: 160, maxHeight: 300, borderStyle: "dashed" }}
                      onClick={() => fileRef.current?.click()}
                    >
                      {imagePreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain", display: "block" }}
                        />
                      ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted py-4">
                          <i className="ri-upload-line fs-2 mb-1"></i>
                          <span className="fs-13">Click to upload image</span>
                        </div>
                      )}
                    </div>
                    {imageFile && (
                      <small className="text-muted">{imageFile.name}</small>
                    )}
                  </div>

                  {/* Alt / Description */}
                  <div className="mb-0">
                    <label className="form-label">Description (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter banner description"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? (
                      <><span className="spinner-border spinner-border-sm me-1" />Uploading…</>
                    ) : "Upload Banner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
