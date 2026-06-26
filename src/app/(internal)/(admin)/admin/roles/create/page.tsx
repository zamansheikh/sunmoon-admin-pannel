"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPortalUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ALL_PERMISSIONS = [
  { value: "coin-distributor", label: "Coin Distributor", icon: "ri-copper-coin-line" },
  { value: "promote-user", label: "Promote User", icon: "ri-vip-crown-line" },
  { value: "update-users", label: "Update Users", icon: "ri-edit-2-line" },
  { value: "block-user", label: "Block User", icon: "ri-user-forbid-line" },
  { value: "device-ban", label: "Device Ban", icon: "ri-smartphone-line" },
  { value: "live-room-close", label: "Live Room Close", icon: "ri-live-line" },
  { value: "create-user-account", label: "Create User Account", icon: "ri-user-add-line" },
];

// Roles the backend's create-role endpoint accepts. The backend forces
// parentCreator = null ("admin is the sole authority"), so admin creates
// any of these directly — no parent selection needed.
const ADMIN_CREATABLE_ROLES = [
  { value: "sub-admin", label: "Sub Admin" },
  { value: "merchant", label: "Merchant" },
  { value: "re-seller", label: "Reseller" },
  { value: "agency", label: "Agency" },
  { value: "country-admin", label: "Country Admin" },
  { value: "country-sub-admin", label: "Country Sub Admin" },
];

export default function CreateRolePage() {
  const router = useRouter();
  const { user } = useAuth();

  const creatorRole = (user?.userRole ?? "").toLowerCase();
  // Only Admin / SubAdmin may hit the create-role route server-side.
  const canAccessCreateApi = creatorRole === "admin" || creatorRole === "sub-admin";

  const availableRoles = useMemo(() => ADMIN_CREATABLE_ROLES, []);

  const [form, setForm] = useState({
    name: "",
    userId: "",
    password: "",
    designation: "",
    userRole: availableRoles[0]?.value ?? "",
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePerm = (p: string) =>
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const userId = form.userId.trim();
    const password = form.password;
    const designation = form.designation.trim();
    const userRole = form.userRole;

    if (!name || !userId || !password || !designation || !userRole) {
      setError("All fields are required.");
      return;
    }
    if (!canAccessCreateApi) {
      setError("Your account cannot create staff from this backend route.");
      return;
    }
    if (permissions.length === 0) {
      setError("At least one permission is required.");
      return;
    }

    setLoading(true);
    try {
      // No parentCreator — the backend nulls it (admin is sole authority).
      await createPortalUser({
        name,
        userId,
        password,
        designation,
        userRole,
        userPermissions: permissions,
      });
      setSuccess(`Staff "${name}" created successfully!`);
      setTimeout(() => router.push("/admin/roles/all"), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!canAccessCreateApi) {
    return (
      <div className="row justify-content-center mt-4">
        <div className="col-md-6">
          <div className="alert alert-warning text-center py-4">
            <i className="ri-lock-line fs-40 d-block mb-3 opacity-50"></i>
            <h5>Access Restricted</h5>
            <p className="mb-3 text-muted">
              Your account role (<strong>{user?.userRole ?? "Unknown"}</strong>) cannot create staff.
            </p>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
              <i className="ri-arrow-left-line me-1"></i>Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="#">AddaLive</a></li>
                <li className="breadcrumb-item"><a href="/admin/roles/all">Roles</a></li>
                <li className="breadcrumb-item active">Create Role</li>
              </ol>
            </div>
            <h4 className="page-title">Create New Staff</h4>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title mb-0">
                <i className="ri-user-add-line me-2 text-primary"></i>
                New Staff / Role
              </h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => router.push("/admin/roles/all")}>
                <i className="ri-arrow-left-line me-1"></i>Back to All Roles
              </button>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger py-2 fs-13">
                  <i className="ri-error-warning-line me-2"></i>{error}
                </div>
              )}
              {success && (
                <div className="alert alert-success py-2 fs-13">
                  <i className="ri-checkbox-circle-line me-2"></i>{success}
                </div>
              )}

              <div className="alert alert-info py-2 fs-13 mb-3">
                <i className="ri-information-line me-2"></i>
                Admin can create Sub Admin, Merchant, Reseller, Agency, Country Admin and
                Country Sub Admin directly — no parent creator required.
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">User ID (Login ID) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. john_admin"
                      value={form.userId}
                      onChange={(e) => set("userId", e.target.value)}
                      disabled={loading}
                    />
                    <small className="text-muted">This ID is used to sign in.</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Password <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        type={showPw ? "text" : "password"}
                        className="form-control"
                        placeholder="Set a strong password"
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="input-group-text btn-light"
                        onClick={() => setShowPw((v) => !v)}
                      >
                        <i className={showPw ? "ri-eye-off-line" : "ri-eye-line"}></i>
                      </button>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Designation <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bangladesh Region Admin"
                      value={form.designation}
                      onChange={(e) => set("designation", e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Role <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={form.userRole}
                      onChange={(e) => set("userRole", e.target.value)}
                      disabled={loading}
                    >
                      {availableRoles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Permissions <span className="text-danger">*</span></label>
                    <div className="row g-3">
                      {ALL_PERMISSIONS.map((perm) => {
                        const active = permissions.includes(perm.value);
                        return (
                          <div className="col-sm-6 col-lg-4" key={perm.value}>
                            <div
                              className={`d-flex align-items-start gap-3 p-3 rounded border h-100 ${
                                active ? "border-primary bg-primary text-white" : "border-light"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => togglePerm(perm.value)}
                            >
                              <div className="form-check mt-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`perm-${perm.value}`}
                                  checked={active}
                                  onChange={() => togglePerm(perm.value)}
                                  disabled={loading}
                                />
                              </div>
                              <label
                                htmlFor={`perm-${perm.value}`}
                                className={`form-check-label d-flex align-items-start gap-2 flex-grow-1 ${active ? "fw-semibold" : ""}`}
                                style={{ cursor: "pointer" }}
                              >
                                <i className={`${perm.icon} fs-18 flex-shrink-0 mt-1`}></i>
                                <span className="flex-grow-1">{perm.label}</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <small className="text-muted mt-1 d-block">
                      {permissions.length} permission(s) selected
                    </small>
                  </div>

                  <div className="col-12 d-flex gap-2 mt-2">
                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                      ) : (
                        <><i className="ri-user-add-line me-2"></i>Create Staff</>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => router.push("/admin/roles/all")}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
