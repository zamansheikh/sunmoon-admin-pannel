export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg d-flex min-vh-100">
      <div className="row g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
        {children}
      </div>
    </div>
  );
}
