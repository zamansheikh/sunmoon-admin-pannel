"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getExchangeOptions,
  createExchangeOption,
  updateExchangeOption,
  deleteExchangeOption,
  getExchangeHistory,
  ExchangeOption,
  ExchangeTransaction,
} from "@/lib/api";

type Tab = "packages" | "history";
type Flash = { type: "success" | "danger"; text: string } | null;

// User spends diamonds → receives coins (+ bonus coins).
const emptyForm = {
  diamondsRequired: "",
  coinsAwarded: "",
  bonusCoins: "0",
  displayOrder: "0",
  isActive: true,
};

const fmt = (n?: number) => (n ?? 0).toLocaleString();
const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

export default function CoinExchangePage() {
  const [tab, setTab] = useState<Tab>("packages");

  const [options, setOptions] = useState<ExchangeOption[]>([]);
  const [history, setHistory] = useState<ExchangeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExchangeOptions();
      setOptions([...data].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load packages" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(await getExchangeHistory());
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load history" });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { if (tab === "history" && history.length === 0) loadHistory(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, displayOrder: String(options.length) });
    setModalError("");
    setModalOpen(true);
  };
  const openEdit = (o: ExchangeOption) => {
    setEditId(o._id);
    setForm({
      diamondsRequired: String(o.diamondsRequired),
      coinsAwarded: String(o.coinsAwarded),
      bonusCoins: String(o.bonusCoins ?? 0),
      displayOrder: String(o.displayOrder ?? 0),
      isActive: o.isActive,
    });
    setModalError("");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setSaving(false); };

  const handleSave = async () => {
    const diamondsRequired = Number(form.diamondsRequired);
    const coinsAwarded = Number(form.coinsAwarded);
    const bonusCoins = Number(form.bonusCoins || "0");
    const displayOrder = Number(form.displayOrder || "0");

    if (!(diamondsRequired > 0)) return setModalError("Diamonds required must be a positive number.");
    if (!(coinsAwarded > 0)) return setModalError("Coins awarded must be a positive number.");
    if (bonusCoins < 0) return setModalError("Bonus coins can't be negative.");
    if (displayOrder < 0) return setModalError("Display order can't be negative.");

    setSaving(true);
    setModalError("");
    try {
      if (editId) {
        await updateExchangeOption(editId, { diamondsRequired, coinsAwarded, bonusCoins, displayOrder, isActive: form.isActive });
        setFlash({ type: "success", text: "Package updated." });
      } else {
        await createExchangeOption({ diamondsRequired, coinsAwarded, bonusCoins, displayOrder, isActive: form.isActive });
        setFlash({ type: "success", text: "Package created." });
      }
      closeModal();
      loadOptions();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: ExchangeOption) => {
    try {
      const updated = await updateExchangeOption(o._id, { isActive: !o.isActive });
      setOptions((prev) => prev.map((x) => (x._id === o._id ? { ...x, isActive: updated.isActive } : x)));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to toggle status" });
    }
  };

  const handleDelete = async (o: ExchangeOption) => {
    if (!confirm(`Delete the ${fmt(o.diamondsRequired)}-diamond package?`)) return;
    setDeletingId(o._id);
    try {
      await deleteExchangeOption(o._id);
      setOptions((prev) => prev.filter((x) => x._id !== o._id));
      setFlash({ type: "success", text: "Package deleted." });
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to delete package" });
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
                <li className="breadcrumb-item">Wallet &amp; Finance</li>
                <li className="breadcrumb-item active">Coin Exchange</li>
              </ol>
            </div>
            <h4 className="page-title">Coin Exchange</h4>
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

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === "packages" ? "active" : ""}`} onClick={() => setTab("packages")}>
            <i className="ri-exchange-dollar-line me-1"></i>Exchange Packages
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            <i className="ri-history-line me-1"></i>Global History
          </button>
        </li>
      </ul>

      {tab === "packages" ? (
        <>
        <div className="alert alert-info py-2 fs-13 mb-3">
          <i className="ri-information-line me-1"></i>
          Each package lets a user <strong>spend diamonds to receive coins</strong>.
          Diamonds Required is what they pay; Coins Awarded (+ bonus) is what they get.
        </div>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="header-title mb-0">
              <i className="ri-exchange-dollar-line me-2 text-primary"></i>
              Packages <span className="badge bg-secondary ms-1">{options.length}</span>
            </h4>
            <div className="d-flex gap-1">
              <button className="btn btn-sm btn-outline-secondary" onClick={loadOptions} disabled={loading}>
                <i className={`ri-refresh-line ${loading ? "spin-anim" : ""}`}></i>
              </button>
              <button className="btn btn-sm btn-primary" onClick={openCreate}>
                <i className="ri-add-line me-1"></i>Add Package
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
            ) : options.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ri-exchange-dollar-line fs-1 d-block mb-2"></i>
                No exchange packages yet. Add one to let users convert diamonds to coins.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order</th>
                      <th>Diamonds Required</th>
                      <th>Coins Awarded</th>
                      <th>Bonus Coins</th>
                      <th>Total Coins</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((o) => (
                      <tr key={o._id}>
                        <td><span className="badge bg-light text-dark">#{o.displayOrder}</span></td>
                        <td className="text-info fw-medium">
                          <i className="ri-vip-diamond-line me-1"></i>{fmt(o.diamondsRequired)}
                        </td>
                        <td className="text-warning-emphasis fw-medium">
                          <i className="ri-copper-coin-line me-1"></i>{fmt(o.coinsAwarded)}
                        </td>
                        <td>{o.bonusCoins ? <span className="badge bg-success-subtle text-success">+{fmt(o.bonusCoins)}</span> : <span className="text-muted">—</span>}</td>
                        <td className="fw-semibold text-warning-emphasis">{fmt((o.coinsAwarded ?? 0) + (o.bonusCoins ?? 0))}</td>
                        <td>
                          <button
                            className={`badge border-0 ${o.isActive ? "bg-success" : "bg-secondary"}`}
                            onClick={() => toggleActive(o)}
                            title="Toggle active"
                            style={{ cursor: "pointer" }}
                          >
                            {o.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <button className="btn btn-sm btn-soft-primary" title="Edit" onClick={() => openEdit(o)}>
                              <i className="ri-edit-line"></i>
                            </button>
                            <button className="btn btn-sm btn-soft-danger" title="Delete" onClick={() => handleDelete(o)} disabled={deletingId === o._id}>
                              {deletingId === o._id ? <span className="spinner-border spinner-border-sm" /> : <i className="ri-delete-bin-line"></i>}
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
        </>
      ) : (
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="header-title mb-0">
              <i className="ri-history-line me-2 text-primary"></i>
              Global Exchange History <span className="badge bg-secondary ms-1">{history.length}</span>
            </h4>
            <button className="btn btn-sm btn-outline-secondary" onClick={loadHistory} disabled={historyLoading}>
              <i className={`ri-refresh-line ${historyLoading ? "spin-anim" : ""}`}></i>
            </button>
          </div>
          <div className="card-body p-0">
            {historyLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ri-history-line fs-1 d-block mb-2"></i>
                No exchanges yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User ID</th>
                      <th>Diamonds Spent</th>
                      <th>Coins Received</th>
                      <th>Bonus Coins</th>
                      <th>Total Coins</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((t) => (
                      <tr key={t._id}>
                        <td className="fs-13 text-muted">{t.userId}</td>
                        <td className="text-info"><i className="ri-vip-diamond-line me-1"></i>{fmt(t.diamondsDeducted)}</td>
                        <td className="text-warning-emphasis"><i className="ri-copper-coin-line me-1"></i>{fmt(t.coinsAwarded)}</td>
                        <td>{t.bonusCoins ? `+${fmt(t.bonusCoins)}` : "—"}</td>
                        <td className="fw-semibold text-warning-emphasis">{fmt((t.coinsAwarded ?? 0) + (t.bonusCoins ?? 0))}</td>
                        <td className="fs-13 text-muted">{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-exchange-dollar-line me-2 text-primary"></i>
                  {editId ? "Edit Package" : "Add Exchange Package"}
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
                  <div className="col-6">
                    <label className="form-label fs-13">Diamonds Required (cost)</label>
                    <input type="number" className="form-control" value={form.diamondsRequired}
                      onChange={(e) => setForm({ ...form, diamondsRequired: e.target.value })} placeholder="e.g. 1000" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Coins Awarded</label>
                    <input type="number" className="form-control" value={form.coinsAwarded}
                      onChange={(e) => setForm({ ...form, coinsAwarded: e.target.value })} placeholder="e.g. 100" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Bonus Coins</label>
                    <input type="number" className="form-control" value={form.bonusCoins}
                      onChange={(e) => setForm({ ...form, bonusCoins: e.target.value })} placeholder="0" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Display Order</label>
                    <input type="number" className="form-control" value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} placeholder="0" />
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="exActive"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                      <label className="form-check-label" htmlFor="exActive">Active (visible to users)</label>
                    </div>
                  </div>
                </div>
                {Number(form.diamondsRequired) > 0 && Number(form.coinsAwarded) > 0 && (
                  <div className="alert alert-light border mt-3 mb-0 fs-13">
                    <i className="ri-information-line me-1 text-primary"></i>
                    Users pay <strong>{fmt(Number(form.diamondsRequired))}</strong> diamonds →{" "}
                    receive <strong>{fmt(Number(form.coinsAwarded) + Number(form.bonusCoins || "0"))}</strong> coins.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : <><i className="ri-save-line me-1"></i>{editId ? "Save Changes" : "Create Package"}</>}
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
