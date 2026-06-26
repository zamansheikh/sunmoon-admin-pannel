import { redirect } from "next/navigation";

// Visiting /admin just lands on the dashboard. This page lives under the
// admin layout's <AuthGuard>, so an unauthenticated user who reaches
// /dashboard next is bounced to /login automatically.
export default function AdminIndexPage() {
  redirect("/dashboard");
}
