"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// Matches the CSS transition duration on .mobile-nav-panel in globals.css.
const TRANSITION_MS = 180;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-4 w-5 flex-col items-center justify-between" aria-hidden="true">
      <span
        className={`hamburger-line block h-[1.5px] w-5 bg-primary ${open ? "translate-y-[7px] rotate-45" : ""}`}
      />
      <span className={`hamburger-line block h-[1.5px] w-5 bg-primary ${open ? "opacity-0" : ""}`} />
      <span
        className={`hamburger-line block h-[1.5px] w-5 bg-primary ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
      />
    </span>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  // Stays mounted for TRANSITION_MS after closing so the panel has something
  // to animate out to, instead of vanishing instantly.
  const [rendered, setRendered] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Adjusts state during render rather than a synchronous setState inside an
  // effect. Opening needs no JS-driven timing at all — the enter animation is
  // handled by CSS @starting-style (see .mobile-nav-panel in globals.css),
  // the same fix used for the project modal after a requestAnimationFrame-based
  // version of this raced the browser's paint and silently failed to open on
  // the first click of a session.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setRendered(true);
    }
  }

  const closing = !open && rendered;

  useEffect(() => {
    if (open) return;
    const timeout = setTimeout(() => setRendered(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-card border-[0.5px] border-border transition-colors duration-150 hover:border-secondary"
      >
        <HamburgerIcon open={open} />
      </button>

      {rendered && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile"
          data-closing={closing}
          className="mobile-nav-panel absolute right-0 top-full z-40 mt-2 flex w-44 flex-col gap-1 rounded-card border-[0.5px] border-border bg-chrome p-2"
        >
          <Link
            href="/projects"
            onClick={closeMenu}
            className="rounded-card px-3 py-2 text-sm text-secondary transition-colors duration-150 hover:bg-card hover:text-primary"
          >
            Projects
          </Link>
          <Link
            href="/about"
            onClick={closeMenu}
            className="rounded-card px-3 py-2 text-sm text-secondary transition-colors duration-150 hover:bg-card hover:text-primary"
          >
            About
          </Link>
          <div className="flex items-center justify-between border-t-[0.5px] border-border px-3 pt-2">
            <span className="text-sm text-secondary">Theme</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </div>
  );
}
