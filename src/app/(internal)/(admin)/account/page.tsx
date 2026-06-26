"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateAdminProfile, updatePortalUserProfile, assignCoinToAdmin } from "@/lib/api";

export default function AccountPage() {
  const { user, updateUser } = useAuth();

  const isAdmin = user?.userRole?.toLowerCase() === "admin";

  // ── form state ────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(user?.username ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ── Coin generation state ─────────────────────────────────────────────
  const [coinAmount, setCoinAmount] = useState("");
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinSuccess, setCoinSuccess] = useState("");
  const [coinError, setCoinError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = user?.username ?? user?.name ?? "User";
  const displayRole = user?.designation ?? user?.userRole ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  // ── avatar pick ───────────────────────────────────────────────────────────
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password && password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Build payload — only include changed / filled fields
    if (isAdmin) {
      const payload: { username?: string; email?: string; password?: string; avatar?: File } = {};
      if (username && username !== user?.username) payload.username = username;
      if (email && email !== user?.email) payload.email = email;
      if (password) payload.password = password;
      if (avatarFile) payload.avatar = avatarFile;

      if (Object.keys(payload).length === 0) {
        setError("No changes to save.");
        return;
      }
      setSaving(true);
      try {
        const updated = await updateAdminProfile(payload);
        // merge into stored user (backend may return partial object)
        const merged = { ...user!, ...updated };
        updateUser(merged);
        setPassword("");
        setConfirmPw("");
        setAvatarFile(null);
        setSuccess("Profile updated successfully.");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Update failed.");
      } finally {
        setSaving(false);
      }
    } else {
      // Portal user
      const hasChange = (name && name !== user?.name) || !!password || !!avatarFile;
      if (!hasChange) {
        setError("No changes to save.");
        return;
      }
      const payload: { name?: string; password?: string; avatar?: File } = {};
      if (name && name !== user?.name) payload.name = name;
      if (password) payload.password = password;
      if (avatarFile) payload.avatar = avatarFile;

      setSaving(true);
      try {
        const updated = await updatePortalUserProfile(payload);
        const merged = { ...user!, ...updated };
        updateUser(merged);
        setPassword("");
        setConfirmPw("");
        setAvatarFile(null);
        setSuccess("Profile updated successfully.");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Update failed.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAssignCoins = async (e: FormEvent) => {
    e.preventDefault();
    setCoinError("");
    setCoinSuccess("");
    const n = Number(coinAmount);
    if (!coinAmount || isNaN(n) || n <= 0) {
      setCoinError("Enter a valid positive number.");
      return;
    }
    setCoinLoading(true);
    try {
      const updated = await assignCoinToAdmin(n);
      const merged = { ...user!, ...updated };
      updateUser(merged);
      setCoinAmount("");
      setCoinSuccess(`${n.toLocaleString()} coins added! New balance: ${(merged.coins ?? 0).toLocaleString()}`);
    } catch (err: unknown) {
      setCoinError(err instanceof Error ? err.message : "Failed to assign coins.");
    } finally {
      setCoinLoading(false);
    }
  };

  return (
    <>
      {/* Page title */}
      <div className="page-title-box d-flex align-items-center justify-content-between">
        <h4 className="mb-0 fw-semibold">My Account</h4>
        <div className="page-title-right">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><a href="/dashboard">AddaLive</a></li>
            <li className="breadcrumb-item active">My Account</li>
          </ol>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Profile card ───────────────────────────────────────────────── */}
        <div className="col-xl-4 col-lg-5">
          <div className="card text-center h-100 border shadow-sm">
            <div className="card-body p-4 d-flex flex-column justify-content-center align-items-center">
              {/* Avatar */}
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="rounded-circle mb-3"
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
              ) : (
                <span
                  className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white mb-3"
                  style={{ width: 96, height: 96, background: "linear-gradient(135deg,#4f8ef7,#7c4ee4)", fontSize: 32 }}
                >
                  {initials}
                </span>
              )}

              <h5 className="mb-1 fw-semibold">{displayName}</h5>
              <p className="text-muted mb-1 fs-14">{displayRole}</p>
              {user?.email && <p className="text-muted mb-0 fs-13">{user.email}</p>}
              {user?.userId && <p className="text-muted mb-0 fs-13">ID: {user.userId}</p>}

              {/* Coins badge */}
              {user?.coins !== undefined && (
                <div className="mt-3">
                  <span className="badge bg-warning-subtle text-warning fs-13 px-3 py-2">
                    <i className="ri-copper-coin-line me-1"></i>
                    {user.coins.toLocaleString()} Coins
                  </span>
                </div>
              )}

              {/* Permissions */}
              {user?.userPermissions && user.userPermissions.length > 0 && (
                <div className="mt-3 text-start">
                  <p className="text-muted fs-12 fw-semibold mb-2 text-uppercase">Permissions</p>
                  <div className="d-flex flex-wrap gap-1">
                    {user.userPermissions.map((p) => (
                      <span key={p} className="badge bg-primary-subtle text-primary fs-11">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit form ──────────────────────────────────────────────────── */}
        <div className="col-xl-8 col-lg-7">
          <div className="card h-100 mb-0 border shadow-sm">
            <div className="card-header border-bottom bg-transparent">
              <h5 className="card-title mb-0 fw-semibold">
                <i className="ri-edit-2-line me-2 text-primary"></i>Edit Profile
              </h5>
            </div>
            <div className="card-body d-flex flex-column">

              {success && (
                <div className="alert alert-success d-flex align-items-center py-2 px-3 fs-13 mb-4">
                  <i className="ri-checkbox-circle-line me-2 fs-16"></i>{success}
                </div>
              )}
              {error && (
                <div className="alert alert-danger d-flex align-items-center py-2 px-3 fs-13 mb-4">
                  <i className="ri-error-warning-line me-2 fs-16"></i>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex-grow-1 d-flex flex-column">
                <div className="flex-grow-1">

                  {/* ── Avatar upload ── */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Profile Picture</label>
                    <div className="d-flex align-items-center gap-3">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="preview"
                          className="rounded-circle"
                          style={{ width: 60, height: 60, objectFit: "cover" }}
                        />
                      ) : (
                        <span
                          className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: 60, height: 60, background: "linear-gradient(135deg,#4f8ef7,#7c4ee4)", fontSize: 20 }}
                        >
                          {initials}
                        </span>
                      )}
                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => fileRef.current?.click()}
                        >
                          <i className="ri-upload-2-line me-1"></i>Choose Photo
                        </button>
                        {avatarFile && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-danger ms-2"
                            onClick={() => { setAvatarFile(null); setAvatarPreview(user?.avatar ?? null); }}
                          >
                            Remove
                          </button>
                        )}
                        <p className="text-muted fs-12 mb-0 mt-1">JPG, PNG or GIF · Max 2MB</p>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                <div className="row g-3">

                  {/* Username (admin only) */}
                  {isAdmin && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="acc-username">
                        Username
                      </label>
                      <input
                        id="acc-username"
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                      />
                    </div>
                  )}

                  {/* Display name (portal user only) */}
                  {!isAdmin && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="acc-name">
                        Display Name
                      </label>
                      <input
                        id="acc-name"
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter display name"
                      />
                    </div>
                  )}

                  {/* Email (admin only) */}
                  {isAdmin && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="acc-email">
                        Email Address
                      </label>
                      <input
                        id="acc-email"
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                  )}

                  {/* Role (read-only) */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Role</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={displayRole}
                      readOnly
                    />
                  </div>

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="acc-pw">
                      New Password <span className="text-muted fw-normal">(leave blank to keep current)</span>
                    </label>
                    <div className="input-group">
                      <input
                        id="acc-pw"
                        type={showPw ? "text" : "password"}
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="input-group-text"
                        onClick={() => setShowPw((v) => !v)}
                        tabIndex={-1}
                      >
                        <i className={showPw ? "ri-eye-off-line" : "ri-eye-line"}></i>
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="acc-cpw">
                      Confirm Password
                    </label>
                    <input
                      id="acc-cpw"
                      type={showPw ? "text" : "password"}
                      className="form-control"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div> {/* Close row g-3 */}
              </div> {/* Close flex-grow-1 div */}

              <div className="mt-auto pt-4 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary px-4 shadow-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line me-1"></i>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-light px-4"
                  onClick={() => {
                    setUsername(user?.username ?? "");
                    setName(user?.name ?? "");
                    setEmail(user?.email ?? "");
                    setPassword("");
                    setConfirmPw("");
                    setAvatarFile(null);
                    setAvatarPreview(user?.avatar ?? null);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Reset
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Coin Generation (admin only) ─────────────────────────────── */}
      {isAdmin && (
        <div className="row mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0 fw-semibold">
                  <i className="ri-copper-coin-line me-2 text-warning"></i>Coin Wallet
                </h5>
                <span className="badge bg-warning-subtle text-warning fs-13 px-3 py-2">
                  <i className="ri-copper-coin-line me-1"></i>
                  Balance: <strong className="ms-1">{(user?.coins ?? 0).toLocaleString()}</strong>
                </span>
              </div>
              <div className="card-body">
                <p className="text-muted fs-13 mb-3">
                  Generate coins and add them directly to your admin wallet. These coins can be used for platform operations.
                </p>

                {coinSuccess && (
                  <div className="alert alert-success d-flex align-items-center py-2 px-3 fs-13 mb-3">
                    <i className="ri-checkbox-circle-line me-2 fs-16"></i>{coinSuccess}
                  </div>
                )}
                {coinError && (
                  <div className="alert alert-danger d-flex align-items-center py-2 px-3 fs-13 mb-3">
                    <i className="ri-error-warning-line me-2 fs-16"></i>{coinError}
                  </div>
                )}

                <form onSubmit={handleAssignCoins} className="d-flex align-items-end gap-3 flex-wrap">
                  <div style={{ minWidth: 220 }}>
                    <label className="form-label fw-semibold" htmlFor="coin-amount">
                      Amount to Generate
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="ri-copper-coin-line text-warning"></i>
                      </span>
                      <input
                        id="coin-amount"
                        type="number"
                        min="1"
                        className="form-control"
                        placeholder="e.g. 1000"
                        value={coinAmount}
                        onChange={(e) => setCoinAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Quick presets */}
                  <div>
                    <label className="form-label fw-semibold d-block">Quick Add</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {[100, 1000, 5000, 10000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => setCoinAmount(String(preset))}
                        >
                          +{preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-warning px-4"
                    disabled={coinLoading}
                  >
                    {coinLoading
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing…</>
                      : <><i className="ri-add-circle-line me-1"></i>Generate Coins</>
                    }
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
