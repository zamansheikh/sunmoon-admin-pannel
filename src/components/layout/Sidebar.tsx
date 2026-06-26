"use client";

import Link from "next/link";
import Image from "next/image";
import BrandLogo from "./BrandLogo";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation, isSection, NavEntry, NavItem } from "@/lib/navigation";
import { useAuth } from "@/context/AuthContext";

const USER_MENU_PERMISSIONS = new Set([
  "promote-user",
  "update-users",
  "block-user",
  "device-ban",
  "coin-distributor",
]);

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function canCreatePortalUsers(role: string): boolean {
  return ["sub-admin"].includes(role);
}

function canViewCreatedUsers(role: string, permissions: Set<string>): boolean {
  if (
    [
      "sub-admin",
      "merchant",
      "re-seller",
      "agency",
      "country-admin",
      "country-sub-admin",
    ].includes(role)
  ) {
    return true;
  }
  return permissions.has("create-user-account") || permissions.has("coin-distributor");
}

function canAccessUserManagement(role: string, permissions: Set<string>): boolean {
  if (["sub-admin", "merchant", "re-seller", "country-admin"].includes(role)) return true;
  for (const p of USER_MENU_PERMISSIONS) {
    if (permissions.has(p)) return true;
  }
  return false;
}

function getNavigationForUser(user: { userRole?: string; userPermissions?: string[] } | null): NavEntry[] {
  const role = normalize(user?.userRole);
  const permissions = new Set((user?.userPermissions ?? []).map((p) => normalize(p)));

  // Super admin keeps the full left navigation.
  if (role === "admin") return navigation;

  // Sub Admin sees everything an admin does EXCEPT Staff Management
  // (they can't manage staff). Coin-to-user is blocked at the action
  // level on the User page, not via the menu.
  if (role === "sub-admin") {
    return navigation.filter(
      (entry) => isSection(entry) || (entry as NavItem).id !== "sidebarStaff"
    );
  }

  const allowedHrefs = new Set<string>(["/dashboard"]);
  if (canAccessUserManagement(role, permissions)) {
    allowedHrefs.add("/admin/users/all");
  }
  if (canCreatePortalUsers(role)) {
    allowedHrefs.add("/admin/roles/create");
  }
  if (canViewCreatedUsers(role, permissions)) {
    allowedHrefs.add("/admin/roles/subadmins");
  }

  const filtered: NavEntry[] = [];

  for (const entry of navigation) {
    if (isSection(entry)) {
      filtered.push(entry);
      continue;
    }

    if (!entry.children) {
      if (entry.href && allowedHrefs.has(entry.href)) {
        filtered.push(entry);
      }
      continue;
    }

    const children = entry.children.filter((child) => child.href && allowedHrefs.has(child.href));
    if (children.length > 0) {
      filtered.push({ ...entry, children });
    }
  }

  // Clean up empty or duplicate section titles after filtering.
  const normalized: NavEntry[] = [];
  let previousWasSection = true;

  for (const entry of filtered) {
    if (isSection(entry)) {
      if (!previousWasSection) {
        normalized.push(entry);
        previousWasSection = true;
      }
      continue;
    }

    normalized.push(entry);
    previousWasSection = false;
  }

  if (normalized.length > 0 && isSection(normalized[normalized.length - 1])) {
    normalized.pop();
  }

  return normalized;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { user, logout } = useAuth();
  const visibleNavigation = getNavigationForUser(user);

  const displayName = user?.username ?? user?.name ?? "User";
  const displayRole = user?.designation ?? user?.userRole ?? "Admin";
  const avatarUrl = user?.avatar ?? null;
  const initials = displayName.slice(0, 2).toUpperCase();
  const coins = user?.coins ?? 0;
  const formatCoins = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
    : n.toString();

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    window.location.replace("/login");
  };

  const toggle = (id: string) =>
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));

  const isActive = (href?: string) => href === pathname;

  const hasActiveChild = (children?: NavItem[]): boolean =>
    !!children?.some((c) => isActive(c.href));

  return (
    <div className="sidenav-menu">
      {/* Brand Logo */}
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

      {/* Hover toggle */}
      <button className="button-sm-hover">
        <i className="ri-circle-line align-middle"></i>
      </button>

      {/* Full sidebar toggle */}
      <button className="sidenav-toggle-button">
        <i className="ri-menu-5-line fs-20"></i>
      </button>

      {/* Close full sidebar on mobile */}
      <button className="button-close-fullsidebar">
        <i className="ti ti-x align-middle"></i>
      </button>

      <div data-simplebar>
        {/* User Block */}
        <div className="sidenav-user">
          <div className="dropdown-center text-center">
            <a
              className="topbar-link dropdown-toggle text-reset drop-arrow-none px-2"
              data-bs-toggle="dropdown"
              href="#"
              aria-haspopup="false"
              aria-expanded="false"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  width={46}
                  height={46}
                  className="rounded-circle"
                  alt="user-image"
                />
              ) : (
                <span
                  className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
                  style={{ width: 46, height: 46, background: "linear-gradient(135deg,#4f8ef7,#7c4ee4)", fontSize: 16 }}
                >
                  {initials}
                </span>
              )}
              <span className="d-flex justify-content-center gap-1 sidenav-user-name my-2">
                <span>
                  <span className="mb-0 fw-semibold lh-base fs-15">{displayName}</span>
                  <p className="my-0 fs-13 text-muted">{displayRole}</p>
                </span>
                <i className="ri-arrow-down-s-line d-block sidenav-user-arrow align-middle"></i>
              </span>
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <div className="dropdown-header noti-title">
                <h6 className="text-overflow m-0">Welcome, {displayName}!</h6>
                <div className="d-flex align-items-center gap-1 mt-1">
                  <i className="ri-copper-coin-line text-warning fs-14"></i>
                  <span className="fs-13 fw-semibold text-warning">{formatCoins(coins)}</span>
                  <span className="text-muted fs-12">coins</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <a href="/account" className="dropdown-item">
                <i className="ri-account-circle-line me-1 fs-16 align-middle"></i>
                <span className="align-middle">My Account</span>
              </a>
              <a href="#" className="dropdown-item">
                <i className="ri-settings-2-line me-1 fs-16 align-middle"></i>
                <span className="align-middle">Settings</span>
              </a>
              <div className="dropdown-divider"></div>
              <a href="#" className="dropdown-item active fw-semibold text-danger" onClick={handleSignOut}>
                <i className="ri-logout-box-line me-1 fs-16 align-middle"></i>
                <span className="align-middle">Sign Out</span>
              </a>
            </div>
          </div>
        </div>

        {/* Side Nav Menu */}
        <ul className="side-nav">
          {visibleNavigation.map((entry, idx) => {
            if (isSection(entry)) {
              return (
                <li key={idx} className="side-nav-title mt-2">
                  {entry.sectionTitle}
                </li>
              );
            }

            const item = entry as NavItem;

            // ── Leaf item (no children) ──────────────────────────────────
            if (!item.children) {
              return (
                <li key={idx} className={`side-nav-item${isActive(item.href) ? " active" : ""}`}>
                  <Link href={item.href ?? "#"} className="side-nav-link">
                    <span className="menu-icon"><i className={item.icon}></i></span>
                    <span className="menu-text"> {item.title} </span>
                    {item.badge && (
                      <span className={`badge ${item.badge.cls} rounded-pill`}>
                        {item.badge.text}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }

            // ── Collapsible item ─────────────────────────────────────────
            const menuId = item.id ?? `menu-${idx}`;
            const activeChild = hasActiveChild(item.children);
            const isOpen = openMenus[menuId] ?? activeChild;

            return (
              <li key={idx} className={`side-nav-item${activeChild ? " active" : ""}`}>
                <a
                  href={`#${menuId}`}
                  className="side-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(menuId);
                  }}
                  aria-expanded={isOpen}
                  aria-controls={menuId}
                >
                  <span className="menu-icon"><i className={item.icon}></i></span>
                  <span className="menu-text"> {item.title}</span>
                  <span className="menu-arrow"></span>
                </a>

                <div className={`collapse ${isOpen ? "show" : ""}`} id={menuId}>
                  <ul className="sub-menu">
                    {item.children.map((child, cidx) => (
                      <li key={cidx} className={`side-nav-item${isActive(child.href) ? " active" : ""}`}>
                        <Link href={child.href ?? "#"} className="side-nav-link">
                          <span className="menu-text">{child.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="clearfix"></div>
      </div>
    </div>
  );
}
