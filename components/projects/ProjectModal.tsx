"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { KbdBadge } from "@/components/ui/KbdBadge";
import type { Project } from "@/lib/projects-data";

// Matches the CSS transition duration on .project-modal-backdrop/-panel in
// globals.css — kept in sync manually since there's no single source of
// truth shared between CSS and this timeout.
const TRANSITION_MS = 200;

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="m-0 mb-1.5 text-xs text-secondary">{label}</p>
      {children}
    </div>
  );
}

export function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  // Stays mounted for TRANSITION_MS after `project` goes null, so the closing
  // animation has something to animate rather than the panel just vanishing.
  const [renderedProject, setRenderedProject] = useState<Project | null>(null);
  const [visible, setVisible] = useState(false);
  const [prevProject, setPrevProject] = useState<Project | null>(null);

  // Adjusts state during render when `project` changes, rather than a
  // synchronous setState inside the effect below. Resets to the closed frame
  // either way — opening mounts renderedProject immediately (in that closed
  // frame) so the effect's rAF has something to transition from; closing just
  // needs visible back to false so the panel animates out before it unmounts.
  if (project !== prevProject) {
    setPrevProject(project);
    setVisible(false);
    if (project) {
      setRenderedProject(project);
    }
  }

  useEffect(() => {
    if (project) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const timeout = setTimeout(() => setRenderedProject(null), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [project]);

  useEffect(() => {
    if (!renderedProject) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [renderedProject, onClose]);

  if (!renderedProject) return null;

  const p = renderedProject;

  return (
    <div className="project-modal-backdrop" data-visible={visible} onClick={onClose}>
      <div
        className="project-modal-panel max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-card border-[0.5px] border-border bg-card"
        data-visible={visible}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <div className="relative h-56 w-full overflow-hidden bg-chrome sm:h-72">
          <Image
            src={p.image}
            alt={p.title}
            fill
            sizes="(min-width: 672px) 42rem, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="project-modal-title" className="m-0 text-xl font-medium text-primary sm:text-2xl">
              {p.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 cursor-pointer transition-opacity duration-150 hover:opacity-70"
            >
              <KbdBadge>✕</KbdBadge>
            </button>
          </div>

          <Section label="Summary">
            <p className="m-0 text-sm leading-relaxed text-primary">{p.summary}</p>
          </Section>

          <Section label="Problem">
            <p className="m-0 text-sm leading-relaxed text-primary">{p.problem}</p>
          </Section>

          <Section label="Key features">
            <ul className="m-0 flex list-none flex-col gap-1.5 pl-0">
              {p.keyFeatures.map((feature) => (
                <li
                  key={feature}
                  className="text-sm leading-relaxed text-primary before:mr-2 before:text-muted before:content-['—']"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Technologies used">
            <div className="flex flex-wrap gap-1.5">
              {p.techStack.map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
            </div>
          </Section>

          <Section label="My role">
            <p className="m-0 text-sm leading-relaxed text-primary">{p.role}</p>
          </Section>

          <Section label="Challenges">
            <p className="m-0 text-sm leading-relaxed text-primary">{p.challenges}</p>
          </Section>

          <Section label="Solutions">
            <p className="m-0 text-sm leading-relaxed text-primary">{p.solutions}</p>
          </Section>

          {p.timeline && (
            <Section label="Timeline">
              <p className="m-0 text-sm leading-relaxed text-primary">{p.timeline}</p>
            </Section>
          )}

          {p.screenshots && p.screenshots.length > 0 && (
            <Section label="Additional screenshots">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {p.screenshots.map((src) => (
                  <div
                    key={src}
                    className="relative h-24 overflow-hidden rounded-card border-[0.5px] border-border bg-chrome"
                  >
                    <Image src={src} alt={`${p.title} screenshot`} fill sizes="200px" className="object-cover" />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section label="Demo video">
            {p.videoUrl ? (
              <video
                controls
                src={p.videoUrl}
                className="w-full rounded-card border-[0.5px] border-border bg-chrome"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-card border-[0.5px] border-dashed border-border bg-chrome">
                <p className="m-0 text-sm text-muted">Demo video coming soon.</p>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
