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
        techStack: { type: Type.STRING },
        platformType: {
          type: Type.STRING,
          format: "enum",
          enum: ["web", "mobile", "desktop"],
        },
        userRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
        requestedTimelineDays: { type: Type.INTEGER },
        timeline: { type: Type.STRING },
        budget: { type: Type.STRING },
        additionalNotes: { type: Type.STRING },
        contactName: { type: Type.STRING },
        contactEmail: { type: Type.STRING },
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
