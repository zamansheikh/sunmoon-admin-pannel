"use client";

import { useEffect, useRef, useState } from "react";
import { getMedals, createMedal, updateMedal, deleteMedal, Medal } from "@/lib/api";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

export default function MedalsPage() {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingMedal, setEditingMedal] = useState<Medal | null>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const fetchMedals = async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await getMedals();
      setMedals(data);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load medals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedals();
  }, []);

  const openCreate = () => {
    setEditingMedal(null);
    setName("");
    setLevel("");
    setDescription("");
    setIconFile(null);
    setIconPreview("");
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMedal(null);
    setFormError("");
  };

  const openEdit = (medal: Medal) => {
    setEditingMedal(medal);
    setName(medal.name);
    setLevel(String(medal.level));
    setDescription(medal.description ?? "");
    setIconFile(null);
    setIconPreview(medal.icon);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (medal: Medal) => {
    if (!confirm(`Delete "${medal.name}"? This cannot be undone.`)) return;
    try {
      await deleteMedal(medal._id);
      setMedals((prev) => prev.filter((m) => m._id !== medal._id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete medal");
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) { setFormError("Medal name is required"); return; }
    if (!level.trim() || isNaN(Number(level)) || Number(level) < 1) { setFormError("Valid level is required"); return; }
    if (!editingMedal && !iconFile) { setFormError("Medal icon is required"); return; }

    setIsSubmitting(true);
    try {
      if (editingMedal) {
        await updateMedal(editingMedal._id, {
          name: name.trim(),
          level: Number(level),
          iconFile: iconFile || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await createMedal({
          name: name.trim(),
          level: Number(level),
          iconFile: iconFile!,
          description: description.trim() || undefined,
        });
      }
      await fetchMedals();
      closeModal();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save medal");
    } finally {
      setIsSubmitting(false);
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
                <li className="breadcrumb-item">Users</li>
                <li className="breadcrumb-item active">Medals</li>
              </ol>
            </div>
            <h4 className="page-title">Medals</h4>
          </div>
        </div>
      </div>

      {/* Error */}
      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>
          {pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}

      {/* Medals Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-medal-line me-2 text-primary"></i>
            Medals{" "}
            <span className="badge bg-secondary ms-1">{medals.length}</span>
          </h4>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={fetchMedals}
              disabled={loading}
            >
              <i className={`ri-refresh-line me-1 ${loading ? "spin-anim" : ""}`}></i>
              Refresh
            </button>
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="ri-add-line me-1"></i>Add Medal
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : medals.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-medal-line fs-1 d-block mb-2"></i>
              No medals yet
              <div className="mt-2">
                <button className="btn btn-sm btn-outline-primary" onClick={openCreate}>
                  <i className="ri-add-line me-1"></i>Create First Medal
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medals.map((m) => (
                    <tr key={m._id}>
                      <td>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.icon}
                          alt={m.name}
                          className="rounded"
                          style={{ width: 40, height: 40, objectFit: "contain" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/%3E%3C/svg%3E";
                          }}
                        />
                      </td>
                      <td className="fw-medium">{m.name}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info">Lv. {m.level}</span>
                      </td>
                      <td className="text-muted fs-13">{m.description || "—"}</td>
                      <td className="fs-13 text-muted">{formatDate(m.createdAt)}</td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <button
                            className="btn btn-sm btn-soft-primary"
                            title="Edit medal"
                            onClick={() => openEdit(m)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-soft-danger"
                            title="Delete medal"
                            onClick={() => handleDelete(m)}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Medal Modal */}
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
                  <i className={`${editingMedal ? "ri-edit-line" : "ri-add-line"} me-2 text-primary`}></i>
                  {editingMedal ? "Edit Medal" : "Create New Medal"}
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
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
                    <label className="form-label">
                      Medal Name <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Bronze Star"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Level <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 5"
                      min="1"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    />
                    <small className="text-muted">
                      The user level required to earn this medal.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Icon {!editingMedal && <span className="text-danger">*</span>}
                    </label>
                    <input
                      ref={iconRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleIconChange}
                    />
                    <div
                      className="border border-dashed rounded p-3 text-center"
                      style={{
                        cursor: "pointer",
                        borderStyle: "dashed",
                        borderColor: isDragOver ? "#4f8ef7" : undefined,
                        background: isDragOver ? "rgba(79,142,247,.06)" : undefined,
                      }}
                      onClick={() => iconRef.current?.click()}
                      onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                    >
                      {iconPreview ? (
                        <div className="d-flex align-items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={iconPreview}
                            alt="icon preview"
                            style={{ width: 56, height: 56, objectFit: "contain" }}
                            className="rounded"
                          />
                          <div className="text-start">
                            <p className="fs-13 mb-0">{iconFile?.name ?? "Current icon"}</p>
                            <p className="fs-12 text-muted mb-0">Click or drop to change</p>
                          </div>
                        </div>
                      ) : isDragOver ? (
                        <>
                          <i className="ri-upload-cloud-line fs-2 text-primary d-block mb-1"></i>
                          <span className="fs-13 text-primary fw-medium">Drop image here</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-image-line fs-2 text-muted d-block mb-1"></i>
                          <span className="fs-13 text-muted">Click or drag to upload medal icon</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mb-0">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Optional description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        {editingMedal ? "Saving…" : "Creating…"}
                      </>
                    ) : editingMedal ? "Save Changes" : "Create Medal"}
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
