import type { Requirement } from "@prisma/client";

const FALLBACK = "_Not specified_";

interface CoreFeatureLike {
  name?: string;
  complexity?: string;
}

function formatText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : FALLBACK;
}

function formatFeatureList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return FALLBACK;
  return value
    .map((item) => {
      if (typeof item === "string") return `- ${item}`;
      const feature = item as CoreFeatureLike;
      return feature.complexity ? `- ${feature.name} (${feature.complexity})` : `- ${feature.name}`;
    })
    .join("\n");
}

function formatStringList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return FALLBACK;
  return value.map((item) => `- ${String(item)}`).join("\n");
}

export function generateSummaryMarkdown(requirement: Requirement): string {
  const title = requirement.projectType
    ? `${requirement.projectType} — project summary`
    : "Project summary";

  const sections = [
    `# ${title}`,
    `## Overview\n${formatText(requirement.purposeGoals)}`,
    `## Business objectives\n${formatText(requirement.purposeGoals)}`,
    `## Target audience\n${formatText(requirement.targetAudience)}`,
    `## Core features\n${formatFeatureList(requirement.coreFeatures)}`,
    `## Design preferences\n${formatText(requirement.designPrefs as string | null)}`,
  ];

  if (requirement.userRoles) {
    sections.push(`## Users / roles\n${formatStringList(requirement.userRoles)}`);
  }

  const techLines = [
    requirement.techStack ? `Tech stack: ${requirement.techStack}` : null,
    requirement.platformType ? `Platform: ${requirement.platformType}` : null,
  ].filter(Boolean);
  sections.push(`## Technical requirements\n${techLines.length ? techLines.join("\n") : FALLBACK}`);

  sections.push(`## Branding assets\n${formatText(requirement.brandingAssets as string | null)}`);

  if (requirement.schoolRequirements && requirement.schoolRequirements.trim()) {
    sections.push(`## School / adviser requirements\n${requirement.schoolRequirements.trim()}`);
  }

  if (requirement.timeline && requirement.timeline.trim()) {
    sections.push(`## Timeline\n${requirement.timeline.trim()}`);
  }

  if (requirement.budget && requirement.budget.trim()) {
    sections.push(`## Budget\n${requirement.budget.trim()}`);
  }

  if (requirement.additionalNotes && requirement.additionalNotes.trim()) {
    sections.push(`## Additional notes\n${requirement.additionalNotes.trim()}`);
  }

  return sections.join("\n\n") + "\n";
}
