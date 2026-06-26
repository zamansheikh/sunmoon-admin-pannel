"use client";

import { useState, useEffect, useRef } from "react";
import {
  getGifts,
  getGiftCategories,
  createGift,
  updateGift,
  deleteGift,
  Gift,
} from "@/lib/api";
import SvgaPreviewModal, {
  useUploadPreview,
} from "@/components/common/SvgaPreviewModal";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AllGiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // Modal / form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Single "Coin" input. Backend still expects both `diamonds` and
  // `coinPrice` — we mirror the same value to both at submit time.
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    coinPrice: "",
  });
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [svgaFile, setSvgaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const previewRef = useRef<HTMLInputElement>(null);
  const svgaRef = useRef<HTMLInputElement>(null);

  // SVGA preview modal target. Null when closed.
  const [previewGift, setPreviewGift] = useState<Gift | null>(null);

  // Form-side preview (for the file currently selected in the upload form).
  const uploadPreview = useUploadPreview();

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const [giftsData, catsData] = await Promise.all([getGifts(), getGiftCategories()]);
      setGifts(giftsData);
      setCategories(catsData);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load gifts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Filter ─────────────────────────────────────────────────────────────────
  const filtered = gifts.filter((g) => {
    const matchCat = selectedCategory === "all" || g.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchQ = g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  // ─── Modal helpers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingGift(null);
    setFormData({ name: "", category: "", coinPrice: "" });
    setPreviewFile(null);
    setSvgaFile(null);
    setPreviewUrl("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (gift: Gift) => {
    setEditingGift(gift);
    // Pre-fill with the existing coin price — the form only edits one
    // value and we mirror it to both fields on save.
    setFormData({
      name:      gift.name,
      category:  gift.category,
      coinPrice: gift.coinPrice.toString(),
    });
    setPreviewFile(null);
    setSvgaFile(null);
    setPreviewUrl(gift.previewImage);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGift(null);
    setFormError("");
  };

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSvgaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSvgaFile(file);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) { setFormError("Gift name is required"); return; }
    if (!formData.category.trim()) { setFormError("Category is required"); return; }
    if (isNaN(Number(formData.coinPrice)) || !formData.coinPrice) { setFormError("Valid coin value required"); return; }
    if (!editingGift && !previewFile) { setFormError("Preview image is required"); return; }
    if (!editingGift && !svgaFile) { setFormError("SVGA animation file is required"); return; }

    setIsSubmitting(true);
    try {
      // Same coin value goes into both `diamonds` and `coinPrice` so
      // the backend (which still requires both) stays happy.
      const coin = Number(formData.coinPrice);
      if (editingGift) {
        await updateGift(editingGift._id, {
          name:         formData.name,
          category:     formData.category,
          diamonds:     coin,
          coinPrice:    coin,
          previewImage: previewFile ?? undefined,
          svgaImage:    svgaFile    ?? undefined,
        });
      } else {
        await createGift({
          name:         formData.name,
          category:     formData.category,
          diamonds:     coin,
          coinPrice:    coin,
          previewImage: previewFile!,
          svgaImage:    svgaFile!,
        });
      }
      await fetchAll();
      closeModal();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save gift");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (gift: Gift) => {
    if (!confirm(`Delete "${gift.name}"? This cannot be undone.`)) return;
    setIsDeleting(gift._id);
    try {
      await deleteGift(gift._id);
      setGifts((prev) => prev.filter((g) => g._id !== gift._id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete gift");
    } finally {
      setIsDeleting(null);
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
                <li className="breadcrumb-item">Gifts</li>
                <li className="breadcrumb-item active">All Gifts</li>
              </ol>
            </div>
            <h4 className="page-title">Gift Management</h4>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text"><i className="ri-search-line"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search gifts…"
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
        <div className="col-12 col-md-6">
          <div className="d-flex flex-wrap gap-1">
            <button
              className={`btn btn-sm ${selectedCategory === "all" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm text-capitalize ${selectedCategory === cat ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="col-12 col-md-2 text-end">
          <button className="btn btn-primary w-100 w-md-auto" onClick={openCreate}>
            <i className="ri-add-line me-1"></i>Add Gift
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

      {/* Gifts Grid */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-gift-line me-2 text-primary"></i>
            Gifts{" "}
            <span className="badge bg-secondary ms-1">{filtered.length}</span>
          </h4>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchAll} disabled={isLoading}>
            <i className={`ri-refresh-line${isLoading ? " spin-anim" : ""}`}></i>
          </button>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-gift-line fs-1 d-block mb-2"></i>
              No gifts found.
              <div className="mt-2">
                <button className="btn btn-sm btn-outline-primary" onClick={openCreate}>
                  <i className="ri-add-line me-1"></i>Create First Gift
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {filtered.map((gift) => (
                <div key={gift._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div className="card h-100 mb-0 border gift-card position-relative">
                    {/* Image */}
                    <div className="card-img-top p-2 bg-light d-flex align-items-center justify-content-center" style={{ height: 100 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={gift.previewImage}
                        alt={gift.name}
                        className="img-fluid"
                        style={{ maxHeight: 90, objectFit: "contain" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M20 7h-4a2 2 0 0 0-4 0H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="card-body p-2">
                      <p className="fw-medium fs-13 mb-0 text-truncate" title={gift.name}>{gift.name}</p>
                      <p className="text-muted fs-12 mb-1 text-capitalize">{gift.category}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-info-subtle text-info fs-11">
                          <i className="ri-gem-line me-1"></i>{gift.diamonds}
                        </span>
                        <span className="badge bg-warning-subtle text-warning fs-11">
                          <i className="ri-copper-coin-line me-1"></i>{gift.coinPrice}
                        </span>
                      </div>
                      {gift.sendCount !== undefined && (
                        <p className="text-muted fs-11 mt-1 mb-0">
                          Sent: {gift.sendCount}×
                        </p>
                      )}
                    </div>
                    {/* Hover actions */}
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center gap-2 gift-hover-overlay rounded"
                      style={{ background: "rgba(0,0,0,0.55)", opacity: 0, transition: "opacity .2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => setPreviewGift(gift)}
                        title="Preview SVGA"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openEdit(gift)}
                        title="Edit"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(gift)}
                        disabled={isDeleting === gift._id}
                        title="Delete"
                      >
                        {isDeleting === gift._id ? (
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

      {/* SVGA Preview Modal — for already-saved gifts (card hover) */}
      <SvgaPreviewModal
        open={previewGift !== null}
        title={previewGift ? `${previewGift.name} — Gift Preview` : ""}
        entries={
          previewGift
            ? [
                {
                  label: previewGift.name,
                  svgaUrl: previewGift.svgaImage || undefined,
                  previewUrl: previewGift.previewImage || undefined,
                },
              ]
            : []
        }
        onClose={() => setPreviewGift(null)}
      />

      {/* SVGA Preview Modal — for the file being uploaded in the form */}
      <SvgaPreviewModal {...uploadPreview.modalProps} />

      {/* ── Create / Edit Modal ─────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,.55)", zIndex: 1055, overflow: "hidden" }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{ maxHeight: "calc(100vh - 1rem)" }}
          >
            <div className="modal-content" style={{ maxHeight: "calc(100vh - 1rem)" }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`${editingGift ? "ri-edit-line" : "ri-add-line"} me-2 text-primary`}></i>
                  {editingGift ? "Edit Gift" : "Create New Gift"}
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              {/* Form is itself the scrollable flex column so the body
                  scrolls while header/footer stay pinned. */}
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  className="modal-body"
                  style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}
                >
                  {formError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      <i className="ri-error-warning-line me-1"></i>{formError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Gift Name <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      placeholder="Enter gift name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Category <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      list="gift-categories"
                      placeholder="e.g. love, fun, luxury"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="gift-categories">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Coin <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={formData.coinPrice}
                      onChange={(e) => setFormData({ ...formData, coinPrice: e.target.value })}
                    />
                    <small className="text-muted">
                      Used as the gift cost. Saved as both diamonds and coin price on the backend.
                    </small>
                  </div>

                  {/* Preview Image */}
                  <div className="mb-3">
                    <label className="form-label">
                      Preview Image {!editingGift && <span className="text-danger">*</span>}
                    </label>
                    <input
                      ref={previewRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handlePreviewChange}
                    />
                    <div
                      className="border border-dashed rounded p-3 text-center"
                      style={{ cursor: "pointer", borderStyle: "dashed" }}
                      onClick={() => previewRef.current?.click()}
                    >
                      {previewUrl ? (
                        <div className="d-flex align-items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={previewUrl} alt="preview" style={{ width: 56, height: 56, objectFit: "contain" }} className="rounded" />
                          <div className="text-start">
                            <p className="fs-13 mb-0">{previewFile?.name ?? "Current image"}</p>
                            <p className="fs-12 text-muted mb-0">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <i className="ri-image-line fs-2 text-muted d-block mb-1"></i>
                          <span className="fs-13 text-muted">Click to upload preview image</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* SVGA Animation */}
                  <div className="mb-0">
                    <label className="form-label">
                      SVGA Animation {!editingGift && <span className="text-danger">*</span>}
                    </label>
                    <input
                      ref={svgaRef}
                      type="file"
                      accept=".svga,.gif"
                      className="d-none"
                      onChange={handleSvgaChange}
                    />
                    <div
                      className="border border-dashed rounded p-3 text-center"
                      style={{ cursor: "pointer", borderStyle: "dashed" }}
                      onClick={() => svgaRef.current?.click()}
                    >
                      {svgaFile ? (
                        <div className="d-flex align-items-center gap-3">
                          <i className="ri-file-gif-line fs-2 text-primary"></i>
                          <div className="text-start">
                            <p className="fs-13 mb-0">{svgaFile.name}</p>
                            <p className="fs-12 text-muted mb-0">Click to change</p>
                          </div>
                        </div>
                      ) : editingGift ? (
                        <div className="d-flex align-items-center gap-3">
                          <i className="ri-file-gif-line fs-2 text-success"></i>
                          <div className="text-start">
                            <p className="fs-13 mb-0">Animation uploaded</p>
                            <p className="fs-12 text-muted mb-0">Click to replace</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <i className="ri-upload-line fs-2 text-muted d-block mb-1"></i>
                          <span className="fs-13 text-muted">Click to upload SVGA / GIF animation</span>
                        </>
                      )}
                    </div>
                    {/* Preview the SVGA being uploaded. Falls back to the
                        existing animation when editing without re-selecting. */}
                    {(svgaFile || (editingGift && editingGift.svgaImage)) && (
                      <div className="text-end mt-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            uploadPreview.open({
                              title: `${formData.name || editingGift?.name || "Gift"} — Preview`,
                              items: [
                                {
                                  label: formData.name || "svga",
                                  svgaFile,
                                  previewFile,
                                  svgaUrl: !svgaFile ? editingGift?.svgaImage : undefined,
                                  previewUrl: !previewFile ? editingGift?.previewImage : undefined,
                                },
                              ],
                            })
                          }
                        >
                          <i className="ri-eye-line me-1" />
                          Preview SVGA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-1" />{editingGift ? "Saving…" : "Creating…"}</>
                    ) : editingGift ? "Update Gift" : "Create Gift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .gift-card:hover .gift-hover-overlay { opacity: 1 !important; }
      `}</style>
    </>
  );
}
