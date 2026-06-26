"use client";
import { PROJECT_NAME } from "@/lib/constants";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  StoreCategory,
  StoreItem,
  EffectedBucketSummary,
  createStoreCategory,
  createStoreItemSingle,
  deleteStoreCategory,
  deleteStoreItem,
  getCategoryDeleteEffectedItems,
  getEffectedBucketSummary,
  getStoreCategories,
  getStoreItemsByCategory,
  updateStoreCategory,
  updateStoreItemBatch,
  updateStoreItemSingle,
  grantStoreItem,
} from "@/lib/api";
import SvgaPreviewModal, {
  buildSvgaPreviewEntries,
  useUploadPreview,
} from "@/components/common/SvgaPreviewModal";

type Flash = { type: "success" | "danger"; text: string } | null;

type BundleInputRow = {
  id: number;
  categoryName: string;
  file: File | null;
  previewFile: File | null;
};

// Categories must match the exact slot keys the apps read (equipped
// store items). Free text would let admins create categories the app
// never renders, so creation is restricted to this fixed set.
const NORMAL_CATEGORY_OPTIONS = [
  "frame",
  "entry",
  "party-theme",
  "room-card",
  "mic-effect",
  "name",
  "level",
  "medal",
  "text-bubble",
  "banner",
  "svip_tag",
];
// Premium containers (created with the premium toggle on).
const PREMIUM_CATEGORY_OPTIONS = ["SVIP", "VIP"];

