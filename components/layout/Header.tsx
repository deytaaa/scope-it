import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

export function Header() {
  return (
    <header className="border-b-[0.5px] border-border bg-chrome transition-colors duration-150">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-sm text-primary transition-colors duration-150">
          ScopeAI
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
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
          <ThemeToggle />
        </nav>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
