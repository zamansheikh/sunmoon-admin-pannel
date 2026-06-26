"use client";
import { PROJECT_NAME } from "@/lib/constants";

import { useEffect, useState } from "react";
import {
  getRoomLevelCriteria,
  upsertRoomLevelCriteria,
  deleteRoomLevelCriteria,
  RoomLevelCriteria,
} from "@/lib/api";

type FormState = Record<keyof RoomLevelCriteria, string>;

const FIELDS: { key: keyof RoomLevelCriteria; label: string; hint: string }[] = [
  { key: "level",            label: "Level",             hint: "Tier number (unique)" },
  { key: "roomVisitor",      label: "Room Visitors",     hint: "Visitors required" },
  { key: "roomTransactions", label: "Room Transactions", hint: "Coins received required" },
  { key: "totalRewardCoin",  label: "Total Reward Coin", hint: "Reward pool for the tier" },
  { key: "ownerCoin",        label: "Owner Coin",        hint: "Bonus to room owner" },
  { key: "partnerCoin",      label: "Partner Coin",      hint: "Bonus per partner" },
  { key: "numberOfPartners", label: "No. of Partners",   hint: "Partners rewarded" },
];

const emptyForm = (): FormState => ({
  level: "", roomVisitor: "", roomTransactions: "", totalRewardCoin: "",
  ownerCoin: "", partnerCoin: "", numberOfPartners: "",
});

const toForm = (c: RoomLevelCriteria): FormState => ({
  level: String(c.level),
  roomVisitor: String(c.roomVisitor),
  roomTransactions: String(c.roomTransactions),
  totalRewardCoin: String(c.totalRewardCoin),
  ownerCoin: String(c.ownerCoin),
  partnerCoin: String(c.partnerCoin),
  numberOfPartners: String(c.numberOfPartners),
});

export default function RoomSupportPage() {
  const [levels, setLevels] = useState<RoomLevelCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state (add or edit a level)
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await getRoomLevelCriteria();
      setLevels([...data].sort((a, b) => a.level - b.level));
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to load level criteria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(emptyForm());
    setIsEdit(false);
    setModalError("");
    setModalOpen(true);
  };
  const openEdit = (c: RoomLevelCriteria) => {
    setForm(toForm(c));
    setIsEdit(true);
    setModalError("");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setSaving(false); };

  const handleSave = async () => {
    setSaving(true);
    setModalError("");
    try {
      const nums = {} as RoomLevelCriteria;
      for (const f of FIELDS) {
        const v = Number(form[f.key]);
        if (form[f.key] === "" || Number.isNaN(v)) {
          throw new Error(`${f.label} must be a number.`);
        }
        nums[f.key] = v;
      }
      await upsertRoomLevelCriteria(nums);
      closeModal();
      setSuccess(`Level ${nums.level} saved.`);
      load();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to save level");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (level: number) => {
    if (!confirm(`Delete level ${level} configuration?`)) return;
    setDeleting(level);
    try {
      await deleteRoomLevelCriteria(level);
      setLevels((prev) => prev.filter((l) => l.level !== level));
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Failed to delete level");
    } finally {
      setDeleting(null);
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
                <li className="breadcrumb-item">Rooms</li>
                <li className="breadcrumb-item active">Room Support</li>
              </ol>
            </div>
            <h4 className="page-title">Room Support</h4>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
          <i className="ri-error-warning-line me-2"></i>{pageError}
          <button className="btn-close ms-auto" onClick={() => setPageError("")} />
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex align-items-center py-2 mb-3">
          <i className="ri-check-line me-2"></i>{success}
          <button className="btn-close ms-auto" onClick={() => setSuccess("")} />
        </div>
      )}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-hand-coin-line me-2 text-primary"></i>
            Support Levels &amp; Bonuses{" "}
            <span className="badge bg-secondary ms-1">{levels.length}</span>
          </h4>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
              <i className={`ri-refresh-line me-1 ${loading ? "spin-anim" : ""}`}></i>Refresh
            </button>
            <button className="btn btn-sm btn-primary" onClick={openAdd}>
              <i className="ri-add-line me-1"></i>Add Level
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : levels.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ri-hand-coin-line fs-1 d-block mb-2"></i>
              No support levels configured yet
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-nowrap mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Level</th>
                    <th>Visitors</th>
                    <th>Transactions</th>
                    <th>Total Reward</th>
                    <th>Owner Coin</th>
                    <th>Partner Coin</th>
                    <th>Partners</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((c) => (
                    <tr key={c.level}>
                      <td><span className="badge bg-primary">LV {c.level}</span></td>
                      <td>{c.roomVisitor.toLocaleString()}</td>
                      <td>{c.roomTransactions.toLocaleString()}</td>
                      <td className="text-warning-emphasis fw-medium">{c.totalRewardCoin.toLocaleString()}</td>
                      <td>{c.ownerCoin.toLocaleString()}</td>
                      <td>{c.partnerCoin.toLocaleString()}</td>
                      <td>{c.numberOfPartners}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button className="btn btn-sm btn-soft-primary" title="Edit" onClick={() => openEdit(c)}>
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-soft-danger"
                            title="Delete"
                            onClick={() => handleDelete(c.level)}
                            disabled={deleting === c.level}
                          >
                            {deleting === c.level
                              ? <span className="spinner-border spinner-border-sm" />
                              : <i className="ri-delete-bin-line"></i>}
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

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-hand-coin-line me-2 text-primary"></i>
                  {isEdit ? `Edit Level ${form.level}` : "Add Support Level"}
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
                  {FIELDS.map((f) => (
                    <div className="col-12 col-md-6" key={f.key}>
                      <label className="form-label fs-13">{f.label}</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={f.hint}
                        value={form[f.key]}
                        // Level is the unique key — lock it when editing.
                        disabled={isEdit && f.key === "level"}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                      <div className="form-text fs-12">{f.hint}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                    : <><i className="ri-save-line me-1"></i>Save Level</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
