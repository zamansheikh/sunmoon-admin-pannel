"use client";
import { PROJECT_NAME } from "@/lib/constants";

import { useEffect, useState } from "react";
import {
  StoreItem,
  EffectedBucketSummary,
  getVipItems,
  deleteStoreItem,
  getEffectedBucketSummary,
} from "@/lib/api";
import SvgaPreviewModal, {
  buildSvgaPreviewEntries,
} from "@/components/common/SvgaPreviewModal";
import BundleUploadForm from "@/components/store/BundleUploadForm";

type Flash = { type: "success" | "danger"; text: string } | null;

export default function VipManagementPage() {
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
      const data = await getVipItems();
      data.sort((a, b) => {
        const numA = parseInt(a.name.split("-")[1] || "0") || 0;
        const numB = parseInt(b.name.split("-")[1] || "0") || 0;
        return numA - numB;
      });
      setItems(data);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to load VIP items",
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
        text: error instanceof Error ? error.message : "Failed to check affected users",
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
                <li className="breadcrumb-item">VIP</li>
                <li className="breadcrumb-item active">Management</li>
              </ol>
            </div>
            <h4 className="page-title">VIP Management</h4>
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
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <i className="ri-upload-cloud-2-line me-1"></i>Upload VIP Bundle Item
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
                  mode="VIP"
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
                <i className="ri-vip-diamond-line me-2 text-primary"></i>
                VIP Items
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
                VIP items are premium bundles under the VIP category.
                Create new VIP items using the upload form above.
              </p>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="ri-vip-diamond-line d-block mb-2" style={{ fontSize: 48 }}></i>
                  No VIP items found. Create VIP bundle items in Store Management.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Prices</th>
                        <th>Privileges</th>
                        <th>Bundle Files</th>
                        <th>Preview</th>
                        <th>Total Sold</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <span className="fw-semibold">{item.name}</span>
                            {item.isPremium && (
                              <span className="badge bg-primary ms-2">Premium</span>
                            )}
                          </td>
                          <td>
                            {item.prices && item.prices.length > 0
                              ? item.prices.map((p, i) => (
                                  <div key={i} className="small">
                                    {p.price.toLocaleString()} coins / {p.validity}d
                                  </div>
                                ))
                              : <span className="text-muted">N/A</span>
                            }
                          </td>
                          <td>
                            {item.privilege && item.privilege.length > 0
                              ? item.privilege.map((p, i) => (
                                  <span key={i} className="badge bg-light text-dark me-1 mb-1">{p}</span>
                                ))
                              : <span className="text-muted">-</span>
                            }
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {item.bundleFiles?.length ?? 0} files
                            </span>
                          </td>
                          <td>
                            {item.previewFile ? (
                              <a href={item.previewFile} target="_blank" rel="noreferrer">
                                <img
                                  src={item.previewFile}
                                  alt="preview"
                                  style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                                />
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{item.totalSold ?? 0}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => setPreviewItem(item)}
                                title="Preview SVGA assets"
                              >
                                <i className="ri-eye-line me-1"></i>
                                Preview
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteClick(item)}
                              >
                                <i className="ri-delete-bin-line me-1"></i>
                                Delete
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
                        <strong>{deleteEffected.userCount}</strong> user(s) currently own this VIP item.
                      </div>
                    ) : (
                      <div className="alert alert-info py-2">
                        <i className="ri-information-line me-1"></i>
                        No users currently own this item.
                      </div>
                    )}
                    <p className="text-danger mb-0">
                      <small>This action is permanent and cannot be undone.</small>
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
