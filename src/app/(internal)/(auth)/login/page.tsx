"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { PROJECT_NAME, APP_LOGO } from "@/lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const { login, isLoggedIn, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [successMsg, setSuccessMsg] = useState("");

  // Already signed in? Don't show the form — bounce straight to the
  // dashboard. Full reload so the admin shell scripts initialize.
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      window.location.replace("/dashboard");
    }
  }, [authLoading, isLoggedIn]);

  const [loginMode, setLoginMode] = useState<"admin" | "portal">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isPortalLogin = loginMode === "portal";

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccessMsg("Admin registered successfully! You can now sign in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!username.trim() || !password.trim()) {
      setError(`${isPortalLogin ? "User ID" : "Username"} and password are required.`);
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password, loginMode);
      // Full page navigation so app.js / ThemeCustomizer re-initialize on the
      // admin layout (client-side router.replace skips script execution).
      window.location.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Show a spinner (not the form) while the session is rehydrating or
  // while we're redirecting an already-logged-in user to the dashboard.
  if (authLoading || isLoggedIn) {
    return (
      <div className="col-xxl-4 col-lg-5 col-md-7 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Redirecting…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="col-xxl-4 col-lg-5 col-md-7">
      {/* ── Brand ── */}
      <div className="auth-brand d-flex align-items-center justify-content-center gap-2 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={APP_LOGO}
          alt={PROJECT_NAME}
          width={42}
          height={42}
          style={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            objectFit: "cover",
            boxShadow: "0 6px 20px rgba(124,78,228,0.25)",
            flexShrink: 0,
          }}
        />
        <span className="fs-20 fw-bold lh-1 text-primary">
          {PROJECT_NAME}
        </span>
      </div>

      <p className="fw-semibold mb-4 text-center text-muted fs-14">
        {PROJECT_NAME} Admin Panel
      </p>

      {/* ── Card ── */}
      <div className="card overflow-hidden p-xxl-4 p-3 mb-0">
        <h4 className="fw-semibold mb-1 fs-18 text-center">Sign in to continue</h4>
        <p className="text-muted text-center fs-13 mb-4">
          Enter your credentials to access the dashboard
        </p>

        <div className="mb-3">
          <div className="btn-group w-100" role="group" aria-label="Login mode">
            <button
              type="button"
              className={`btn ${loginMode === "admin" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setLoginMode("admin")}
              disabled={loading}
            >
              <i className="ri-shield-star-line me-1"></i>
              Super Admin
            </button>
            <button
              type="button"
              className={`btn ${loginMode === "portal" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setLoginMode("portal")}
              disabled={loading}
            >
              <i className="ri-user-settings-line me-1"></i>
              Portal User
            </button>
          </div>
          <p className="text-muted fs-12 mt-2 mb-0">
            {isPortalLogin
              ? "Portal users sign in with User ID and restricted access."
              : "Super admin sign-in gives full portal access."}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 fs-13 mb-3" role="alert">
            <i className="ri-error-warning-line me-2"></i>{error}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success py-2 px-3 fs-13 mb-3" role="alert">
            <i className="ri-check-line me-2"></i>{successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-start">
          {/* Username */}
          <div className="mb-3">
            <label className="form-label fw-semibold" htmlFor="lf-username">
              {isPortalLogin ? "Portal User ID" : "Username or Email"}
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className={isPortalLogin ? "ri-id-card-line text-muted" : "ri-user-3-line text-muted"}></i>
              </span>
              <input
                type="text"
                id="lf-username"
                className="form-control border-start-0 ps-0"
                placeholder={isPortalLogin ? "Enter portal user ID" : "Username or email address"}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label fw-semibold mb-0" htmlFor="lf-password">
                Password
              </label>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none fs-12 text-muted"
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="ri-lock-2-line text-muted"></i>
              </span>
              <input
                type={showPw ? "text" : "password"}
                id="lf-password"
                className="form-control border-start-0 border-end-0 ps-0"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input-group-text bg-light"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                title={showPw ? "Hide password" : "Show password"}
              >
                <i className={showPw ? "ri-eye-off-line text-muted" : "ri-eye-line text-muted"}></i>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="d-grid mt-4">
            <button
              className="btn btn-primary fw-semibold"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing in…
                </>
              ) : (
                <><i className="ri-login-box-line me-2"></i>Sign In</>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          {loginMode === "admin" ? (
            <p className="text-muted fs-13 mb-0">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="fw-semibold text-primary ms-1">Register Admin</Link>
            </p>
          ) : (
            <p className="text-muted fs-13 mb-0">
              Portal user accounts are created by admin from Role &amp; Permission.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-muted fs-12 mb-0">
        {new Date().getFullYear()} &copy; AddaLive &mdash; Powered by{" "}
        <span className="fw-semibold">AddaLive Backend</span>
      </p>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowForgot(false)}
          />
          <div
            className="modal fade show d-block"
            style={{ zIndex: 1050 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-semibold">
                    <i className="ri-lock-password-line me-2 text-warning"></i>
                    Reset Password
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowForgot(false)}
                  />
                </div>
                <div className="modal-body pt-2">
                  <div className="text-center mb-3">
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "rgba(255,193,7,0.15)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 30,
                      }}
                    >
                      <i className="ri-customer-service-2-line text-warning"></i>
                    </div>
                  </div>
                  <p className="text-center mb-2">
                    <strong>Password reset is not self-service.</strong>
                  </p>
                  <p className="text-muted text-center fs-13 mb-3">
                    The AddaLive backend does not currently support unauthenticated password resets.
                    To regain access, please contact a system administrator who can update your password from the portal.
                  </p>
                  <div className="alert alert-light border fs-13 py-2 mb-0">
                    <i className="ri-information-line me-2 text-primary"></i>
                    <strong>For Admins:</strong> Go to <em>Account Settings → Change Password</em> once logged in. For locked-out accounts, ask your super admin to update the password via the database.
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowForgot(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="col-xxl-4 col-lg-5 col-md-7 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
