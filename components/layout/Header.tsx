import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b-[0.5px] border-border bg-chrome">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-sm text-primary">
          ConsultAI
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/projects" className="text-sm text-secondary hover:text-primary">
            Projects
          </Link>
          <Link href="/about" className="text-sm text-secondary hover:text-primary">
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
