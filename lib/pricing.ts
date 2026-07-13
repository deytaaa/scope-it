// Rate card for the auto-quoting feature. All values are tunable — nothing
// else in the codebase hardcodes pricing, so changes here are the only
// change needed to adjust quotes.
export const RATE_CARD = {
  currency: "₱",
  simpleFeature: 500,
  complexFeature: 1000,
  additionalUserRole: 1000,
  baseFee: 7500, // floor: the quoted scope cost never goes below this
  mobileMultiplier: 0.1,
  rushMultiplier: 0.1,
  rushThresholdDays: 30, // "<1 month" per the rate card this was defined against
  capstoneDiscount: 0.05,
  daysPerSimpleFeature: 5,
  daysPerComplexFeature: 10, // assumption: proportional to the 2x price of a complex feature
  daysPerUserRole: 2, // assumption: extra role/permission wiring per role
  timelineBufferMultiplier: 1.3, // presented as a range rather than a false-precision single number
};

interface CoreFeatureInput {
  name?: string;
  complexity?: string;
}

export interface QuoteInput {
  projectCategory?: string | null;
  platformType?: string | null;
  coreFeatures?: unknown; // Requirement.coreFeatures (Json): { name, complexity }[]
  userRoles?: unknown; // Requirement.userRoles (Json): string[]
  requestedTimelineDays?: number | null;
}

export interface PricingLineItem {
  label: string;
  amount: number;
}

export interface QuoteResult {
  estimatedCost: number;
  estimatedTimelineDaysMin: number;
  estimatedTimelineDaysMax: number;
  breakdown: PricingLineItem[];
  simpleFeatureCount: number;
  complexFeatureCount: number;
  additionalRoleCount: number;
}

function toFeatureArray(value: unknown): CoreFeatureInput[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CoreFeatureInput => typeof item === "object" && item !== null);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const features = toFeatureArray(input.coreFeatures);
  const simpleFeatureCount = features.filter((f) => f.complexity !== "complex").length;
  const complexFeatureCount = features.filter((f) => f.complexity === "complex").length;

  const roles = toStringArray(input.userRoles);
  const additionalRoleCount = Math.max(0, roles.length - 1);

  const breakdown: PricingLineItem[] = [];
  if (simpleFeatureCount > 0) {
    breakdown.push({
      label: `${simpleFeatureCount} simple feature${simpleFeatureCount === 1 ? "" : "s"}`,
      amount: simpleFeatureCount * RATE_CARD.simpleFeature,
    });
  }
  if (complexFeatureCount > 0) {
    breakdown.push({
      label: `${complexFeatureCount} complex feature${complexFeatureCount === 1 ? "" : "s"}`,
      amount: complexFeatureCount * RATE_CARD.complexFeature,
    });
  }
  if (additionalRoleCount > 0) {
    breakdown.push({
      label: `${additionalRoleCount} additional user role${additionalRoleCount === 1 ? "" : "s"}`,
      amount: additionalRoleCount * RATE_CARD.additionalUserRole,
    });
  }

  const rawScopeCost = breakdown.reduce((sum, line) => sum + line.amount, 0);
  let cost = rawScopeCost;
  if (cost < RATE_CARD.baseFee) {
    breakdown.push({ label: "Minimum project fee adjustment", amount: RATE_CARD.baseFee - cost });
    cost = RATE_CARD.baseFee;
  }

  if (input.platformType === "mobile") {
    const amount = Math.round(cost * RATE_CARD.mobileMultiplier);
    breakdown.push({ label: "Mobile platform (+10%)", amount });
    cost += amount;
  }

  const isRush =
    typeof input.requestedTimelineDays === "number" &&
    input.requestedTimelineDays < RATE_CARD.rushThresholdDays;
  if (isRush) {
    const amount = Math.round(cost * RATE_CARD.rushMultiplier);
    breakdown.push({ label: "Rush timeline (+10%)", amount });
    cost += amount;
  }

  if (input.projectCategory === "capstone") {
    const amount = -Math.round(cost * RATE_CARD.capstoneDiscount);
    breakdown.push({ label: "Capstone discount (-5%)", amount });
    cost += amount;
  }

  const baselineDays = Math.max(
    RATE_CARD.daysPerSimpleFeature,
    simpleFeatureCount * RATE_CARD.daysPerSimpleFeature +
      complexFeatureCount * RATE_CARD.daysPerComplexFeature +
      additionalRoleCount * RATE_CARD.daysPerUserRole
  );

  return {
    estimatedCost: cost,
    estimatedTimelineDaysMin: baselineDays,
    estimatedTimelineDaysMax: Math.round(baselineDays * RATE_CARD.timelineBufferMultiplier),
    breakdown,
    simpleFeatureCount,
    complexFeatureCount,
    additionalRoleCount,
  };
}
