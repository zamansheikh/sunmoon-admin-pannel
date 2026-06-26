"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  pageTitle?: string;
}

export default function Topbar({ pageTitle = "Dashboard" }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const displayName = user?.username ?? user?.name ?? "Admin";
  const displayRole = user?.userRole ?? "admin";

  return (
    <>
    <header className="app-topbar" id="header">
      <div className="page-container topbar-menu">
        {/* ── Left ─────────────────────────────────────────────────────── */}
        <div className="d-flex align-items-center gap-2">
          {/* Brand Logo (visible on mobile) */}
          <Link href="/dashboard" className="logo">
            <span className="logo-light">
              <span className="logo-lg"><BrandLogo variant="full" /></span>
              <span className="logo-sm"><BrandLogo variant="icon" /></span>
            </span>
            <span className="logo-dark">
              <span className="logo-lg"><BrandLogo variant="full" /></span>
              <span className="logo-sm"><BrandLogo variant="icon" /></span>
            </span>
          </Link>

          {/* Sidebar Toggle — app.js attaches the real handler via .sidenav-toggle-button */}
          <button className="sidenav-toggle-button px-2">
            <i className="ri-menu-5-line fs-24"></i>
          </button>

          {/* Page Title */}
          <div className="topbar-item d-none d-md-flex px-2">
            <h4 className="page-title fs-20 fw-semibold mb-0">{pageTitle}</h4>
          </div>
        </div>

        {/* ── Right ────────────────────────────────────────────────────── */}
        <div className="d-flex align-items-center gap-2">
          {/* Search trigger — small screens */}
          <div className="topbar-item d-flex d-xl-none">
            <button
              className="topbar-link"
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#searchModal"
            >
              <i className="ri-search-line fs-22"></i>
            </button>
          </div>

          {/* Search trigger — desktop */}
          <div
            className="topbar-search text-muted d-none d-xl-flex gap-2 me-2 align-items-center"
            style={{ cursor: "pointer" }}
            data-bs-toggle="modal"
            data-bs-target="#searchModal"
            role="button"
          >
            <i className="ri-search-line fs-18"></i>
            <span className="me-2">Search something..</span>
          </div>



          {/* Notifications */}
          <div className="topbar-item">
            <div className="dropdown">
              <button
                className="topbar-link dropdown-toggle drop-arrow-none"
                data-bs-toggle="dropdown"
                data-bs-offset="0,25"
                type="button"
                data-bs-auto-close="outside"
              >
                <i className="ri-notification-snooze-line animate-ring fs-22"></i>
                <span className="noti-icon-badge"></span>
              </button>
              <div className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg" style={{ minHeight: 300, maxWidth: "calc(100vw - 20px)" }}>
                <div className="p-2 border-bottom border-dashed">
                  <div className="row align-items-center">
                    <div className="col">
                      <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                    </div>
                    <div className="col-auto">
                      <a href="#" className="text-muted fs-13">Mark all as read</a>
                    </div>
                  </div>
                </div>
                <div className="position-relative rounded-0" style={{ maxHeight: 300 }} data-simplebar>
                  {[
                    { id: 1, avatar: "avatar-2.jpg", msg: <>Glady Haid commented on <strong>AddaVoiceRoom admin status</strong></>, time: "25m ago", active: true },
                    { id: 2, avatar: "avatar-4.jpg", msg: <>Tommy Berry donated <span className="text-success">$100.00</span></>, time: "58m ago", active: false },
                    { id: 3, avatar: "avatar-7.jpg", msg: <>Richard Allen followed you</>, time: "3h ago", active: false },
                  ].map((n) => (
                    <div key={n.id} className={`dropdown-item notification-item py-2 text-wrap${n.active ? " active" : ""}`}>
                      <span className="d-flex align-items-center">
                        <span className="me-3 position-relative flex-shrink-0">
                          <Image src={`/assets/images/users/${n.avatar}`} width={36} height={36} className="avatar-lg rounded-circle" alt="" />
                        </span>
                        <span className="flex-grow-1 text-muted">
                          {n.msg}<br />
                          <span className="fs-12">{n.time}</span>
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <a href="#" className="dropdown-item text-center text-reset text-decoration-underline fw-bold border-top border-light py-2">
                  View All
                </a>
              </div>
            </div>
          </div>

          {/* Dark / Light mode */}
          <div className="topbar-item d-flex">
            <button className="topbar-link" id="light-dark-mode" type="button">
              <i className="ri-moon-line light-mode-icon fs-22"></i>
              <i className="ri-sun-line dark-mode-icon fs-22"></i>
            </button>
          </div>

          {/* User Dropdown */}
          <div className="topbar-item nav-user">
            <div className="dropdown">
              <a
                className="topbar-link dropdown-toggle drop-arrow-none px-2"
                data-bs-toggle="dropdown"
                data-bs-offset="0,25"
                href="#"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    width={32}
                    height={32}
                    className="rounded-circle me-lg-2 d-flex"
                    alt="user-image"
                  />
                ) : (
                  <div
                    className="rounded-circle me-lg-2 d-flex bg-primary bg-opacity-15 align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
                    style={{ width: 32, height: 32, fontSize: 13 }}
                  >
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <span className="d-lg-flex flex-column gap-0 d-none">
                  <h5 className="my-0 lh-1">{displayName}</h5>
                  <small className="text-muted fs-11 text-capitalize">{displayRole}</small>
                </span>
                <i className="ri-arrow-down-s-line d-none d-lg-block align-middle ms-1"></i>
              </a>
              <div className="dropdown-menu dropdown-menu-end" style={{ minWidth: 240, maxWidth: "calc(100vw - 16px)" }}>
                <div className="dropdown-header noti-title px-3 py-2">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="overflow-hidden">
                      <h6 className="text-truncate m-0">Welcome, {displayName}!</h6>
                      <small className="text-muted text-capitalize">{displayRole}</small>
                    </div>
                    <div className="d-flex align-items-center gap-1 px-2 py-1 rounded flex-shrink-0" style={{ background: "var(--bs-warning-bg-subtle, rgba(255,193,7,.15))" }}>
                      <i className="ri-copper-coin-line text-warning fs-14"></i>
                      <span className="fw-semibold fs-12 text-warning lh-1">
                        {(() => {
                          const n = user?.coins ?? 0;
                          return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
                            : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
                            : n.toLocaleString();
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider mb-0"></div>
                <Link href="/account" className="dropdown-item">
                  <i className="ri-account-circle-line me-1 fs-16 align-middle"></i>
                  <span className="align-middle">My Account</span>
                </Link>
                <Link href="/admin/roles/all" className="dropdown-item">
                  <i className="ri-admin-line me-1 fs-16 align-middle"></i>
                  <span className="align-middle">Roles &amp; Permissions</span>
                </Link>
                <a href="#" className="dropdown-item">
                  <i className="ri-settings-2-line me-1 fs-16 align-middle"></i>
                  <span className="align-middle">Settings</span>
                </a>
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  className="dropdown-item fw-semibold text-danger w-100 text-start border-0 bg-transparent"
                  onClick={handleLogout}
                >
                  <i className="ri-logout-box-line me-1 fs-16 align-middle"></i>
                  <span className="align-middle">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Search Modal — outside <header> so Bootstrap modal z-index works correctly */}
    <div
      className="modal fade"
      id="searchModal"
      tabIndex={-1}
      aria-labelledby="searchModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-transparent">
          <form>
            <div className="card mb-1">
              <div className="px-3 py-2 d-flex flex-row align-items-center" id="top-search">
                <i className="ri-search-line fs-22 me-2"></i>
                <input
                  type="search"
                  className="form-control border-0"
                  id="search-modal-input"
                  placeholder="Search for actions, people, pages..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn p-0 ms-2 text-muted"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  [esc]
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
