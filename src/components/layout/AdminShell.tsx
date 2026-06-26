"use client";
import { PROJECT_NAME } from "@/lib/constants";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AdminShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AdminShell({ children, pageTitle }: AdminShellProps) {
  // NOTE: sidebar toggle, sm-hover, and topbar scroll are all driven by
  // /assets/js/app.js (ThemeCustomizer + App classes). They operate on
  // data-sidenav-size / sidebar-enable class on <html> — we must NOT fight that
  // with our own React state. The APP_INIT_SCRIPT in layout.tsx bootstraps them.

  return (
    // "wrapper" is the selector app.js uses as the root sentinel
    <div className="wrapper">
      <Sidebar />

      <div className="content-page">
        <Topbar pageTitle={pageTitle} />

        <div className="page-content">
          <div className="page-container">
            {children}
          </div>
        </div>

        <footer className="footer">
          <div className="page-container">
            <div className="row align-items-center">
              <div className="col-md-6 text-center text-md-start">
                <span className="text-muted fs-13">
                  {new Date().getFullYear()} &copy; {PROJECT_NAME}
                </span>
              </div>
              <div className="col-md-6">
                <div className="text-md-end footer-links d-none d-md-block">
                  <span className="text-muted fs-12 me-2">
                    Made with <span className="text-danger">♥</span> by{" "}
                    <a
                      href="https://github.com/zamansheikh"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fw-semibold text-reset text-decoration-underline"
                    >
                      Zaman Sheikh
                    </a>
                  </span>
                  <a href="/about">About</a>
                  <a href="/support">Support</a>
                  <a href="/contact">Contact Us</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
