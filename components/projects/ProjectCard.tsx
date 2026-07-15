import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/lib/projects-data";

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="project-card group flex flex-col overflow-hidden rounded-card border-[0.5px] border-border bg-card text-left"
    >
      <div className="relative h-44 w-full overflow-hidden bg-chrome">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div>
          <p className="m-0 mb-1 text-sm text-primary">{project.title}</p>
          <p className="m-0 text-[13px] leading-relaxed text-secondary">{project.description}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>
      </div>
    </button>
  );
}
