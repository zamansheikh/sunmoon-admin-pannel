"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/agora", label: "Overview", icon: "ri-dashboard-line", exact: true },
  { href: "/agora/config", label: "Configuration", icon: "ri-settings-3-line" },
  { href: "/agora/analytics", label: "Analytics", icon: "ri-bar-chart-2-line" },
  { href: "/agora/test", label: "Token Tester", icon: "ri-flask-line" },
];

export default function AgoraSubnav() {
  const pathname = usePathname();

  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <ul className="nav nav-pills mb-0">
          {TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <li key={tab.href} className="nav-item">
                <Link href={tab.href} className={`nav-link ${active ? "active" : ""}`}>
                  <i className={`${tab.icon} me-1`}></i> {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
