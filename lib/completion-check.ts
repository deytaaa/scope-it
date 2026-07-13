const COMMON_REQUIRED_FIELDS = [
  "projectCategory",
  "projectType",
  "purposeGoals",
  "targetAudience",
  "coreFeatures",
  "designPrefs",
] as const;

const CAPSTONE_REQUIRED_FIELDS = ["platformType", "techStack"] as const;
const COMMERCIAL_REQUIRED_FIELDS = ["userRoles"] as const;

const COMMON_OPTIONAL_FIELDS = ["brandingAssets", "timeline", "budget"] as const;
const CAPSTONE_OPTIONAL_FIELDS = ["schoolRequirements"] as const;

export const TURN_CAP = 25;

const SKIP_VALUE = "skip";

type CheckableField =
  | (typeof COMMON_REQUIRED_FIELDS)[number]
  | (typeof CAPSTONE_REQUIRED_FIELDS)[number]
  | (typeof COMMERCIAL_REQUIRED_FIELDS)[number]
  | (typeof COMMON_OPTIONAL_FIELDS)[number]
  | (typeof CAPSTONE_OPTIONAL_FIELDS)[number];

export type RequirementFields = Partial<Record<CheckableField, unknown>> & {
  projectCategory?: string | null;
};

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

function getRequiredFields(category: string | null | undefined): readonly CheckableField[] {
  if (category === "capstone") return [...COMMON_REQUIRED_FIELDS, ...CAPSTONE_REQUIRED_FIELDS];
  if (category === "commercial") return [...COMMON_REQUIRED_FIELDS, ...COMMERCIAL_REQUIRED_FIELDS];
  // Category itself is the one thing missing from COMMON_REQUIRED_FIELDS, so
  // this naturally forces it to be asked before any category-specific field.
  return COMMON_REQUIRED_FIELDS;
}

function getOptionalFields(category: string | null | undefined): readonly CheckableField[] {
  if (category === "capstone") return [...COMMON_OPTIONAL_FIELDS, ...CAPSTONE_OPTIONAL_FIELDS];
  return COMMON_OPTIONAL_FIELDS;
}

export function checkCompletion(
  requirement: RequirementFields,
  userTurnCount: number
): CompletionResult {
  const requiredFields = getRequiredFields(requirement.projectCategory);
  const optionalFields = getOptionalFields(requirement.projectCategory);

  const missingRequired = requiredFields.filter((field) => !isFilled(requirement[field]));
  const missingOptional = optionalFields.filter(
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
