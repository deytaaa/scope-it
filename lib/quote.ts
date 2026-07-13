import type { Requirement } from "@prisma/client";
import { RATE_CARD, type QuoteResult } from "./pricing";

interface CoreFeatureLike {
  name?: string;
  complexity?: string;
}

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${RATE_CARD.currency}${Math.abs(amount).toLocaleString("en-US")}`;
}

function formatScopeOfWork(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "_No features specified_";
  return value
    .map((item) => {
      const feature = item as CoreFeatureLike;
      return `- ${feature.name ?? "Untitled feature"} (${feature.complexity ?? "unspecified"})`;
    })
    .join("\n");
}

function formatBreakdown(breakdown: QuoteResult["breakdown"]): string {
  if (breakdown.length === 0) return "_No line items_";
  return breakdown.map((line) => `- ${line.label}: ${formatCurrency(line.amount)}`).join("\n");
}

export function generateQuoteMarkdown(requirement: Requirement, quote: QuoteResult): string {
  const sections = [
    "# Project quotation",
    `## Estimated cost\n${formatCurrency(quote.estimatedCost)}`,
    `## Estimated timeline\n${quote.estimatedTimelineDaysMin}–${quote.estimatedTimelineDaysMax} business days`,
    `## Scope of work\n${formatScopeOfWork(requirement.coreFeatures)}`,
    "## What's included\nFull implementation of everything listed in the scope of work above, based on the requirements gathered in this conversation.",
    "## Optional additional features\nAdditional features beyond this scope can be discussed and quoted separately.",
    `## Pricing breakdown\n${formatBreakdown(quote.breakdown)}`,
    "---\nThis is an initial estimate based on the information gathered so far. Final pricing and timeline will be confirmed directly.",
  ];

  return sections.join("\n\n") + "\n";
}
