import { Type } from "@google/genai";

export const requirementsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply_to_user: { type: Type.STRING },
    next_question: { type: Type.STRING },
    extracted_fields: {
      type: Type.OBJECT,
      properties: {
        projectCategory: {
          type: Type.STRING,
          format: "enum",
          enum: ["capstone", "commercial"],
        },
        projectType: { type: Type.STRING },
        purposeGoals: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        coreFeatures: {
          type: Type.ARRAY,
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
        brandingAssets: { type: Type.STRING },
        techStack: { type: Type.STRING },
        platformType: {
          type: Type.STRING,
          format: "enum",
          enum: ["web", "mobile", "desktop"],
        },
        schoolRequirements: { type: Type.STRING },
        userRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
        requestedTimelineDays: { type: Type.INTEGER },
        timeline: { type: Type.STRING },
        budget: { type: Type.STRING },
        additionalNotes: { type: Type.STRING },
        contactName: { type: Type.STRING },
        contactEmail: { type: Type.STRING },
      },
    },
    model_thinks_complete: { type: Type.BOOLEAN },
    client_confirmed: { type: Type.BOOLEAN },
  },
  required: ["reply_to_user", "extracted_fields", "model_thinks_complete"],
};

export interface CoreFeature {
  name: string;
  complexity: "simple" | "complex";
}

export interface ExtractedFields {
  projectCategory?: "capstone" | "commercial";
  projectType?: string;
  purposeGoals?: string;
  targetAudience?: string;
  coreFeatures?: CoreFeature[];
  designPrefs?: string;
  brandingAssets?: string;
  techStack?: string;
  platformType?: "web" | "mobile" | "desktop";
  schoolRequirements?: string;
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
  model_thinks_complete: boolean;
  client_confirmed?: boolean;
}
