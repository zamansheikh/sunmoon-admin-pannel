"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryItem = { _id: string; url: string; alt: string };

export interface ImageUploadGalleryProps {
  pageTitle: string;
  crumbLabel: string;
  description: string;
  emptyText: string;
  fetchItems: () => Promise<GalleryItem[]>;
  uploadItem: (payload: { alt: string; image: File }) => Promise<unknown>;
  deleteItem: (id: string) => Promise<void>;
}

export default function ImageUploadGallery({
  pageTitle,
  crumbLabel,
  description,
  emptyText,
  fetchItems,
  uploadItem,
  deleteItem,
}: ImageUploadGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setPageError("");
    try {
      setItems(await fetchItems());
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setAlt("");
    setFile(null);
    setPreview("");
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    if (!file) { setUploadError("Image is required"); return; }
    if (!alt.trim()) { setUploadError("Alt / label is required"); return; }
    setIsUploading(true);
    try {
      await uploadItem({ alt: alt.trim(), image: file });
      reset();
      await fetchAll();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Delete "${item.alt}"?`)) return;
    setDeletingId(item._id);
    try {
      await deleteItem(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
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
                <li className="breadcrumb-item">Banners</li>
                <li className="breadcrumb-item active">{crumbLabel}</li>
              </ol>
            </div>
            <h4 className="page-title">{pageTitle}</h4>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}

      <div className="row g-3">
        {/* Upload card */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 mb-0">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-upload-2-line me-2 text-primary"></i>
                Upload New
              </h4>
            </div>
            <div className="card-body">
              <p className="text-muted fs-13">{description}</p>

              {uploadError && (
                <div className="alert alert-danger py-2 fs-13 mb-3">
                  <i className="ri-error-warning-line me-1"></i>{uploadError}
                </div>
              )}

              <form onSubmit={handleUpload}>
                <div className="mb-3">
                  <label className="form-label">Label / Alt Text <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. New Year Promo"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Image <span className="text-danger">*</span></label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={onPick}
                  />
                  <div
                    className="border border-dashed rounded p-3 text-center"
                    style={{ cursor: "pointer", borderStyle: "dashed" }}
                    onClick={() => fileRef.current?.click()}
                  >
                    {preview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="preview" style={{ maxHeight: 160, maxWidth: "100%" }} className="rounded mb-2" />
                        <div className="fs-12 text-muted">{file?.name}</div>
                      </>
                    ) : (
                      <>
                        <i className="ri-image-add-line fs-2 text-muted d-block mb-1"></i>
                        <span className="fs-13 text-muted">Click to choose an image</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-fill" disabled={isUploading}>
                    {isUploading ? (
                      <><span className="spinner-border spinner-border-sm me-1" />Uploading…</>
                    ) : (
                      <><i className="ri-upload-line me-1"></i>Upload</>
                    )}
                  </button>
                  {(file || alt) && (
                    <button type="button" className="btn btn-outline-secondary" onClick={reset} disabled={isUploading}>
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="col-12 col-lg-8">
          <div className="card h-100 mb-0">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-gallery-line me-2 text-primary"></i>
                Uploaded{" "}
                <span className="badge bg-secondary ms-1">{items.length}</span>
              </h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchAll} disabled={loading}>
                <i className={`ri-refresh-line${loading ? " spin-anim" : ""}`}></i>
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ri-image-line fs-1 d-block mb-2"></i>
                  {emptyText}
                </div>
              ) : (
                <div className="row g-3">
                  {items.map((item) => (
                    <div key={item._id} className="col-6 col-md-4">
                      <div className="card border h-100 mb-0 position-relative">
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 140 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.alt}
                            style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div className="card-body p-2 d-flex align-items-center justify-content-between">
                          <div className="text-truncate fs-13" title={item.alt}>{item.alt || "—"}</div>
                          <button
                            className="btn btn-sm btn-soft-danger"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item._id}
                            title="Delete"
                          >
                            {deletingId === item._id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
