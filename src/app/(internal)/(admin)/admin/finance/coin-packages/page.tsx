"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCoinPurchaseOptions,
  createCoinPurchaseOption,
  updateCoinPurchaseOption,
  deleteCoinPurchaseOption,
  CoinPurchaseOption,
} from "@/lib/api";

type Flash = { type: "success" | "danger"; text: string } | null;

// A coin package the app shows in its shop UI. Purchasing via Google Play
// Billing isn't wired yet — this is display configuration only.
const emptyForm = {
  productId: "",
  coinAmount: "",
  bonusCoins: "0",
  price: "",
  currency: "USD",
  displayOrder: "0",
  isActive: true,
};

const fmt = (n?: number) => (n ?? 0).toLocaleString();
const priceLabel = (currency: string, price?: number) => {
  const p = price ?? 0;
  const s = p === Math.round(p) ? p.toFixed(0) : p.toFixed(2);
  return `${currency} ${s}`;
};

export default function CoinPackagesPage() {
  const [options, setOptions] = useState<CoinPurchaseOption[]>([]);
  const [loading, setLoading] = useState(false);
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
      const data = await getCoinPurchaseOptions();
      setOptions([...data].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to load coin packages" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, displayOrder: String(options.length) });
    setModalError("");
    setModalOpen(true);
  };
  const openEdit = (o: CoinPurchaseOption) => {
    setEditId(o._id);
    setForm({
      productId: o.productId,
      coinAmount: String(o.coinAmount),
      bonusCoins: String(o.bonusCoins ?? 0),
      price: String(o.price),
      currency: o.currency || "USD",
      displayOrder: String(o.displayOrder ?? 0),
      isActive: o.isActive,
    });
    setModalError("");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setSaving(false); };

  const handleSave = async () => {
    const productId = form.productId.trim();
    const coinAmount = Number(form.coinAmount);
    const bonusCoins = Number(form.bonusCoins || "0");
    const price = Number(form.price);
    const currency = form.currency.trim() || "USD";
    const displayOrder = Number(form.displayOrder || "0");

    if (!productId) return setModalError("Product ID is required.");
    if (!(coinAmount > 0)) return setModalError("Coin amount must be a positive number.");
    if (bonusCoins < 0) return setModalError("Bonus coins can't be negative.");
    if (!(price > 0)) return setModalError("Price must be a positive number.");
    if (displayOrder < 0) return setModalError("Display order can't be negative.");

    setSaving(true);
    setModalError("");
    try {
      if (editId) {
        await updateCoinPurchaseOption(editId, { productId, coinAmount, bonusCoins, price, currency, displayOrder, isActive: form.isActive });
        setFlash({ type: "success", text: "Package updated." });
      } else {
        await createCoinPurchaseOption({ productId, coinAmount, bonusCoins, price, currency, displayOrder, isActive: form.isActive });
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

  const toggleActive = async (o: CoinPurchaseOption) => {
    try {
      const updated = await updateCoinPurchaseOption(o._id, { isActive: !o.isActive });
      setOptions((prev) => prev.map((x) => (x._id === o._id ? { ...x, isActive: updated.isActive } : x)));
    } catch (e: unknown) {
      setFlash({ type: "danger", text: e instanceof Error ? e.message : "Failed to toggle status" });
    }
  };

  const handleDelete = async (o: CoinPurchaseOption) => {
    if (!confirm(`Delete the "${o.productId}" package?`)) return;
    setDeletingId(o._id);
    try {
      await deleteCoinPurchaseOption(o._id);
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
                <li className="breadcrumb-item active">Coin Packages</li>
              </ol>
            </div>
            <h4 className="page-title">Coin Packages</h4>
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
        These packages appear in the app&apos;s coin shop. <strong>Product ID</strong> must match
        the Google Play in-app product ID. Purchasing via Google Play Billing isn&apos;t wired up
        yet — for now these are display-only.
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="header-title mb-0">
            <i className="ri-copper-coin-line me-2 text-warning"></i>
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
              <i className="ri-copper-coin-line fs-1 d-block mb-2"></i>
              No coin packages yet. Add one to show it in the app&apos;s coin shop.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order</th>
                    <th>Product ID</th>
                    <th>Coins</th>
                    <th>Bonus</th>
                    <th>Total Coins</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((o) => (
                    <tr key={o._id}>
                      <td><span className="badge bg-light text-dark">#{o.displayOrder}</span></td>
                      <td><code className="fs-13">{o.productId}</code></td>
                      <td className="text-warning-emphasis fw-medium">
                        <i className="ri-copper-coin-line me-1"></i>{fmt(o.coinAmount)}
                      </td>
                      <td>{o.bonusCoins ? <span className="badge bg-success-subtle text-success">+{fmt(o.bonusCoins)}</span> : <span className="text-muted">—</span>}</td>
                      <td className="fw-semibold text-warning-emphasis">{fmt((o.coinAmount ?? 0) + (o.bonusCoins ?? 0))}</td>
                      <td className="fw-medium">{priceLabel(o.currency, o.price)}</td>
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

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-copper-coin-line me-2 text-warning"></i>
                  {editId ? "Edit Coin Package" : "Add Coin Package"}
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
                  <div className="col-12">
                    <label className="form-label fs-13">Product ID (Google Play)</label>
                    <input type="text" className="form-control" value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="e.g. coin_pack_100" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Coin Amount</label>
                    <input type="number" className="form-control" value={form.coinAmount}
                      onChange={(e) => setForm({ ...form, coinAmount: e.target.value })} placeholder="e.g. 100" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Bonus Coins</label>
                    <input type="number" className="form-control" value={form.bonusCoins}
                      onChange={(e) => setForm({ ...form, bonusCoins: e.target.value })} placeholder="0" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Price</label>
                    <input type="number" step="0.01" className="form-control" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1.99" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Currency</label>
                    <input type="text" className="form-control" value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-13">Display Order</label>
                    <input type="number" className="form-control" value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} placeholder="0" />
                  </div>
                  <div className="col-6 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="cpActive"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                      <label className="form-check-label" htmlFor="cpActive">Active (visible to users)</label>
                    </div>
                  </div>
                </div>
                {Number(form.coinAmount) > 0 && Number(form.price) > 0 && (
                  <div className="alert alert-light border mt-3 mb-0 fs-13">
                    <i className="ri-information-line me-1 text-primary"></i>
                    Users pay <strong>{priceLabel(form.currency.trim() || "USD", Number(form.price))}</strong> →{" "}
                    receive <strong>{fmt(Number(form.coinAmount) + Number(form.bonusCoins || "0"))}</strong> coins.
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
