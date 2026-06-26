import type { Metadata } from "next";
import Script from "next/script";
import Providers from "@/components/Providers";
import { PROJECT_NAME } from "@/lib/constants";
import "./globals.css";

// DOMContentLoaded has already fired in Next.js by the time afterInteractive
// scripts load. Poll until jQuery ($), App, and ThemeCustomizer are all ready,
// then bootstrap the sidebar toggle, topbar scroll, and theme switcher.
const APP_INIT_SCRIPT = `
(function poll() {
  if (
    typeof window.$ !== 'undefined' &&
    typeof App !== 'undefined' &&
    typeof ThemeCustomizer !== 'undefined'
  ) {
    (new App).init();
    (new ThemeCustomizer).init();

    // Sync sidebar theme with main theme
    const html = document.documentElement;
    const syncMenuColor = () => {
      const theme = html.getAttribute('data-bs-theme');
      if (theme) {
        html.setAttribute('data-menu-color', theme);
      }
    };
    
    // Initial sync
    syncMenuColor();
    
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-bs-theme') {
          syncMenuColor();
        }
      });
    });
    observer.observe(html, { attributes: true });
  } else {
    setTimeout(poll, 50);
  }
})();
`;

export const metadata: Metadata = {
  title: `${PROJECT_NAME} - Admin Dashboard`,
  description: `${PROJECT_NAME} Admin Panel`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-bs-theme="light" data-sidenav-size="default" data-topbar-color="light" data-menu-color="light" data-layout-mode="fluid">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="shortcut icon" href="/assets/images/favicon.ico" />
        {/* Vendor CSS — loaded first */}
        <link href="/assets/css/vendor.min.css" rel="stylesheet" />
        {/* App CSS */}
        <link href="/assets/css/app.min.css" rel="stylesheet" id="app-style" />
        {/* Icons CSS */}
        <link href="/assets/css/icons.min.css" rel="stylesheet" />
      </head>
      <body>
        {/* Theme config — must run first to set data-* on <html> before CSS paint */}
        <Script src="/assets/js/config.js" strategy="beforeInteractive" />
        <Providers>{children}</Providers>
        {/* jQuery + Bootstrap bundle */}
        <Script src="/assets/js/vendor.min.js" strategy="afterInteractive" />
        {/* App init (sidebar, topbar, theme switcher) */}
        <Script src="/assets/js/app.js" strategy="afterInteractive" />
        {/* Re-trigger init since DOMContentLoaded already fired in Next.js */}
        <Script
          id="app-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: APP_INIT_SCRIPT }}
        />
      </body>
    </html>
  );
}
