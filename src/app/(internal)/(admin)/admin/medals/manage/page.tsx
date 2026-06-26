"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMedals,
  createMedal,
  updateMedal,
  deleteMedal,
  runRetroactiveMedalAward,
  Medal,
  RetroactiveAwardResult,
} from "@/lib/api";

type Flash = { type: "success" | "danger"; text: string } | null;

const emptyForm = { name: "", level: "", description: "" };

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
};

export default function MedalsPage() {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Retroactive award
  const [retroOpen, setRetroOpen] = useState(false);
  const [retroLoading, setRetroLoading] = useState(false);
  const [retroResult, setRetroResult] = useState<RetroactiveAwardResult | null>(null);
  const [retroError, setRetroError] = useState("");

  const loadMedals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMedals();
      setMedals([...data].sort((a, b) => a.level - b.level));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load medals" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMedals(); }, [loadMedals]);

  const resetIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditId(null);
    setEditingIcon(null);
    setForm({ ...emptyForm });
    resetIcon();
    setModalError("");
    setModalOpen(true);
  };
  const openEdit = (m: Medal) => {
    setEditId(m._id);
    setEditingIcon(m.icon);
    setForm({ name: m.name, level: String(m.level), description: m.description ?? "" });
    resetIcon();
    setModalError("");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setSaving(false); };

  const onPickIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setIconFile(f);
    setIconPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const level = Number(form.level);
    const description = form.description.trim();

    if (!name) return setModalError("Name is required.");
    if (!Number.isFinite(level) || level < 0) return setModalError("Level must be a non-negative number.");
    if (!editId && !iconFile) return setModalError("An icon image is required.");

    // Guard against assigning a level already used by another medal (backend
    // also enforces this with a 409, but catching it early is friendlier).
    const clash = medals.find((m) => m.level === level && m._id !== editId);
    if (clash) return setModalError(`Level ${level} is already used by "${clash.name}".`);

    setSaving(true);
    setModalError("");
    try {
      if (editId) {
        await updateMedal(editId, { name, level, description, iconFile });
        setFlash({ type: "success", text: "Medal updated." });
      } else {
        await createMedal({ name, level, iconFile: iconFile as File, description });
        setFlash({ type: "success", text: "Medal created." });
      }
      closeModal();
      loadMedals();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to save medal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Medal) => {
    if (!confirm(`Delete "${m.name}" (level ${m.level})? This also removes it from every user who earned it.`)) return;
    setDeletingId(m._id);
    try {
      await deleteMedal(m._id);
      setMedals((prev) => prev.filter((x) => x._id !== m._id));
      setFlash({ type: "success", text: "Medal deleted." });
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to delete medal" });
    } finally {
      setDeletingId(null);
    }
  };

  const openRetro = () => {
    setRetroResult(null);
    setRetroError("");
    setRetroOpen(true);
  };
  const handleRetro = async () => {
    setRetroLoading(true);
    setRetroError("");
    try {
      const result = await runRetroactiveMedalAward();
      setRetroResult(result);
    } catch (e: unknown) {
      setRetroError(e instanceof Error ? e.message : "Failed to run retroactive award");
    } finally {
      setRetroLoading(false);
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
                <li className="breadcrumb-item">XP &amp; Levels</li>
                <li className="breadcrumb-item active">Medals</li>
              </ol>
            </div>
            <h4 className="page-title">Medals</h4>
          </div>
        </div>
      </div>

      {flash && (
        <div className={`alert alert-${flash.type} d-flex align-items-center py-2 mb-3`}>
          <i className={`me-2 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
          {flash.text}
          <button className="btn-close ms-auto" onClick={() => setFlash(null)} />
        </div>
      )}

      <div className="alert alert-info py-2 fs-13 mb-3">
        <i className="ri-information-line me-1"></i>
        Each medal is tied to a <strong>unique level</strong> and is awarded automatically when
        a user reaches it. Created a medal after users already passed its level? Use
        <strong> Retroactive Award</strong> to grant it to everyone who qualifies.
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-medal-line me-2 text-warning"></i>
            Medals <span className="badge bg-secondary ms-1">{medals.length}</span>
          </h4>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" onClick={loadMedals} disabled={loading}>
              <i className={`ri-refresh-line ${loading ? "spin-anim" : ""}`}></i>
            </button>
            <button className="btn btn-sm btn-soft-primary" onClick={openRetro} disabled={medals.length === 0}>
              <i className="ri-award-line me-1"></i>Retroactive Award
            </button>
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="ri-add-line me-1"></i>Add Medal
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : medals.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-medal-line fs-1 d-block mb-2"></i>
              No medals yet. Add one to reward users at a given level.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>Icon</th>
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
                        {m.icon ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={m.icon}
                            alt={m.name}
                            style={{ width: 40, height: 40, objectFit: "contain" }}
                          />
                        ) : (
                          <i className="ri-medal-line fs-3 text-muted"></i>
                        )}
                      </td>
                      <td className="fw-medium">{m.name}</td>
                      <td><span className="badge bg-light text-dark">Level {m.level}</span></td>
                      <td className="text-muted fs-13">{m.description || "—"}</td>
                      <td className="text-muted fs-13">{formatDate(m.createdAt)}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button className="btn btn-sm btn-soft-primary" title="Edit" onClick={() => openEdit(m)}>
                            <i className="ri-edit-line"></i>
                          </button>
                          <button className="btn btn-sm btn-soft-danger" title="Delete" onClick={() => handleDelete(m)} disabled={deletingId === m._id}>
                            {deletingId === m._id ? <span className="spinner-border spinner-border-sm" /> : <i className="ri-delete-bin-line"></i>}
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

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-medal-line me-2 text-warning"></i>
                  {editId ? "Edit Medal" : "Add Medal"}
                </h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{modalError}
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-8">
                    <label className="form-label fs-13">Name</label>
                    <input type="text" className="form-control" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bronze Star" />
                  </div>
                  <div className="col-4">
                    <label className="form-label fs-13">Level</label>
                    <input type="number" className="form-control" value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. 5" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fs-13">Description <span className="text-muted">(optional)</span></label>
                    <input type="text" className="form-control" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Awarded for reaching level 5" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fs-13">
                      Icon {editId ? <span className="text-muted">(leave empty to keep current)</span> : null}
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="border rounded d-flex align-items-center justify-content-center bg-light"
                        style={{ width: 56, height: 56, flexShrink: 0 }}
                      >
                        {iconPreview || editingIcon ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={iconPreview ?? editingIcon ?? ""}
                            alt="icon"
                            style={{ width: 48, height: 48, objectFit: "contain" }}
                          />
                        ) : (
                          <i className="ri-image-line text-muted fs-4"></i>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={onPickIcon}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : <><i className="ri-save-line me-1"></i>{editId ? "Save Changes" : "Create Medal"}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retroactive award modal */}
      {retroOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-award-line me-2 text-primary"></i>
                  Retroactive Medal Award
                </h5>
                <button className="btn-close" onClick={() => setRetroOpen(false)} />
              </div>
              <div className="modal-body">
                {retroError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{retroError}
                  </div>
                )}
                {retroResult ? (
                  <>
                    <div className="alert alert-success py-2 fs-13">
                      <i className="ri-check-line me-1"></i>
                      Awarded <strong>{retroResult.totalAwarded.toLocaleString()}</strong> medal(s) in total.
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr><th>Medal</th><th>Level</th><th className="text-end">Awarded</th></tr>
                        </thead>
                        <tbody>
                          {retroResult.medalsAwarded.map((m, i) => (
                            <tr key={i}>
                              <td>{m.medalName}</td>
                              <td><span className="badge bg-light text-dark">Level {m.level}</span></td>
                              <td className="text-end fw-medium">{m.count.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-muted mb-0">
                    This grants every medal to all existing users who already meet its level
                    requirement and don&apos;t have it yet. It is <strong>safe to re-run</strong> —
                    users never receive duplicate medals.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setRetroOpen(false)}>
                  {retroResult ? "Close" : "Cancel"}
                </button>
                {!retroResult && (
                  <button className="btn btn-primary" onClick={handleRetro} disabled={retroLoading}>
                    {retroLoading ? <><span className="spinner-border spinner-border-sm me-1" />Awarding…</> : <><i className="ri-award-line me-1"></i>Run Award</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
