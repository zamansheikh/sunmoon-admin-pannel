"use client";
import { PROJECT_NAME } from "@/lib/constants";

import { useEffect, useState } from "react";
import {
  StoreItem,
  EffectedBucketSummary,
  getSvipItems,
  deleteStoreItem,
  getEffectedBucketSummary,
} from "@/lib/api";
import SvgaPreviewModal, {
  buildSvgaPreviewEntries,
} from "@/components/common/SvgaPreviewModal";
import BundleUploadForm from "@/components/store/BundleUploadForm";

type Flash = { type: "success" | "danger"; text: string } | null;

const LEVEL_COLORS: Record<string, string> = {
  "SVIP-1": "#E0A526",
  "SVIP-2": "#00C6FF",
  "SVIP-3": "#4CAF50",
  "SVIP-4": "#FF6B35",
  "SVIP-5": "#9E9E9E",
  "SVIP-6": "#E040FB",
  "SVIP-7": "#FF1744",
  "SVIP-8": "#00E5FF",
  "SVIP-9": "#FFD700",
};

export default function SvipManagementPage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
  const [deleteEffected, setDeleteEffected] = useState<EffectedBucketSummary | null>(null);
  const [isLoadingEffected, setIsLoadingEffected] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview modal target. Null when closed.
  const [previewItem, setPreviewItem] = useState<StoreItem | null>(null);

  // Upload bundle is shown in a modal (opened by a button) rather than inline.
  const [showUpload, setShowUpload] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await getSvipItems();
      // Sort by SVIP level number
      data.sort((a, b) => {
        const numA = parseInt(a.name.split("-")[1] || "0") || 0;
        const numB = parseInt(b.name.split("-")[1] || "0") || 0;
        return numA - numB;
      });
      setItems(data);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to load SVIP items",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDeleteClick = async (item: StoreItem) => {
    setDeleteTarget(item);
    setDeleteEffected(null);
    setIsLoadingEffected(true);
    try {
      const summary = await getEffectedBucketSummary(item._id);
      setDeleteEffected(summary);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to load affected users",
      });
      setDeleteTarget(null);
    } finally {
      setIsLoadingEffected(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteStoreItem(deleteTarget._id);
      setFlash({ type: "success", text: `"${deleteTarget.name}" deleted successfully` });
      setDeleteTarget(null);
      setDeleteEffected(null);
      await fetchItems();
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to delete item",
      });
    } finally {
      setIsDeleting(false);
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
                <li className="breadcrumb-item">SVIP</li>
                <li className="breadcrumb-item active">Management</li>
              </ol>
            </div>
            <h4 className="page-title">SVIP Level Management</h4>
          </div>
        </div>
      </div>

      {flash && (
        <div className={`alert alert-${flash.type} py-2 mb-3`}>
          <i className={`me-1 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
          {flash.text}
          <button className="btn-close float-end" onClick={() => setFlash(null)} />
        </div>
      )}

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-warning text-dark" onClick={() => setShowUpload(true)}>
          <i className="ri-upload-cloud-2-line me-1"></i>Upload SVIP Bundle Item
        </button>
      </div>

      {showUpload && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close ms-auto"
                  onClick={() => setShowUpload(false)}
                />
              </div>
              <div className="modal-body pt-0">
                <BundleUploadForm
                  mode="SVIP"
                  onUploaded={() => {
                    fetchItems();
                    setShowUpload(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-vip-crown-2-line me-2 text-warning"></i>
                SVIP Levels (SVIP-1 to SVIP-9)
              </h4>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchItems}
                disabled={isLoading}
              >
                <i className={`ri-refresh-line${isLoading ? " spin-anim" : ""}`}></i>
              </button>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                SVIP levels are premium store bundles (SVIP-1 through SVIP-9). Each level grants XP multipliers and privileges.
                Create new SVIP levels using the upload form above.
              </p>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-warning" role="status" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="ri-vip-crown-line d-block mb-2" style={{ fontSize: 48 }}></i>
                  No SVIP items found. Create SVIP bundle items in Store Management.
                </div>
              ) : (
                <div className="row g-3">
                  {items.map((item) => {
                    const levelColor = LEVEL_COLORS[item.name] || "#E0A526";
                    return (
                      <div key={item._id} className="col-12 col-md-6 col-xl-4">
                        <div
                          className="card border h-100 mb-0"
                          style={{ borderColor: levelColor + "66" }}
                        >
                          <div
                            className="card-header py-2 d-flex align-items-center justify-content-between"
                            style={{ backgroundColor: levelColor + "18" }}
                          >
                            <h5 className="mb-0 d-flex align-items-center gap-2">
                              <span
                                className="badge"
                                style={{ backgroundColor: levelColor }}
                              >
                                {item.name}
                              </span>
                              {item.isPremium && (
                                <span className="badge bg-warning text-dark">Premium</span>
                              )}
                            </h5>
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setPreviewItem(item)}
                                title="Preview SVGA assets"
                              >
                                <i className="ri-eye-line"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteClick(item)}
                                title="Delete"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                          <div className="card-body py-3">
                            {/* Prices */}
                            <div className="mb-2">
                              <small className="text-muted fw-semibold">PRICES</small>
                              {item.prices && item.prices.length > 0 ? (
                                item.prices.map((p, i) => (
                                  <div key={i} className="d-flex justify-content-between">
                                    <span>{p.validity} days</span>
                                    <span className="fw-semibold">{p.price.toLocaleString()} coins</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted">No prices set</div>
                              )}
                            </div>

                            {/* Privileges */}
                            <div className="mb-2">
                              <small className="text-muted fw-semibold">PRIVILEGES</small>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {item.privilege && item.privilege.length > 0 ? (
                                  item.privilege.map((p, i) => (
                                    <span key={i} className="badge bg-light text-dark">{p}</span>
                                  ))
                                ) : (
                                  <span className="text-muted">None</span>
                                )}
                              </div>
                            </div>

                            {/* Bundle Files */}
                            <div className="mb-2">
                              <small className="text-muted fw-semibold">
                                BUNDLE FILES ({item.bundleFiles?.length ?? 0})
                              </small>
                              <div className="d-flex flex-wrap gap-2 mt-1">
                                {item.bundleFiles && item.bundleFiles.length > 0 ? (
                                  item.bundleFiles.map((b, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      className="text-center btn btn-link p-0 border-0"
                                      onClick={() => setPreviewItem(item)}
                                      title={`Preview ${b.categoryName}`}
                                      style={{ textDecoration: "none" }}
                                    >
                                      {b.previewFile ? (
                                        <img
                                          src={b.previewFile}
                                          alt={b.categoryName}
                                          style={{
                                            width: 48,
                                            height: 48,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            border: `1px solid ${levelColor}44`,
                                          }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 8,
                                            background: levelColor + "22",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <i className="ri-file-line"></i>
                                        </div>
                                      )}
                                      <div style={{ fontSize: 10 }} className="text-muted mt-1">
                                        {b.categoryName}
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <span className="text-muted">No bundle files</span>
                                )}
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="d-flex justify-content-between text-muted small mt-2 pt-2 border-top">
                              <span>Sold: {item.totalSold ?? 0}</span>
                              <span>
                                {item.previewFile ? (
                                  <a href={item.previewFile} target="_blank" rel="noreferrer">
                                    Preview
                                  </a>
                                ) : (
                                  "No preview"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* XP Multipliers Info */}
      <div className="row mt-1">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="header-title mb-0">
                <i className="ri-flashlight-line me-2 text-info"></i>
                SVIP XP Multipliers
              </h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>SVIP Level</th>
                      <th>XP Multiplier</th>
                      <th>Bonus</th>
                      <th>Perks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="badge" style={{ backgroundColor: LEVEL_COLORS["SVIP-1"] }}>SVIP-1</span></td>
                      <td>1.0x</td>
                      <td>No bonus</td>
                      <td>Base privileges</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="badge me-1" style={{ backgroundColor: LEVEL_COLORS["SVIP-2"] }}>SVIP-2</span>
                        to
                        <span className="badge ms-1" style={{ backgroundColor: LEVEL_COLORS["SVIP-6"] }}>SVIP-6</span>
                      </td>
                      <td>1.2x</td>
                      <td className="text-success">+20%</td>
                      <td>Enhanced privileges</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="badge me-1" style={{ backgroundColor: LEVEL_COLORS["SVIP-7"] }}>SVIP-7</span>
                        to
                        <span className="badge ms-1" style={{ backgroundColor: LEVEL_COLORS["SVIP-8"] }}>SVIP-8</span>
                      </td>
                      <td>1.3x</td>
                      <td className="text-success">+30%</td>
                      <td>Premium privileges</td>
                    </tr>
                    <tr>
                      <td><span className="badge" style={{ backgroundColor: LEVEL_COLORS["SVIP-9"] }}>SVIP-9</span></td>
                      <td>1.4x</td>
                      <td className="text-success fw-bold">+40%</td>
                      <td>All privileges + Free family creation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="alert alert-info py-2 mt-3 mb-0">
                <i className="ri-information-line me-1"></i>
                SVIP level 4+ users get <strong>free family creation</strong> (normally 10,000,000 coins).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SVGA Preview Modal */}
      <SvgaPreviewModal
        open={previewItem !== null}
        title={previewItem ? `${previewItem.name} — Bundle Preview` : ""}
        entries={previewItem ? buildSvgaPreviewEntries(previewItem) : []}
        onClose={() => setPreviewItem(null)}
      />

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="ri-error-warning-line me-2"></i>
                  Delete {deleteTarget.name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => { setDeleteTarget(null); setDeleteEffected(null); }}
                  disabled={isDeleting}
                />
              </div>
              <div className="modal-body">
                {isLoadingEffected ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-danger" role="status" />
                    <p className="mt-2 text-muted">Checking affected users...</p>
                  </div>
                ) : deleteEffected ? (
                  <>
                    <p>
                      Are you sure you want to delete <strong>&quot;{deleteEffected.itemName}&quot;</strong>?
                    </p>
                    {deleteEffected.userCount > 0 ? (
                      <div className="alert alert-warning py-2">
                        <i className="ri-alarm-warning-line me-1"></i>
                        <strong>{deleteEffected.userCount}</strong> user(s) currently own this SVIP level.
                        Their XP multiplier will be affected.
                      </div>
                    ) : (
                      <div className="alert alert-info py-2">
                        <i className="ri-information-line me-1"></i>
                        No users currently own this SVIP level.
                      </div>
                    )}
                    <p className="text-danger mb-0">
                      <small>This action is permanent. All bundle files will be deleted.</small>
                    </p>
                  </>
                ) : null}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setDeleteTarget(null); setDeleteEffected(null); }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || isLoadingEffected}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-line me-1"></i>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