export default function StoreManagementPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [items, setItems] = useState<StoreItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [flash, setFlash] = useState<Flash>(null);

  // Create-category / upload-item are shown in modals (opened by toolbar
  // buttons) rather than inline forms.
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    title: "",
    isPremium: false,
  });

  const [singleForm, setSingleForm] = useState({
    name: "",
    validity: "30",
    categoryId: "",
    price: "",
    privilege: "",
    // `true` (default) → item shows up in the public store and can be bought.
    // `false` → exclusive item, hidden from the store; admin must Grant it
    // directly to each user. Required by the backend grant rule.
    canUserBuyThis: true,
  });
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreviewFile, setSinglePreviewFile] = useState<File | null>(null);
  const [singleLogoFile, setSingleLogoFile] = useState<File | null>(null);
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // File input refs — needed because React doesn't control the DOM value of
  // <input type="file">. Without these, the previously-picked filename keeps
  // showing after we reset state.
  const singleSvgaRef = useRef<HTMLInputElement>(null);
  const singlePreviewRef = useRef<HTMLInputElement>(null);
  const singleLogoRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
  const [deleteEffected, setDeleteEffected] = useState<EffectedBucketSummary | null>(null);
  const [isLoadingEffected, setIsLoadingEffected] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // SVGA preview modal target. Null when closed. Works for both single
  // items (one entry) and bundles (one entry per bundle file).
  const [previewItem, setPreviewItem] = useState<StoreItem | null>(null);

  // Form-side preview for files chosen in the create / edit forms
  // (single, batch, and edit modal share this — different open() calls).
  const uploadPreview = useUploadPreview();

  // Category rename / delete state.
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryEditForm, setCategoryEditForm] = useState({ title: "", isPremium: false });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<StoreCategory | null>(null);
  const [categoryDeleteEffected, setCategoryDeleteEffected] =
    useState<EffectedBucketSummary | null>(null);
  const [isLoadingCategoryEffected, setIsLoadingCategoryEffected] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Item edit state — one modal drives both single and batch items.
  type EditPriceRow = { id: number; validity: string; price: string };
  const [editTarget, setEditTarget] = useState<StoreItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    categoryId: "",
    privilege: "",
    canUserBuyThis: true,
  });
  const [editPriceRows, setEditPriceRows] = useState<EditPriceRow[]>([]);
  const [editSvgaFile, setEditSvgaFile] = useState<File | null>(null);
  const [editPreviewFile, setEditPreviewFile] = useState<File | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editBundleRows, setEditBundleRows] = useState<BundleInputRow[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Grant modal — admin sends an exclusive item directly to a user's bag.
  // Backend rejects unless: item is non-premium AND canUserBuyThis === false.
  const [grantTarget, setGrantTarget] = useState<StoreItem | null>(null);
  const [grantForm, setGrantForm] = useState({ userId: "", validity: "30" });
  const [grantError, setGrantError] = useState("");
  const [isGranting, setIsGranting] = useState(false);

  const openGrantModal = (item: StoreItem) => {
    setGrantTarget(item);
    setGrantForm({ userId: "", validity: "30" });
    setGrantError("");
  };
  const closeGrantModal = () => {
    setGrantTarget(null);
    setIsGranting(false);
  };
  const handleGrantSubmit = async () => {
    if (!grantTarget) return;
    const userId = Number(grantForm.userId);
    const validity = Number(grantForm.validity);
    if (!Number.isInteger(userId) || userId <= 0) {
      setGrantError("Enter a valid numeric User ID (e.g. 100018).");
      return;
    }
    if (!Number.isInteger(validity) || validity <= 0) {
      setGrantError("Validity must be a positive whole number of days.");
      return;
    }
    setIsGranting(true);
    setGrantError("");
    try {
      await grantStoreItem({ itemId: grantTarget._id, userId, validity });
      setFlash({
        type: "success",
        text: `Granted "${grantTarget.name}" to user ${userId} for ${validity} day(s).`,
      });
      closeGrantModal();
    } catch (e: unknown) {
      setGrantError(e instanceof Error ? e.message : "Failed to grant item");
    } finally {
      setIsGranting(false);
    }
  };

  const premiumCategories = useMemo(
    () => categories.filter((cat) => cat.isPremium),
    [categories]
  );
  const normalCategories = useMemo(
    () => categories.filter((cat) => !cat.isPremium),
    [categories]
  );

  // The only categories surfaced for single-item upload AND the
  // "Store Items by Category" browser: frame / entry / party-theme.
  const featuredCategories = useMemo(
    () =>
      normalCategories.filter((cat) =>
        ["frame", "entry", "party-theme"].includes(cat.title.toLowerCase())
      ),
    [normalCategories]
  );

  // Supported category slots for the current premium toggle, minus the
  // ones already created. Empty = nothing left to create for this set.
  const availableCategoryOptions = useMemo(() => {
    const opts = categoryForm.isPremium
      ? PREMIUM_CATEGORY_OPTIONS
      : NORMAL_CATEGORY_OPTIONS;
    const existing = new Set(categories.map((c) => c.title.toLowerCase()));
    return opts.filter((o) => !existing.has(o.toLowerCase()));
  }, [categoryForm.isPremium, categories]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getStoreCategories();
      setCategories(data);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to load categories",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchItems = async (categoryId: string) => {
    if (!categoryId) {
      setItems([]);
      return;
    }

    setIsLoadingItems(true);
    try {
      const data = await getStoreItemsByCategory(categoryId, { page: 1, limit: 100 });
      setItems(data.items);
    } catch (error: unknown) {
      setItems([]);
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to load store items",
      });
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId && featuredCategories.length > 0) {
      setSelectedCategoryId(featuredCategories[0]._id);
    }

    if (!singleForm.categoryId && featuredCategories.length > 0) {
      setSingleForm((prev) => ({ ...prev, categoryId: featuredCategories[0]._id }));
    }
  }, [categories, selectedCategoryId, singleForm.categoryId, featuredCategories]);

  useEffect(() => {
    fetchItems(selectedCategoryId);
  }, [selectedCategoryId]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.title.trim()) {
      setFlash({ type: "danger", text: "Category title is required" });
      return;
    }

    setIsCreatingCategory(true);
    try {
      await createStoreCategory({
        title: categoryForm.title.trim(),
        isPremium: categoryForm.isPremium,
      });
      setCategoryForm({ title: "", isPremium: false });
      setFlash({ type: "success", text: "Category created successfully" });
      await fetchCategories();
      setShowCategoryModal(false);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to create category",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleStartEditCategory = (cat: StoreCategory) => {
    setEditingCategoryId(cat._id);
    setCategoryEditForm({ title: cat.title, isPremium: !!cat.isPremium });
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryEditForm({ title: "", isPremium: false });
  };

  const handleSaveCategory = async (categoryId: string) => {
    const title = categoryEditForm.title.trim();
    if (!title) {
      setFlash({ type: "danger", text: "Category title is required" });
      return;
    }
    setIsSavingCategory(true);
    try {
      await updateStoreCategory(categoryId, {
        title,
        isPremium: categoryEditForm.isPremium,
      });
      setFlash({ type: "success", text: "Category updated" });
      handleCancelEditCategory();
      await fetchCategories();
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to update category",
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategoryClick = async (cat: StoreCategory) => {
    setCategoryDeleteTarget(cat);
    setCategoryDeleteEffected(null);
    setIsLoadingCategoryEffected(true);
    try {
      const effected = await getCategoryDeleteEffectedItems(cat._id);
      setCategoryDeleteEffected(effected);
    } catch {
      // Non-fatal — we still allow deletion, just without the warning data.
      setCategoryDeleteEffected(null);
    } finally {
      setIsLoadingCategoryEffected(false);
    }
  };

  const handleCloseCategoryDeleteModal = () => {
    setCategoryDeleteTarget(null);
    setCategoryDeleteEffected(null);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryDeleteTarget) return;
    setIsDeletingCategory(true);
    try {
      await deleteStoreCategory(categoryDeleteTarget._id);
      setFlash({ type: "success", text: "Category deleted" });
      handleCloseCategoryDeleteModal();
      await fetchCategories();
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to delete category",
      });
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleCreateSingleItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!singleForm.name.trim()) {
      setFlash({ type: "danger", text: "Item name is required" });
      return;
    }
    if (!singleForm.categoryId) {
      setFlash({ type: "danger", text: "Please choose a category" });
      return;
    }
    if (!singleForm.validity || Number(singleForm.validity) < 1) {
      setFlash({ type: "danger", text: "Validity must be at least 1 day" });
      return;
    }
    if (!singleForm.price || Number(singleForm.price) < 0) {
      setFlash({ type: "danger", text: "Price must be 0 or more" });
      return;
    }

    setIsSubmittingSingle(true);
    try {
      const privilegeArr = singleForm.privilege.trim()
        ? singleForm.privilege.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      await createStoreItemSingle({
        name: singleForm.name.trim(),
        validity: Number(singleForm.validity),
        categoryId: singleForm.categoryId,
        price: Number(singleForm.price),
        privilege: privilegeArr,
        svgaFile: singleFile,
        previewFile: singlePreviewFile ?? undefined,
        logoFile: singleLogoFile ?? undefined,
        canUserBuyThis: singleForm.canUserBuyThis,
      });
      setSingleForm((prev) => ({ ...prev, name: "", price: "", validity: "30", privilege: "" }));
      setSingleFile(null);
      setSinglePreviewFile(null);
      setSingleLogoFile(null);
      if (singleSvgaRef.current) singleSvgaRef.current.value = "";
      if (singlePreviewRef.current) singlePreviewRef.current.value = "";
      if (singleLogoRef.current) singleLogoRef.current.value = "";
      setFlash({ type: "success", text: "Store item uploaded successfully" });
      await fetchItems(selectedCategoryId || singleForm.categoryId);
      setShowUploadModal(false);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to upload store item",
      });
    } finally {
      setIsSubmittingSingle(false);
    }
  };

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
      await fetchItems(selectedCategoryId);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to delete store item",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setDeleteEffected(null);
  };

  // Item edit — opens the edit modal, pre-filled from the selected item.
  const handleEditItemClick = (item: StoreItem) => {
    setEditTarget(item);
    setEditForm({
      name: item.name,
      categoryId: String(item.categoryId),
      privilege: item.privilege?.join(", ") ?? "",
      canUserBuyThis: item.canUserBuyThis !== false,
    });
    setEditPriceRows(
      (item.prices ?? []).map((p, i) => ({
        id: Date.now() + i,
        validity: String(p.validity),
        price: String(p.price),
      }))
    );
    // Bundle edit — admin replaces the full set of files in one go. Start
    // from an empty row; leaving it empty on save means "keep existing".
    setEditBundleRows(
      item.isPremium
        ? [{ id: Date.now(), categoryName: "", file: null, previewFile: null }]
        : []
    );
    setEditSvgaFile(null);
    setEditPreviewFile(null);
    setEditLogoFile(null);
  };

  const handleCancelEditItem = () => {
    setEditTarget(null);
    setEditPriceRows([]);
    setEditBundleRows([]);
    setEditSvgaFile(null);
    setEditPreviewFile(null);
    setEditLogoFile(null);
  };

  const addEditPriceRow = () =>
    setEditPriceRows((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), validity: "30", price: "" },
    ]);

  const removeEditPriceRow = (id: number) =>
    setEditPriceRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  const updateEditPriceRow = (
    id: number,
    data: Partial<Pick<EditPriceRow, "validity" | "price">>
  ) =>
    setEditPriceRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));

  const addEditBundleRow = () =>
    setEditBundleRows((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        categoryName: "",
        file: null,
        previewFile: null,
      },
    ]);

  const removeEditBundleRow = (id: number) =>
    setEditBundleRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  const updateEditBundleRow = (
    id: number,
    data: Partial<Pick<BundleInputRow, "categoryName" | "file" | "previewFile">>
  ) =>
    setEditBundleRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));

  const handleSaveEditItem = async () => {
    if (!editTarget) return;

    const name = editForm.name.trim();
    if (!name) {
      setFlash({ type: "danger", text: "Item name is required" });
      return;
    }
    if (!editForm.categoryId) {
      setFlash({ type: "danger", text: "Pick a category" });
      return;
    }

    const validPrices = editPriceRows
      .filter((r) => r.validity && Number(r.validity) >= 1 && r.price && Number(r.price) >= 0)
      .map((r) => ({ validity: Number(r.validity), price: Number(r.price) }));

    if (validPrices.length === 0) {
      setFlash({ type: "danger", text: "At least one valid price tier is required" });
      return;
    }

    const privilegeArr = editForm.privilege.trim()
      ? editForm.privilege
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    setIsSavingEdit(true);
    try {
      if (editTarget.isPremium) {
        // Bundle files are optional on update — include them only when the
        // admin has filled in at least one complete row.
        const preparedBundles = editBundleRows
          .filter((r) => r.categoryName && r.file)
          .map((r) => ({
            categoryName: r.categoryName,
            svgaFile: r.file as File,
            previewFile: r.previewFile ?? undefined,
          }));

        await updateStoreItemBatch(editTarget._id, {
          name,
          categoryId: editForm.categoryId,
          prices: validPrices,
          privilege: privilegeArr,
          bundles: preparedBundles.length > 0 ? preparedBundles : undefined,
          logoFile: editLogoFile ?? undefined,
        });
      } else {
        await updateStoreItemSingle(editTarget._id, {
          name,
          categoryId: editForm.categoryId,
          prices: validPrices,
          privilege: privilegeArr,
          svgaFile: editSvgaFile ?? undefined,
          previewFile: editPreviewFile ?? undefined,
          logoFile: editLogoFile ?? undefined,
          canUserBuyThis: editForm.canUserBuyThis,
        });
      }
      setFlash({ type: "success", text: `"${name}" updated successfully` });
      handleCancelEditItem();
      await fetchItems(selectedCategoryId);
    } catch (error: unknown) {
      setFlash({
        type: "danger",
        text: error instanceof Error ? error.message : "Failed to update store item",
      });
    } finally {
      setIsSavingEdit(false);
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
                <li className="breadcrumb-item">Store</li>
                <li className="breadcrumb-item active">Management</li>
              </ol>
            </div>
            <h4 className="page-title">Store Management</h4>
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

      {/* Toolbar — create/manage category and upload item open in modals
          instead of showing the big forms inline. */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
          <i className="ri-folder-add-line me-1"></i>Create / Manage Categories
        </button>
        <button className="btn btn-info text-white" onClick={() => setShowUploadModal(true)}>
          <i className="ri-upload-cloud-2-line me-1"></i>Upload Item
        </button>
      </div>

      {/* Create / Manage Categories Modal */}
      {showCategoryModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-folder-add-line me-2 text-primary"></i>
                  Create / Manage Categories
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={fetchCategories}
                    disabled={isLoadingCategories}
                    title="Refresh categories"
                  >
                    <i className={`ri-refresh-line${isLoadingCategories ? " spin-anim" : ""}`}></i>
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCategoryModal(false)}
                  />
                </div>
              </div>
              <div className="modal-body">
              {flash && (
                <div className={`alert alert-${flash.type} py-2`}>
                  <i className={`me-1 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
                  {flash.text}
                  <button className="btn-close float-end" onClick={() => setFlash(null)} />
                </div>
              )}
              <form onSubmit={handleCreateCategory}>
                {availableCategoryOptions.length > 0 ? (
                  <div className="mb-3">
                    <label className="form-label">Category Title</label>
                    <select
                      className="form-select"
                      value={categoryForm.title}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                    >
                      <option value="">Select a category…</option>
                      {availableCategoryOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Pick from the app&apos;s supported {categoryForm.isPremium ? "premium" : "decoration"} categories.
                    </small>
                  </div>
                ) : (
                  <div className="alert alert-info py-2 fs-13 mb-3">
                    <i className="ri-check-double-line me-1"></i>
                    All {categoryForm.isPremium ? "premium" : "decoration"} categories are already created.
                  </div>
                )}
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isPremiumCategory"
                    checked={categoryForm.isPremium}
                    onChange={(e) =>
                      // Option set differs by premium flag, so reset the
                      // selected title when the toggle flips.
                      setCategoryForm((prev) => ({
                        ...prev,
                        isPremium: e.target.checked,
                        title: "",
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="isPremiumCategory">
                    Mark as premium category (SVIP container)
                  </label>
                </div>
                {availableCategoryOptions.length > 0 && (
                  <button className="btn btn-primary" disabled={isCreatingCategory}>
                    {isCreatingCategory ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="ri-add-line me-1"></i>
                        Create Category
                      </>
                    )}
                  </button>
                )}
              </form>

              <hr />

              <h6 className="mb-2">Current Categories</h6>
              {categories.length === 0 ? (
                <p className="text-muted mb-0">No categories found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th style={{ width: 110 }}>Premium</th>
                        <th className="text-end" style={{ width: 180 }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => {
                        const isEditing = editingCategoryId === cat._id;
                        return (
                          <tr key={cat._id}>
                            <td>
                              {isEditing ? (
                                <input
                                  className="form-control form-control-sm"
                                  value={categoryEditForm.title}
                                  onChange={(e) =>
                                    setCategoryEditForm((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                <span className="fw-semibold">{cat.title}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="form-check form-switch mb-0">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={categoryEditForm.isPremium}
                                    onChange={(e) =>
                                      setCategoryEditForm((prev) => ({
                                        ...prev,
                                        isPremium: e.target.checked,
                                      }))
                                    }
                                  />
                                </div>
                              ) : (
                                <span
                                  className={`badge ${
                                    cat.isPremium ? "bg-warning" : "bg-secondary"
                                  }`}
                                >
                                  {cat.isPremium ? "Premium" : "Normal"}
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              {isEditing ? (
                                <div className="btn-group btn-group-sm" role="group">
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleSaveCategory(cat._id)}
                                    disabled={isSavingCategory}
                                  >
                                    {isSavingCategory ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="ri-check-line" />
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={handleCancelEditCategory}
                                    disabled={isSavingCategory}
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                </div>
                              ) : (
                                <div className="btn-group btn-group-sm" role="group">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleStartEditCategory(cat)}
                                    disabled={editingCategoryId !== null}
                                    title="Rename / toggle premium"
                                  >
                                    <i className="ri-edit-line" />
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteCategoryClick(cat)}
                                    disabled={editingCategoryId !== null}
                                    title="Delete category"
                                  >
                                    <i className="ri-delete-bin-line" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Single Store Item Modal */}
      {showUploadModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-upload-cloud-2-line me-2 text-info"></i>
                  Upload Single Store Item
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUploadModal(false)}
                />
              </div>
              <div className="modal-body">
              {flash && (
                <div className={`alert alert-${flash.type} py-2`}>
                  <i className={`me-1 ${flash.type === "success" ? "ri-check-line" : "ri-error-warning-line"}`}></i>
                  {flash.text}
                  <button className="btn-close float-end" onClick={() => setFlash(null)} />
                </div>
              )}
              {featuredCategories.length === 0 ? (
                <div className="alert alert-warning py-2 mb-0">
                  Create a <strong>frame</strong>, <strong>entry</strong>, or{" "}
                  <strong>party-theme</strong> category first.
                </div>
              ) : (
                <form onSubmit={handleCreateSingleItem}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
                        value={singleForm.name}
                        onChange={(e) =>
                          setSingleForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="e.g. Dragon Frame"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={singleForm.categoryId}
                        onChange={(e) =>
                          setSingleForm((prev) => ({ ...prev, categoryId: e.target.value }))
                        }
                      >
                        {featuredCategories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Validity (days)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        value={singleForm.validity}
                        onChange={(e) =>
                          setSingleForm((prev) => ({ ...prev, validity: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Price (coins)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        value={singleForm.price}
                        onChange={(e) =>
                          setSingleForm((prev) => ({ ...prev, price: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        SVGA File <span className="text-muted small">(optional)</span>
                      </label>
                      <input
                        ref={singleSvgaRef}
                        type="file"
                        className="form-control"
                        accept=".svga,.zip,.json,.webp,.png"
                        onChange={(e) => setSingleFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        Preview Image <span className="text-muted small">(optional)</span>
                      </label>
                      <input
                        ref={singlePreviewRef}
                        type="file"
                        className="form-control"
                        accept=".png,.jpg,.jpeg,.gif,.webp"
                        onChange={(e) => setSinglePreviewFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        Logo Image <span className="text-muted small">(optional)</span>
                      </label>
                      <input
                        ref={singleLogoRef}
                        type="file"
                        className="form-control"
                        accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
                        onChange={(e) => setSingleLogoFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Privileges (comma-separated)</label>
                      <input
                        className="form-control"
                        value={singleForm.privilege}
                        onChange={(e) =>
                          setSingleForm((prev) => ({ ...prev, privilege: e.target.value }))
                        }
                        placeholder="e.g. badge_wear, special_effect"
                      />
                    </div>
                  </div>
                  {/* Buyable-in-store toggle. When OFF the item becomes an
                      exclusive — hidden from the public store list and only
                      reachable via the admin Grant action below. */}
                  <div className="mt-3 form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="singleCanUserBuyThis"
                      checked={singleForm.canUserBuyThis}
                      onChange={(e) =>
                        setSingleForm((prev) => ({
                          ...prev,
                          canUserBuyThis: e.target.checked,
                        }))
                      }
                    />
                    <label
                      className="form-check-label fs-13"
                      htmlFor="singleCanUserBuyThis"
                    >
                      Available in store (users can buy)
                      {!singleForm.canUserBuyThis && (
                        <span className="badge bg-warning-subtle text-warning ms-2">
                          Exclusive — admin grant only
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="mt-3 d-flex justify-content-end gap-2">
                    {(singleFile || singlePreviewFile) && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                          uploadPreview.open({
                            title: `${singleForm.name || "New item"} — Preview`,
                            items: [
                              {
                                label: singleForm.name || "svga",
                                svgaFile: singleFile,
                                previewFile: singlePreviewFile,
                              },
                            ],
                          })
                        }
                      >
                        <i className="ri-eye-line me-1" />
                        Preview SVGA
                      </button>
                    )}
                    <button className="btn btn-info" disabled={isSubmittingSingle}>
                      {isSubmittingSingle ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="ri-upload-cloud-line me-1"></i>
                          Upload Item
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-1">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-list-check-2 me-2 text-primary"></i>
                Store Items by Category
              </h4>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{ minWidth: 240 }}
                >
                  {featuredCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => fetchItems(selectedCategoryId)}
                  disabled={isLoadingItems || !selectedCategoryId}
                >
                  <i className={`ri-refresh-line${isLoadingItems ? " spin-anim" : ""}`}></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              {isLoadingItems ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No store items in this category.
                </div>
              ) : (
                <div className="row g-3">
                  {items.map((item) => {
                    const thumb = item.previewFile || item.logo || "";
                    return (
                      <div key={item._id} className="col-6 col-md-4 col-lg-3">
                        <div
                          className="card h-100 mb-0 border position-relative"
                          onMouseEnter={(e) => {
                            const o = e.currentTarget.querySelector<HTMLElement>(".store-hover-overlay");
                            if (o) o.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            const o = e.currentTarget.querySelector<HTMLElement>(".store-hover-overlay");
                            if (o) o.style.opacity = "0";
                          }}
                        >
                          {/* Thumbnail */}
                          <div
                            className="card-img-top p-2 bg-light d-flex align-items-center justify-content-center position-relative"
                            style={{ height: 120 }}
                          >
                            {thumb ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={thumb}
                                alt={item.name}
                                className="img-fluid"
                                style={{ maxHeight: 108, objectFit: "contain" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M20 7h-4a2 2 0 0 0-4 0H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'/%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <i className="ri-image-line fs-1 text-muted"></i>
                            )}
                            {/* Type badge */}
                            <span
                              className={`badge position-absolute top-0 start-0 m-1 ${item.isPremium ? "bg-warning text-dark" : "bg-info"}`}
                            >
                              {item.isPremium ? "SVIP Bundle" : "Single"}
                            </span>
                          </div>

                          <div className="card-body p-2">
                            <p className="fw-semibold fs-13 mb-1 text-truncate" title={item.name}>
                              {item.name}
                            </p>

                            {/* Exclusive marker — items with canUserBuyThis:false
                                are hidden from the public store list and only
                                reachable via the admin Grant action. */}
                            {item.canUserBuyThis === false && (
                              <div className="mb-1">
                                <span
                                  className="badge bg-warning-subtle text-warning fs-11"
                                  title="Hidden from store — admin grant only"
                                >
                                  <i className="ri-lock-line me-1"></i>Exclusive
                                </span>
                              </div>
                            )}

                            {/* Prices */}
                            {item.prices && item.prices.length > 0 ? (
                              <div className="d-flex flex-wrap gap-1 mb-1">
                                {item.prices.map((p, i) => (
                                  <span key={i} className="badge bg-warning-subtle text-warning fs-11">
                                    <i className="ri-copper-coin-line me-1"></i>
                                    {p.price} / {p.validity}d
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted fs-12 mb-1">No price set</p>
                            )}

                            {/* Privileges */}
                            {item.privilege && item.privilege.length > 0 && (
                              <div className="d-flex flex-wrap gap-1 mb-1">
                                {item.privilege.map((p, i) => (
                                  <span key={i} className="badge bg-light text-dark fs-11">{p}</span>
                                ))}
                              </div>
                            )}

                            {/* Footer stats */}
                            <div className="d-flex justify-content-between align-items-center text-muted fs-11 mt-1">
                              <span title="Total sold">
                                <i className="ri-shopping-bag-line me-1"></i>{item.totalSold ?? 0}
                              </span>
                              {item.isPremium ? (
                                <span title="Bundle files">
                                  <i className="ri-stack-line me-1"></i>
                                  {item.bundleFiles?.length ?? 0} files
                                </span>
                              ) : item.svgaFile ? (
                                <span className="text-success" title="Has SVGA asset">
                                  <i className="ri-film-line me-1"></i>SVGA
                                </span>
                              ) : (
                                <span title="No asset">
                                  <i className="ri-image-line me-1"></i>Image
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover actions */}
                          <div
                            className="store-hover-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center gap-2 rounded"
                            style={{ background: "rgba(0,0,0,0.55)", opacity: 0, transition: "opacity .2s" }}
                          >
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => setPreviewItem(item)}
                              title="Preview SVGA assets"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEditItemClick(item)}
                              title="Edit item"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            {/* Grant — only meaningful for exclusive
                                (non-buyable) non-premium items. Backend rejects
                                otherwise; we hide the button to keep the UI
                                honest. */}
                            {!item.isPremium && item.canUserBuyThis === false && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => openGrantModal(item)}
                                title="Grant to user"
                              >
                                <i className="ri-gift-line"></i>
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteClick(item)}
                              title="Delete item"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
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

      {/* SVGA Preview Modal — for already-saved store items (row click) */}
      <SvgaPreviewModal
        open={previewItem !== null}
        title={
          previewItem
            ? previewItem.bundleFiles && previewItem.bundleFiles.length > 0
              ? `${previewItem.name} — Bundle Preview`
              : `${previewItem.name} — Asset Preview`
            : ""
        }
        entries={previewItem ? buildSvgaPreviewEntries(previewItem) : []}
        onClose={() => setPreviewItem(null)}
      />

      {/* SVGA Preview Modal — for files chosen in the create / edit forms */}
      <SvgaPreviewModal {...uploadPreview.modalProps} />

      {/* Grant Modal — admin sends an exclusive item to a user. */}
      {grantTarget && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="ri-gift-line me-2"></i>
                  Grant Item
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeGrantModal}
                  disabled={isGranting}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Send <strong>{grantTarget.name}</strong> directly to a user&apos;s
                  inventory. No purchase, no coin deduction.
                </p>
                {grantError && (
                  <div className="alert alert-danger py-2 fs-13">
                    <i className="ri-error-warning-line me-1"></i>{grantError}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fs-13">User ID (numeric)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={grantForm.userId}
                    onChange={(e) =>
                      setGrantForm((prev) => ({ ...prev, userId: e.target.value }))
                    }
                    placeholder="e.g. 100018"
                  />
                  <p className="text-muted fs-12 mt-1 mb-0">
                    The user&apos;s short numeric ID (shown on the App User list),
                    not the MongoDB <code>_id</code>.
                  </p>
                </div>
                <div className="mb-0">
                  <label className="form-label fs-13">Validity (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={grantForm.validity}
                    onChange={(e) =>
                      setGrantForm((prev) => ({ ...prev, validity: e.target.value }))
                    }
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeGrantModal}
                  disabled={isGranting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleGrantSubmit}
                  disabled={isGranting}
                >
                  {isGranting ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Granting…</>
                  ) : (
                    <><i className="ri-gift-line me-1"></i>Grant Item</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="ri-error-warning-line me-2"></i>
                  Delete Store Item
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCancelDelete}
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
                      Are you sure you want to delete{" "}
                      <strong>&quot;{deleteEffected.itemName}&quot;</strong>?
                    </p>
                    {deleteEffected.userCount > 0 ? (
                      <div className="alert alert-warning py-2">
                        <i className="ri-alarm-warning-line me-1"></i>
                        <strong>{deleteEffected.userCount}</strong> user(s) currently own this item.
                        Deleting will remove it from their inventory and deselect it if in use.
                      </div>
                    ) : (
                      <div className="alert alert-info py-2">
                        <i className="ri-information-line me-1"></i>
                        No users currently own this item.
                      </div>
                    )}
                    <p className="text-danger mb-0">
                      <small>This action is permanent and cannot be undone. All associated files will also be deleted.</small>
                    </p>
                  </>
                ) : null}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelDelete}
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
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryDeleteTarget && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="ri-error-warning-line me-2"></i>
                  Delete Category
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseCategoryDeleteModal}
                  disabled={isDeletingCategory}
                />
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>&quot;{categoryDeleteTarget.title}&quot;</strong>?
                </p>
                {isLoadingCategoryEffected ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-danger" role="status" />
                    <p className="mt-2 text-muted mb-0">Checking affected items...</p>
                  </div>
                ) : categoryDeleteEffected && categoryDeleteEffected.userCount > 0 ? (
                  <div className="alert alert-warning py-2">
                    <i className="ri-alarm-warning-line me-1"></i>
                    <strong>{categoryDeleteEffected.userCount}</strong> item(s) belong to
                    this category. Deleting will affect them too.
                  </div>
                ) : (
                  <div className="alert alert-info py-2">
                    <i className="ri-information-line me-1"></i>
                    No items are currently using this category.
                  </div>
                )}
                <p className="text-danger mb-0">
                  <small>This action cannot be undone.</small>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCloseCategoryDeleteModal}
                  disabled={isDeletingCategory}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmDeleteCategory}
                  disabled={isDeletingCategory || isLoadingCategoryEffected}
                >
                  {isDeletingCategory ? (
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

      {/* Item Edit Modal */}
      {editTarget && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="ri-edit-line me-2"></i>
                  Edit {editTarget.isPremium ? "SVIP Bundle" : "Store Item"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCancelEditItem}
                  disabled={isSavingEdit}
                />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={editForm.categoryId}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                    >
                      {(editTarget.isPremium ? premiumCategories : normalCategories).map(
                        (cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.title}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Privileges (comma-separated)</label>
                    <input
                      className="form-control"
                      value={editForm.privilege}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, privilege: e.target.value }))
                      }
                      placeholder="e.g. vip_badge, special_effect"
                    />
                  </div>
                  {/* Buyable-in-store toggle. Hidden for premium bundles since
                      premium tiers are always purchase-only and the backend
                      Grant API explicitly rejects them. */}
                  {!editTarget.isPremium && (
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="editCanUserBuyThis"
                          checked={editForm.canUserBuyThis}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              canUserBuyThis: e.target.checked,
                            }))
                          }
                        />
                        <label
                          className="form-check-label fs-13"
                          htmlFor="editCanUserBuyThis"
                        >
                          Available in store (users can buy)
                          {!editForm.canUserBuyThis && (
                            <span className="badge bg-warning-subtle text-warning ms-2">
                              Exclusive — admin grant only
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Price Tiers</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={addEditPriceRow}
                  >
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
                      {editPriceRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min={1}
                              value={row.validity}
                              onChange={(e) =>
                                updateEditPriceRow(row.id, { validity: e.target.value })
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
                                updateEditPriceRow(row.id, { price: e.target.value })
                              }
                            />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeEditPriceRow(row.id)}
                              disabled={editPriceRows.length === 1}
                            >
                              <i className="ri-delete-bin-line" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Single-item file replacement fields */}
                {!editTarget.isPremium && (
                  <div className="row g-3 mt-3">
                    <div className="col-md-4">
                      <label className="form-label">
                        Replace SVGA{" "}
                        <span className="text-muted small">(optional)</span>
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".svga,.zip,.json,.webp,.png"
                        onChange={(e) => setEditSvgaFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        Replace Preview{" "}
                        <span className="text-muted small">(optional)</span>
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".png,.jpg,.jpeg,.gif,.webp"
                        onChange={(e) => setEditPreviewFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        Replace Logo{" "}
                        <span className="text-muted small">(optional)</span>
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
                        onChange={(e) => setEditLogoFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    {/* Preview either the newly selected file or the
                        existing remote SVGA on the item being edited. */}
                    <div className="col-12 text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          uploadPreview.open({
                            title: `${editForm.name || editTarget.name} — Preview`,
                            items: [
                              {
                                label: editForm.name || editTarget.name,
                                svgaFile: editSvgaFile,
                                previewFile: editPreviewFile,
                                svgaUrl: !editSvgaFile ? editTarget.svgaFile : undefined,
                                previewUrl: !editPreviewFile ? editTarget.previewFile : undefined,
                              },
                            ],
                          })
                        }
                      >
                        <i className="ri-eye-line me-1" />
                        Preview SVGA
                      </button>
                    </div>
                  </div>
                )}

                {/* Batch/SVIP logo + bundle replacement fields */}
                {editTarget.isPremium && (
                  <>
                    <div className="row g-3 mt-3">
                      <div className="col-md-4">
                        <label className="form-label">
                          Replace Logo{" "}
                          <span className="text-muted small">(optional)</span>
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
                          onChange={(e) => setEditLogoFile(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    </div>
                    <div className="mt-3 d-flex align-items-center justify-content-between">
                      <h6 className="mb-0">
                        Replace Bundle Files{" "}
                        <span className="text-muted small">
                          (leave empty to keep current)
                        </span>
                      </h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={addEditBundleRow}
                      >
                        <i className="ri-add-line me-1"></i>Add Row
                      </button>
                    </div>
                    <div className="table-responsive mt-2">
                      <table className="table table-sm align-middle mb-0">
                        <thead>
                          <tr>
                            <th style={{ minWidth: 180 }}>Category</th>
                            <th>SVGA File</th>
                            <th>Preview Image</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editBundleRows.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.categoryName}
                                  onChange={(e) =>
                                    updateEditBundleRow(row.id, {
                                      categoryName: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select category</option>
                                  {normalCategories.map((cat) => (
                                    <option key={cat._id} value={cat.title}>
                                      {cat.title}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="file"
                                  className="form-control form-control-sm"
                                  accept=".svga,.zip,.json,.webp,.png"
                                  onChange={(e) =>
                                    updateEditBundleRow(row.id, {
                                      file: e.target.files?.[0] ?? null,
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="file"
                                  className="form-control form-control-sm"
                                  accept=".png,.jpg,.jpeg,.gif,.webp"
                                  onChange={(e) =>
                                    updateEditBundleRow(row.id, {
                                      previewFile: e.target.files?.[0] ?? null,
                                    })
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
                                      <i className="ri-eye-line" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => removeEditBundleRow(row.id)}
                                    disabled={editBundleRows.length === 1}
                                  >
                                    <i className="ri-delete-bin-line" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Preview the whole bundle: newly-selected files for
                        rows the admin has touched, plus existing remote
                        SVGAs for the rest (so the admin sees the final
                        bundle as it'll look after save). */}
                    <div className="text-end mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          // Existing remote bundle keyed by category name so
                          // we can fall back when a row hasn't been touched.
                          const existingByCategory = new Map(
                            (editTarget.bundleFiles ?? []).map((b) => [
                              b.categoryName,
                              b,
                            ])
                          );
                          const items = editBundleRows
                            .filter(
                              (r) => r.categoryName || r.file || r.previewFile
                            )
                            .map((r) => {
                              const existing = existingByCategory.get(
                                r.categoryName
                              );
                              return {
                                label: r.categoryName || "svga",
                                svgaFile: r.file,
                                previewFile: r.previewFile,
                                svgaUrl: !r.file ? existing?.svgaFile : undefined,
                                previewUrl: !r.previewFile
                                  ? existing?.previewFile
                                  : undefined,
                              };
                            });
                          uploadPreview.open({
                            title: `${editForm.name || editTarget.name} — Preview`,
                            items,
                          });
                        }}
                      >
                        <i className="ri-eye-line me-1" />
                        Preview Bundle
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelEditItem}
                  disabled={isSavingEdit}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveEditItem}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line me-1"></i>
                      Save Changes
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
