"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects-data";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <div
            key={project.slug}
            className="animate-fade-in-up h-full"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <ProjectCard project={project} onOpen={() => setActiveProject(project)} />
          </div>
        ))}
      </div>
      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </>
  );
}
