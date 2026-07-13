import { projects } from "@/lib/projects-data";

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-2 text-2xl font-medium text-primary">Projects</h1>
      <p className="mb-10 text-sm text-secondary">
        A few things we&apos;ve built together with clients through ConsultAI.
      </p>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">Nothing published yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.url}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-card border-[0.5px] border-border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:border-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails are arbitrary external URLs, not part of the app's own asset pipeline */}
              <img
                src={project.thumbnail}
                alt={project.title}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
              <div className="px-4 py-3.5">
                <p className="m-0 mb-1 text-sm text-primary">{project.title}</p>
                <p className="m-0 text-[13px] leading-relaxed text-secondary">{project.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
