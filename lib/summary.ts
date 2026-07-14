import type { Requirement } from "@prisma/client";
import { RATE_CARD, type QuoteResult } from "./pricing";

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
  if (!Array.isArray(value) || value.length === 0) return "";
  return value.map((item) => String(item)).join(", ");
}

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${RATE_CARD.currency}${Math.abs(amount).toLocaleString("en-US")}`;
}

// Lightweight, live preview of whatever's been gathered so far — used by
// admin to review in-progress sessions. Works on any requirement, complete
// or not, unlike generateFinalSummary which needs a computed quote.
export function generateSummaryMarkdown(requirement: Requirement): string {
  const title = requirement.projectType
    ? `${requirement.projectType} — project summary`
    : "Project summary";

  const sections = [
    `# ${title}`,
    `## Overview\n${formatText(requirement.purposeGoals)}`,
    `## Target audience\n${formatText(requirement.targetAudience)}`,
    `## Core features\n${formatFeatureList(requirement.coreFeatures)}`,
    `## Design preferences\n${formatText(requirement.designPrefs as string | null)}`,
  ];

  const roles = formatStringList(requirement.userRoles);
  if (roles) {
    sections.push(`## Users / roles\n${roles}`);
  }

  const techLines = [
    requirement.platformType ? `Platform: ${requirement.platformType}` : null,
    requirement.techStack ? `Tech stack: ${requirement.techStack}` : null,
  ].filter(Boolean);
  sections.push(`## Technical requirements\n${techLines.length ? techLines.join("\n") : FALLBACK}`);

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

interface ContactInfo {
  name: string;
  email: string;
}

// The one final document shown to the client and stored once a session
// completes: client info, full requirements, and the AI's cost estimate —
// generated deterministically from already-gathered data, never model text.
export function generateFinalSummary(
  contact: ContactInfo,
  requirement: Requirement,
  quote: QuoteResult
): string {
  const overviewLines = [formatText(requirement.purposeGoals)];
  const roles = formatStringList(requirement.userRoles);
  overviewLines.push(
    `Target users: ${formatText(requirement.targetAudience)}${roles ? ` (${roles})` : ""}`
  );

  const platformLines = [
    `Platform: ${formatText(requirement.platformType)}`,
    requirement.techStack ? `Recommended tech stack: ${requirement.techStack}` : null,
  ].filter(Boolean);

  const additionalLines = [
    requirement.timeline && requirement.timeline.trim()
      ? `Timeline: ${requirement.timeline.trim()}`
      : null,
    requirement.designPrefs ? `Design preferences: ${formatText(requirement.designPrefs as string | null)}` : null,
    requirement.additionalNotes && requirement.additionalNotes.trim()
      ? requirement.additionalNotes.trim()
      : null,
  ].filter(Boolean);

  const sections = [
    `# ${requirement.projectType ?? "Project"} — Project Summary`,
    `## Client Information\nName: ${contact.name}\nEmail: ${contact.email}`,
    `## Project Overview\n${overviewLines.join("\n")}`,
    `## Requested Features\n${formatFeatureList(requirement.coreFeatures)}`,
    `## Platform\n${platformLines.join("\n")}`,
    `## Additional Requirements\n${additionalLines.length ? additionalLines.join("\n") : FALLBACK}`,
    `## Budget & Estimate\nClient's stated budget: ${formatText(requirement.budget)}\n\nEstimated Project Cost: ${formatCurrency(
      quote.estimatedCost
    )}. This is an AI-generated estimate based on the project requirements you provided. The final quotation may be lower or higher after a detailed discussion with the developer.`,
  ];

  return sections.join("\n\n") + "\n";
}
