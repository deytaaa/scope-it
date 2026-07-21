import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/lib/projects-data";

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="elevated-card group flex h-full flex-col overflow-hidden rounded-card border-[0.5px] border-border bg-card text-left"
    >
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-chrome">
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
          {/* min-h + line-clamp reserve the same space whether a title/description
              is one line or wraps to the max — otherwise cards with shorter text
              end up shorter than their neighbors even with h-full on the card. */}
          <p className="m-0 mb-1 line-clamp-2 min-h-[2.5rem] text-sm leading-tight text-primary">
            {project.title}
          </p>
          <p className="m-0 line-clamp-2 min-h-[2.75rem] text-[13px] leading-relaxed text-secondary">
            {project.description}
          </p>
        </div>
        <div className="mt-auto flex h-14 flex-wrap content-start gap-1.5 overflow-hidden">
          {project.techStack.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>
      </div>
    </button>
  );
}
