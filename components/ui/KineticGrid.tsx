"use client";

import { useEffect, useRef } from "react";

// The ambient drift is pure CSS (see .kinetic-grid rules in styles/globals.css)
// and needs no JS at all. This effect only adds cursor reactivity on top: pointer
// position is written straight to CSS custom properties via a ref + rAF
// throttle, never through React state, so mouse movement never triggers a
// re-render. Gated to fine-pointer, motion-OK environments — touch devices and
// prefers-reduced-motion just get the static/drifting grid with no tilt or glow.
export function KineticGrid() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    let rafId: number | null = null;
    let pendingX = 0.5;
    let pendingY = 0.5;

    function applyPosition() {
      rafId = null;
      root!.style.setProperty("--mx", pendingX.toFixed(4));
      root!.style.setProperty("--my", pendingY.toFixed(4));
    }

    function handlePointerMove(e: PointerEvent) {
      pendingX = e.clientX / window.innerWidth;
      pendingY = e.clientY / window.innerHeight;
      if (rafId === null) {
        rafId = requestAnimationFrame(applyPosition);
      }
      root!.dataset.active = "true";
    }

    function handlePointerLeave() {
      root!.dataset.active = "false";
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="kinetic-grid" ref={rootRef} aria-hidden="true">
      <div className="kinetic-grid__parallax kinetic-grid__parallax--fine">
        <div className="kinetic-grid__layer kinetic-grid__layer--fine" />
      </div>
      <div className="kinetic-grid__parallax kinetic-grid__parallax--bold">
        <div className="kinetic-grid__layer kinetic-grid__layer--bold" />
      </div>
      <div className="kinetic-grid__spotlight" />
      <div className="kinetic-grid__vignette" />
    </div>
  );
}
