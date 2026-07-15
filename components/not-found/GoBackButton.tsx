"use client";

import { useRouter } from "next/navigation";

// Outlined variant of the Pill button (see components/ui/Pill.tsx) — same
// shape, size, and spacing, just unfilled, so it reads as the secondary
// action next to "Back to homepage".
const secondaryPillClassName =
  "inline-flex items-center justify-center gap-2 rounded-pill border-[0.5px] border-border bg-transparent px-6 py-3 font-mono text-sm text-primary cursor-pointer transition-all duration-150 hover:bg-card active:scale-[0.97]";

export function GoBackButton() {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()} className={secondaryPillClassName}>
      Go back
    </button>
  );
}
