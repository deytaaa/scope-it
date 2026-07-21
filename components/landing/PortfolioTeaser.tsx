import Link from "next/link";
import Image from "next/image";
import { projects } from "@/lib/projects-data";

// A handful, not the full gallery — this is a teaser pointing to /projects,
// not a second listing to keep in sync with it.
const FEATURED_COUNT = 3;

export function PortfolioTeaser() {
  const featured = projects.slice(0, FEATURED_COUNT);
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24">
      <div
        className="animate-fade-in-up mb-6 flex items-end justify-between gap-4"
        style={{ animationDelay: "620ms" }}
      >
        <div>
          <p className="m-0 mb-1 text-sm text-primary">See what we&apos;ve built</p>
          <p className="m-0 text-[13px] text-secondary">Real projects, real clients — not a guess.</p>
        </div>
        <Link
          href="/projects"
          className="shrink-0 text-sm text-secondary underline transition-colors duration-150 hover:text-primary"
        >
          Browse all projects →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {featured.map((project, i) => (
          <Link
            key={project.slug}
            href="/projects"
            className="elevated-card animate-fade-in-up group block overflow-hidden rounded-card border-[0.5px] border-border bg-card"
            style={{ animationDelay: `${700 + i * 80}ms` }}
          >
            <div className="relative h-32 w-full overflow-hidden bg-chrome">
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="m-0 px-4 py-3 text-sm text-primary">{project.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
