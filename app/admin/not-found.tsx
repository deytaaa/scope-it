import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found — ScopeAI admin",
};

// No <Header /> here — app/admin/layout.tsx already wraps this with the
// "ScopeAI admin" header + logout button, so this only needs the 404 content.
export default function AdminNotFound() {
  return <NotFoundContent homeHref="/admin" homeLabel="Back to admin dashboard" />;
}
