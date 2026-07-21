import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-[0.5px] border-border bg-chrome transition-colors duration-150">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="m-0 text-sm text-secondary">
          <span className="text-primary">ScopeAI</span> · © {year} All rights reserved.
        </p>
        <nav className="flex items-center gap-6">
          <Link
            href="/projects"
            className="text-sm text-secondary transition-colors duration-150 hover:text-primary"
          >
            Projects
          </Link>
          <Link
            href="/about"
            className="text-sm text-secondary transition-colors duration-150 hover:text-primary"
          >
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
