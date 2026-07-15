import { projects } from "@/lib/projects-data";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-2 text-2xl font-medium text-primary">Projects</h1>
      <p className="mb-10 text-sm text-secondary">A few things we&apos;ve built.</p>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">Nothing published yet — check back soon.</p>
      ) : (
        <ProjectsGrid projects={projects} />
      )}
    </main>
  );
}
