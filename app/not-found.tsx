import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { NotFoundContent } from "@/components/not-found/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found — ScopeAI",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <NotFoundContent homeHref="/" homeLabel="Back to homepage" />
    </>
  );
}
