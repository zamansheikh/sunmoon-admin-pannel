"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  StoreCategory,
  createStoreItemBatch,
  getStoreCategories,
} from "@/lib/api";
import SvgaPreviewModal, {
  useUploadPreview,
} from "@/components/common/SvgaPreviewModal";

type Flash = { type: "success" | "danger"; text: string } | null;

type BundleInputRow = {
  id: number;
  categoryName: string;
  file: File | null;
  previewFile: File | null;
};

type PriceRow = { id: number; validity: string; price: string };

export interface BundleUploadFormProps {
  /** Determines which bundle namespace this form publishes to. */
  mode: "VIP" | "SVIP";
  /** Called after a successful upload so the parent can refresh its list. */
  onUploaded?: () => void;
}

const VALID_NAME_RE = {
  VIP: /^VIP(?:-\d+)?$/,
  SVIP: /^SVIP-\d+$/,
} as const;

const DEFAULT_NAME = {
  VIP: "VIP",
  SVIP: "SVIP-1",
} as const;

export default function BundleUploadForm({ mode, onUploaded }: BundleUploadFormProps) {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [batchForm, setBatchForm] = useState<{
    name: string;
    categoryId: string;
    privilege: string;
  }>({
    name: DEFAULT_NAME[mode],
    categoryId: "",
    privilege: "",
  });
  const [batchPriceRows, setBatchPriceRows] = useState<PriceRow[]>([
    { id: Date.now(), validity: "", price: "" },
  ]);
  const [bundleRows, setBundleRows] = useState<BundleInputRow[]>([
    { id: Date.now() + 1, categoryName: "", file: null, previewFile: null },
  ]);
  const [batchLogoFile, setBatchLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logo input ref — bundle rows remount on reset because their ids change,
  // but this top-level input keeps the same DOM node and needs an explicit clear.
  const batchLogoRef = useRef<HTMLInputElement>(null);

  const uploadPreview = useUploadPreview();

  const premiumCategories = useMemo(
    () => categories.filter((c) => c.isPremium),
    [categories]
  );
  const normalCategories = useMemo(
    () => categories.filter((c) => !c.isPremium),
    [categories]
  );

  // The premium category this form publishes to is fixed by `mode`:
  // SVIP mode → only the "SVIP" category, VIP mode → only "VIP".
  const modeCategories = useMemo(
    () =>
      premiumCategories.filter(
        (c) => c.title.toLowerCase() === mode.toLowerCase()
      ),
    [premiumCategories, mode]
  );

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getStoreCategories();
      setCategories(data);
    } catch (err: unknown) {
      setFlash({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load categories",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Pick a default premium category once categories arrive.
  useEffect(() => {
    if (!batchForm.categoryId && modeCategories.length > 0) {
      setBatchForm((prev) => ({ ...prev, categoryId: modeCategories[0]._id }));
    }
  }, [modeCategories, batchForm.categoryId]);

  const addBundleRow = () =>
    setBundleRows((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), categoryName: "", file: null, previewFile: null },
    ]);

  const removeBundleRow = (id: number) =>
    setBundleRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  const updateBundleRow = (
    id: number,
    data: Partial<Pick<BundleInputRow, "categoryName" | "file" | "previewFile">>
  ) => setBundleRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));

  const addPriceRow = () =>
    setBatchPriceRows((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), validity: "30", price: "" },
    ]);

  const removePriceRow = (id: number) =>
    setBatchPriceRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlash(null);

    const bundleName = batchForm.name.trim();
    if (!VALID_NAME_RE[mode].test(bundleName)) {
      setFlash({
        type: "danger",
        text: mode === "SVIP"
          ? "Bundle name must match SVIP-<number> (e.g. SVIP-1)"
          : "Bundle name must be VIP or VIP-<number>",
      });
      return;
    }
    if (!batchForm.categoryId) {
      setFlash({ type: "danger", text: "Please choose a premium category" });
      return;
    }

    // Price tiers are optional — leave every row empty to skip them entirely.
    // But if any row is half-filled (validity without price or vice versa),
    // surface that specifically so the admin doesn't lose data they typed.
    const touchedPriceRows = batchPriceRows.filter(
      (r) => r.validity.trim() !== "" || r.price.trim() !== ""
    );
    const invalidPriceRows = touchedPriceRows.filter(
      (r) =>
        !(r.validity && Number(r.validity) >= 1) ||
        r.price === "" ||
        Number(r.price) < 0
    );
    if (invalidPriceRows.length > 0) {
      setFlash({
        type: "danger",
        text: "Each price tier needs a validity (≥1 day) and a price (≥0). Clear the row to skip it.",
      });
      return;
    }
    const validPrices = touchedPriceRows;

    // SVGA file is optional — a row needs a category name and at least one
    // file (svga or preview image). Send only the files that were actually
    // selected; the API client + backend tolerate a missing svgaFile.
    const preparedBundles = bundleRows
      .filter((row) => row.categoryName && (row.file || row.previewFile))
      .map((row) => ({
        categoryName: row.categoryName,
        svgaFile: row.file ?? undefined,
        previewFile: row.previewFile ?? undefined,
      }));

    if (preparedBundles.length === 0) {
      setFlash({
        type: "danger",
        text: "Add at least one bundle row with a category and either an SVGA or a preview image",
      });
      return;
    }

    const names = preparedBundles.map((b) => b.categoryName);
    if (new Set(names).size !== names.length) {
      setFlash({ type: "danger", text: "Bundle category names must be unique" });
      return;
    }

    setIsSubmitting(true);
    try {
      const privilegeArr = batchForm.privilege.trim()
        ? batchForm.privilege.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      await createStoreItemBatch({
        name: bundleName,
        categoryId: batchForm.categoryId,
        prices: validPrices.map((r) => ({
          validity: Number(r.validity),
          price: Number(r.price),
        })),
        privilege: privilegeArr,
        bundles: preparedBundles,
        logoFile: batchLogoFile ?? undefined,
      });
      // Reset to fresh defaults. New `id`s on the row arrays force React to
      // remount the file inputs inside, clearing any selected filename in
      // the DOM. The top-level logo input keeps its node, so clear via ref.
      setBatchForm((prev) => ({ ...prev, name: DEFAULT_NAME[mode], privilege: "" }));
      setBatchPriceRows([{ id: Date.now(), validity: "", price: "" }]);
      setBundleRows([{ id: Date.now() + 1, categoryName: "", file: null, previewFile: null }]);
      setBatchLogoFile(null);
      if (batchLogoRef.current) batchLogoRef.current.value = "";
      setFlash({ type: "success", text: `${mode} bundle uploaded successfully` });
      onUploaded?.();
    } catch (err: unknown) {
      setFlash({
        type: "danger",
        text: err instanceof Error ? err.message : `Failed to upload ${mode} item`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleIcon = mode === "SVIP" ? "ri-vip-crown-2-line text-warning" : "ri-vip-crown-line text-info";
  const submitBtnCls = mode === "SVIP" ? "btn-warning" : "btn-info";
  const submitLabel = mode === "SVIP" ? "Upload SVIP Item" : "Upload VIP Item";

  return (
    <>
    <div className="card">
      <div className="card-header">
        <h4 className="header-title mb-0">
          <i className={`${titleIcon} me-2`}></i>
          Upload {mode} Bundle Item
        </h4>
      </div>
      <div className="card-body">
        {flash && (
          <div className={`alert alert-${flash.type} py-2 mb-3`}>
            <i className={`me-1 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
            {flash.text}
            <button className="btn-close float-end" onClick={() => setFlash(null)} />
          </div>
        )}

        {isLoadingCategories ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : modeCategories.length === 0 ? (
          <div className="alert alert-warning py-2 mb-0">
            No <strong>{mode}</strong> category found. Create the {mode} category in{" "}
            <a href="/admin/store/manage">Store Management</a> first.
          </div>
        ) : normalCategories.length === 0 ? (
          <div className="alert alert-warning py-2 mb-0">
            No normal categories found. Create normal categories to map bundle files in <a href="/admin/store/manage">Store Management</a>.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Bundle Name</label>
                <input
                  className="form-control"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={mode === "SVIP" ? "e.g. SVIP-1" : "VIP or VIP-1"}
                />
                <small className="text-muted">
                  {mode === "SVIP"
                    ? "Must match SVIP-<number>"
                    : "Use VIP or VIP-<number>"}
                </small>
              </div>
              <div className="col-md-4">
                <label className="form-label">Premium Category</label>
                <select
                  className="form-select"
                  value={batchForm.categoryId}
                  onChange={(e) => setBatchForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                >
                  {modeCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Privileges (comma-separated)</label>
                <input
                  className="form-control"
                  value={batchForm.privilege}
                  onChange={(e) => setBatchForm((prev) => ({ ...prev, privilege: e.target.value }))}
                  placeholder="e.g. vip_badge, special_effect"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Logo Image <span className="text-muted small">(optional)</span>
                </label>
                <input
                  ref={batchLogoRef}
                  type="file"
                  className="form-control"
                  accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
                  onChange={(e) => setBatchLogoFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="mt-4 d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                Price Tiers{" "}
                <small className="text-muted fw-normal">
                  (optional — leave the row empty to skip)
                </small>
              </h5>
              <button type="button" className="btn btn-sm btn-outline-success" onClick={addPriceRow}>
                <i className="ri-add-line me-1"></i>Add Price
              </button>
            </div>

            <div className="table-responsive mt-2">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Validity (days)</th>
                    <th>Price (coins)</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batchPriceRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min={1}
                          value={row.validity}
                          onChange={(e) =>
                            setBatchPriceRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, validity: e.target.value } : r))
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min={0}
                          value={row.price}
                          onChange={(e) =>
                            setBatchPriceRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, price: e.target.value } : r))
                            )
                          }
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removePriceRow(row.id)}
                          disabled={batchPriceRows.length === 1}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Bundle Files</h5>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addBundleRow}>
                <i className="ri-add-line me-1"></i>Add Row
              </button>
            </div>

            <div className="table-responsive mt-2">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ minWidth: 180 }}>Category Name</th>
                    <th>
                      SVGA File{" "}
                      <small className="text-muted fw-normal">
                        (optional — preview image is used if omitted)
                      </small>
                    </th>
                    <th>Preview Image</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bundleRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.categoryName}
                          onChange={(e) => updateBundleRow(row.id, { categoryName: e.target.value })}
                        >
                          <option value="">Select category</option>
                          {normalCategories.map((cat) => (
                            <option key={cat._id} value={cat.title}>{cat.title}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          accept=".svga,.zip,.json,.webp,.png"
                          onChange={(e) =>
                            updateBundleRow(row.id, { file: e.target.files?.[0] ?? null })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          accept=".png,.jpg,.jpeg,.gif,.webp"
                          onChange={(e) =>
                            updateBundleRow(row.id, { previewFile: e.target.files?.[0] ?? null })
                          }
                        />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          {(row.file || row.previewFile) && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              title="Preview this row's SVGA"
                              onClick={() =>
                                uploadPreview.open({
                                  title: `${row.categoryName || "Row"} — Preview`,
                                  items: [
                                    {
                                      label: row.categoryName || "svga",
                                      svgaFile: row.file,
                                      previewFile: row.previewFile,
                                    },
                                  ],
                                })
                              }
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeBundleRow(row.id)}
                            disabled={bundleRows.length === 1}
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

            {bundleRows.some((r) => r.file || r.previewFile) && (
              <div className="text-end mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    uploadPreview.open({
                      title: `${batchForm.name || "New bundle"} — Preview`,
                      items: bundleRows
                        .filter((r) => r.file || r.previewFile)
                        .map((r) => ({
                          label: r.categoryName || "svga",
                          svgaFile: r.file,
                          previewFile: r.previewFile,
                        })),
                    })
                  }
                >
                  <i className="ri-eye-line me-1" />
                  Preview Bundle
                </button>
              </div>
            )}

            <div className="text-end mt-3">
              <button className={`btn ${submitBtnCls}`} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span>Uploading...</>
                ) : (
                  <><i className="ri-upload-cloud-line me-1"></i>{submitLabel}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>

    {/* Upload preview modal — rendered for the buttons that call
        uploadPreview.open(...). Without this, those clicks are no-ops. */}
    <SvgaPreviewModal {...uploadPreview.modalProps} />
    </>
  );
}
