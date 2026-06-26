"use client";

import { useState, useEffect, useRef } from "react";
import { getPosterDocs, createPoster, deletePoster, PosterDoc } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const filenameFromUrl = (url: string): string => {
  try {
    const parts = url.split("/");
    const name = parts[parts.length - 1];
    return name.length > 35 ? name.slice(0, 35) + "…" : name;
  } catch {
    return "poster image";
  }
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnnouncementBarPage() {
  const [posters, setPosters] = useState<PosterDoc[]>([]);
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
  const fetchPosters = async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const data = await getPosterDocs();
      setPosters(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load posters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPosters(); }, []);

  const filtered = posters.filter((poster) =>
    poster.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poster.alt.toLowerCase().includes(searchQuery.toLowerCase())
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
      await createPoster({ alt: altText || "poster", image: imageFile });
      closeModal();
      fetchPosters();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to upload poster");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (poster: PosterDoc) => {
    if (!confirm("Delete this poster? This cannot be undone.")) return;
    setDeleteLoading(poster._id);
    try {
      await deletePoster(poster._id);
      fetchPosters();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete poster");
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
                <li className="breadcrumb-item active">Announcement Bar (Posters)</li>
              </ol>
            </div>
            <h4 className="page-title">Announcement Posters</h4>
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
              placeholder="Search posters…"
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
            onClick={fetchPosters}
            disabled={isLoading}
            title="Refresh"
          >
            <i className={`ri-refresh-line${isLoading ? " spin-anim" : ""}`}></i>
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            <i className="ri-add-line me-1"></i>Add Poster
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

      {/* Poster Grid */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-file-image-line me-2 text-primary"></i>
            Posters{" "}
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
              <i className="ri-file-image-line fs-1 d-block mb-2"></i>
              {searchQuery ? "No posters match your search" : "No posters yet"}
              {!searchQuery && (
                <div className="mt-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={openModal}>
                    <i className="ri-add-line me-1"></i>Add First Poster
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="row g-3">
              {filtered.map((poster) => (
                <div key={poster._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                  <div className="card border mb-0 overflow-hidden">
                    {/* Poster image – contains all aspect ratios */}
                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 200, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={poster.url}
                        alt={poster.alt || `Poster`}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="card-body p-2 d-flex align-items-center justify-content-between gap-2">
                      <div className="flex-grow-1 overflow-hidden">
                        {poster.alt && (
                          <p className="fs-12 fw-medium mb-0 text-truncate" title={poster.alt}>
                            {poster.alt}
                          </p>
                        )}
                        <p className="fs-12 text-muted mb-0 text-truncate" title={poster.url}>
                          {filenameFromUrl(poster.url)}
                        </p>
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <a
                          href={poster.url}
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
                          onClick={() => handleDelete(poster)}
                          disabled={deleteLoading === poster._id}
                        >
                          {deleteLoading === poster._id ? (
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
                  <i className="ri-add-line me-2 text-primary"></i>Add Poster
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
                      Poster Image <span className="text-danger">*</span>
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
                      placeholder="Enter poster description"
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
                    ) : "Upload Poster"}
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
