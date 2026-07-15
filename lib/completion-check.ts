const REQUIRED_FIELDS = [
  "projectType",
  "purposeGoals",
  "targetAudience",
  "coreFeatures",
  "platformType",
  "designPrefs",
] as const;

// Deliberately excludes "budget" — that's collected later, together with
// contact info, once requirements are complete (not gated here).
export const OPTIONAL_BUT_ASK_ONCE = ["timeline", "additionalNotes"] as const;

export const TURN_CAP = 25;

const SKIP_VALUE = "skip";

type CheckableField = (typeof REQUIRED_FIELDS)[number] | (typeof OPTIONAL_BUT_ASK_ONCE)[number];

export type RequirementFields = Partial<Record<CheckableField, unknown>>;

export type CompletionStatus = "incomplete" | "complete" | "complete-partial";

export interface CompletionResult {
  status: CompletionStatus;
  isComplete: boolean;
  missingRequired: string[];
  missingOptional: string[];
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function isSkipped(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === SKIP_VALUE;
}

export function checkCompletion(
  requirement: RequirementFields,
  userTurnCount: number
): CompletionResult {
  const missingRequired = REQUIRED_FIELDS.filter((field) => !isFilled(requirement[field]));
  const missingOptional = OPTIONAL_BUT_ASK_ONCE.filter(
    (field) => !isFilled(requirement[field]) && !isSkipped(requirement[field])
  );

  if (missingRequired.length === 0 && missingOptional.length === 0) {
    return { status: "complete", isComplete: true, missingRequired, missingOptional };
  }

  if (userTurnCount >= TURN_CAP) {
    return { status: "complete-partial", isComplete: true, missingRequired, missingOptional };
  }

  return { status: "incomplete", isComplete: false, missingRequired, missingOptional };
}
