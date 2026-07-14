import { Type } from "@google/genai";

export const requirementsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply_to_user: { type: Type.STRING },
    next_question: { type: Type.STRING },
    extracted_fields: {
      type: Type.OBJECT,
      properties: {
        projectType: { type: Type.STRING },
        // Declared early, ahead of the large/verbose fields below (coreFeatures,
        // userRoles). Gemini's structured output tends to generate JSON in
        // schema property order, so a bloated array field earlier in the object
        // can crowd out generation budget/attention for whatever comes after it
        // — observed in production: a turn correctly containing a new name,
        // email, and budget in the client's message still came back with
        // contactEmail and budget silently missing from extracted_fields,
        // because the model spent its effort re-deriving a verbose userRoles
        // list first. Putting these three right after projectType makes them
        // far less likely to get crowded out on the turn they actually matter.
        contactName: { type: Type.STRING },
        contactEmail: { type: Type.STRING },
        budget: { type: Type.STRING },
        purposeGoals: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        coreFeatures: {
          type: Type.ARRAY,
          // Bounded to guard against runaway/degenerate generation — without
          // a cap, a bad generation can balloon this array until it consumes
          // the entire output and crowds out every other field in the same
          // turn (observed in production: a malformed turn produced hundreds
          // of near-duplicate entries and silently dropped reply_to_user,
          // contactName, contactEmail, and budget in the same response).
          maxItems: "40",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              complexity: {
                type: Type.STRING,
                format: "enum",
                enum: ["simple", "complex"],
              },
            },
            required: ["name", "complexity"],
          },
        },
        designPrefs: { type: Type.STRING },
        techStack: { type: Type.STRING },
        platformType: {
          type: Type.STRING,
          format: "enum",
          enum: ["web", "mobile", "desktop"],
        },
        // Same runaway-generation guard as coreFeatures above.
        userRoles: { type: Type.ARRAY, items: { type: Type.STRING }, maxItems: "15" },
        requestedTimelineDays: { type: Type.INTEGER },
        timeline: { type: Type.STRING },
        additionalNotes: { type: Type.STRING },
      },
    },
  },
  required: ["reply_to_user", "extracted_fields"],
};

export interface CoreFeature {
  name: string;
  complexity: "simple" | "complex";
}

export interface ExtractedFields {
  projectType?: string;
  purposeGoals?: string;
  targetAudience?: string;
  coreFeatures?: CoreFeature[];
  designPrefs?: string;
  techStack?: string;
  platformType?: "web" | "mobile" | "desktop";
  userRoles?: string[];
  requestedTimelineDays?: number;
  timeline?: string;
  budget?: string;
  additionalNotes?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface GeminiTurnResponse {
  reply_to_user: string;
  next_question?: string;
  extracted_fields: ExtractedFields;
}
