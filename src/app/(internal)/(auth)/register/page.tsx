"use client";
import { PROJECT_NAME } from "@/lib/constants";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAdmin } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await registerAdmin(username.trim(), email.trim(), password);
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-xxl-3 col-lg-5 col-md-6">
      <div className="auth-brand d-flex align-items-center justify-content-center gap-2 mb-2">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#4f8ef7,#7c4ee4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className="ri-mic-2-line" style={{ color: "#fff", fontSize: 18 }}></i>
        </div>
        <span className="fs-20 fw-bold lh-1">
          <span style={{ color: "#4f8ef7" }}>Adda</span>
          <span style={{ color: "#7c4ee4" }}>Live</span>
        </span>
      </div>

      <p className="fw-semibold mb-4 text-center text-muted fs-15">{PROJECT_NAME} Admin Panel</p>

      <div className="card overflow-hidden text-center p-xxl-4 p-3 mb-0">
        <h4 className="fw-semibold mb-1 fs-18">Register Admin</h4>
        <div className="alert alert-warning py-2 px-3 fs-13 mb-4" role="alert">
          <i className="ri-alert-line me-2"></i>
          Register admin can be register once.
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 fs-13 mb-3" role="alert">
            <i className="ri-error-warning-line me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-start mb-3">
          <div className="mb-3">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="d-grid mt-4">
            <button className="btn btn-primary fw-semibold" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </div>
        </form>

        <p className="text-muted fs-14 mb-0">
          Already have an account?{" "}
          <Link href="/login" className="fw-semibold text-danger ms-1">Sign In !</Link>
        </p>
      </div>

      <p className="mt-4 text-center mb-0 text-muted fs-13">
        {new Date().getFullYear()} &copy; {PROJECT_NAME}
      </p>
    </div>
  );
}
