import Link from "next/link";
import { pillClassName } from "@/components/ui/Pill";
import { GoBackButton } from "./GoBackButton";

interface NotFoundContentProps {
  homeHref: string;
  homeLabel: string;
}

// Shared between app/not-found.tsx and app/admin/not-found.tsx — homeHref
// differs so "back to homepage" from within /admin lands back on /admin
// rather than the public site root.
export function NotFoundContent({ homeHref, homeLabel }: NotFoundContentProps) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p
        aria-hidden="true"
        className="animate-fade-in-float m-0 select-none text-[6rem] font-medium leading-none text-border sm:text-[8rem]"
      >
        404
      </p>
      <h1
        className="animate-fade-in-up m-0 text-2xl font-medium leading-snug text-primary sm:text-3xl"
        style={{ animationDelay: "80ms" }}
      >
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </h1>
      <p
        className="animate-fade-in-up m-0 max-w-md text-base leading-relaxed text-secondary"
        style={{ animationDelay: "160ms" }}
      >
        It may have been moved, deleted, or the URL may be incorrect.
      </p>
      <div
        className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3 pt-2"
        style={{ animationDelay: "240ms" }}
      >
        <Link href={homeHref} className={pillClassName}>
          {homeLabel}
        </Link>
        <GoBackButton />
      </div>
    </main>
  );
}
