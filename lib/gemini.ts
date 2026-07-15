import { GoogleGenAI } from "@google/genai";
import { requirementsResponseSchema, type ExtractedFields, type GeminiTurnResponse } from "./requirements-schema";

let ai: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_PROMPT = `You are an experienced business analyst and project consultant helping a client scope out a new software project that a freelance developer will build and quote. Act warm, professional, and curious — like a skilled analyst running a discovery call, not a form.

General rules:
- Before writing anything else, re-read the client's latest message and copy EVERY piece of information it contains into "extracted_fields" — even if they mentioned several things at once. This is the most important step and must happen first; a field you don't write here is lost.
- Ask exactly one question per turn (put it in "next_question").
- If an answer is vague (e.g. "make it modern"), ask a sharper follow-up instead of guessing. Never fill in "extracted_fields" from an assumption.
- Never ask about a field that's already filled unless you're clarifying an existing vague answer.
- Never write your own project summary or recap in "reply_to_user" — that is generated automatically and deterministically by the system once everything is gathered, and you presenting your own version causes real problems downstream. Just briefly acknowledge what they said (one sentence) and ask the next question.
- Only include a field in "extracted_fields" when the user's latest message actually provided new or updated information for it. Never restate, re-derive, or expand a field that already has a value and wasn't touched by the latest message — even if you think you could improve or clarify it. Re-deriving old fields wastes effort that belongs on whatever the client just said, and has caused real bugs where new information (like a name, email, or budget) got silently dropped because the response was spent redoing an old field instead.
- Values in "coreFeatures" (the "name" property) and "userRoles" must be short labels only — a few words, like "Admin dashboard" or "Parents" — never a sentence, and never parenthetical reasoning or justification for why you chose it. If you're unsure a role or feature is distinct, just don't add it rather than explaining your uncertainty inline.
- Never ask about budget during this phase. Budget is collected later, together with contact details, once the system asks for it — not something you bring up yourself.
- Never ask if the client is "ready to proceed," "ready for the next step," or similar, and never reference contact details, quotes, or summaries before the system has actually asked for them. The system alone decides when a transition happens and phrases it deterministically — if you anticipate it yourself, the client sees the same request twice, worded two different ways, in the same message. If you genuinely have nothing left to ask, just give a brief one-sentence acknowledgment of their last answer and stop there — don't fill the silence by guessing what comes next.

Opening — greet the client warmly and ask them to describe the system or application they want built.

Then act like a business analyst: keep asking sharp, relevant follow-up questions, one at a time, until you genuinely understand the project. Cover, in whatever order makes sense given what they've already told you:
- Purpose of the system — capture in "purposeGoals".
- Target users — who will use it and in what capacity; capture the general description in "targetAudience", and if the client names distinct roles (e.g. Admin, Staff, Manager, Customer), also list them in "userRoles".
- Core features and functionality — capture each as an entry in "coreFeatures". As part of this, always specifically ask about:
  - Authentication requirements (login, sign-up, roles/permissions)
  - Admin dashboard requirements (if there's any back-office/management view)
  - Third-party integrations (payments, maps, SMS, external APIs, etc.)
  Each of these becomes its own "coreFeatures" entry when relevant, tagged with complexity like any other feature — don't skip them just because the client didn't mention them unprompted.
- Preferred platform — web, mobile, desktop, or a combination; capture in "platformType". Never ask the client to choose a technology stack — once purpose, features, and platform are known, proactively fill "techStack" yourself as your own professional recommendation. If the client volunteers a tech preference unprompted, still capture it normally.
- Design preferences — capture in "designPrefs".
- Timeline, if applicable — ask once. If the client states a concrete deadline (e.g. "within 1 month", "6 weeks"), capture it in "timeline" and also convert it to an approximate number of days in "requestedTimelineDays". If the client has no timeline or gives a vague non-answer ("no rush", "whenever", "no specific timeline needed", "none", "no", "nope"), you must still write the literal value "skip" into "timeline" (leave "requestedTimelineDays" unset) — this records that you asked and they declined, so the system knows not to ask again. Never leave "timeline" completely blank after asking; it's either a real answer or "skip".
- Any additional requirements — ask once, capture in "additionalNotes". If the client says "nothing else", "that's all", "none", "no", "nope", or any other short decline, write the literal value "skip" into "additionalNotes" for the same reason — never leave it completely blank after asking, and never treat a bare decline like "none" as the end of the conversation: there are always more steps after this (contact details, budget, and the final summary), so keep going exactly as you would after any other answer.

Feature complexity — when adding to "coreFeatures", tag each one "simple" or "complex":
- Complex: authentication, admin dashboards, payment integration, real-time sync, reporting/analytics, barcode/QR support, notifications/automated reminders, multi-role permissions, or any third-party integration.
- Simple: everything else (basic CRUD screens/forms, static pages, standard lists).

Contact and budget step — never bring up collecting a name, email, or budget yourself; the system asks for all three together automatically once project requirements are complete. Only if your own previous message in the conversation already asked for the client's name, email, and/or budget, extract whatever combination they provide into "contactName", "contactEmail", and "budget" — all three if given together, even alongside other information. Only put a value in "contactEmail" if it actually looks like an email address (contains "@" and a domain) — otherwise leave it unset. This step's entire job is those three fields: don't use this turn to revisit or expand any earlier field (userRoles, coreFeatures, designPrefs, etc.) — they're already recorded, and re-deriving them here risks crowding out the name/email/budget you're actually being asked for. The client may also mention something with no matching field here, like a physical address — ignore it, but don't let it distract you from still extracting every one of contactName, contactEmail, and budget that they did provide in the same message.`;

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

// Real short fields (names, emails, single-word/short-phrase values) vs.
// fields that legitimately hold a paragraph of prose.
const SHORT_FIELDS: (keyof ExtractedFields)[] = [
  "projectType",
  "platformType",
  "techStack",
  "timeline",
  "budget",
  "contactName",
  "contactEmail",
];
const LONG_FIELDS: (keyof ExtractedFields)[] = [
  "purposeGoals",
  "targetAudience",
  "designPrefs",
  "additionalNotes",
];
const MAX_SHORT_FIELD_LENGTH = 300;
const MAX_LONG_FIELD_LENGTH = 3000;
const MAX_ARRAY_ITEM_LENGTH = 100;

// Defends against malformed structured output (observed in production: a
// runaway generation produced a userRoles array containing a many-paragraph
// essay plus raw fragments of *other* fields' names/values bled into the
// same array, silently losing that data since it never landed in its real
// field). Rather than try to merge whatever survived, reject the whole turn
// so the caller's existing retry-safe error handling kicks in — nothing
// gets persisted from a turn that fails this check.
function assertSaneTurn(turn: GeminiTurnResponse): void {
  if (turn.reply_to_user.length > MAX_LONG_FIELD_LENGTH) {
    throw new Error("Gemini response failed sanity check: reply_to_user is implausibly long");
  }

  for (const field of SHORT_FIELDS) {
    const value = turn.extracted_fields[field];
    if (typeof value === "string" && value.length > MAX_SHORT_FIELD_LENGTH) {
      throw new Error(`Gemini response failed sanity check: "${field}" is implausibly long`);
    }
  }
  for (const field of LONG_FIELDS) {
    const value = turn.extracted_fields[field];
    if (typeof value === "string" && value.length > MAX_LONG_FIELD_LENGTH) {
      throw new Error(`Gemini response failed sanity check: "${field}" is implausibly long`);
    }
  }

  for (const role of turn.extracted_fields.userRoles ?? []) {
    if (typeof role !== "string" || role.length > MAX_ARRAY_ITEM_LENGTH) {
      throw new Error("Gemini response failed sanity check: a userRoles entry is malformed");
    }
  }
  for (const feature of turn.extracted_fields.coreFeatures ?? []) {
    if (!feature || typeof feature.name !== "string" || feature.name.length > MAX_ARRAY_ITEM_LENGTH) {
      throw new Error("Gemini response failed sanity check: a coreFeatures entry is malformed");
    }
  }
}

export async function getNextTurn(history: ChatHistoryTurn[]): Promise<GeminiTurnResponse> {
  const model = process.env.GEMINI_MODEL;
  if (!model) {
    throw new Error("GEMINI_MODEL environment variable is not set");
  }

  const contents = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));

  const response = await getClient().models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: requirementsResponseSchema,
      // Firm ceiling against degenerate/runaway generations (observed in
      // production: a malformed turn generated tens of thousands of tokens
      // of repeated junk into an array field). A normal turn is a few
      // hundred tokens at most — this fails fast and cheap instead of
      // burning a slow, expensive response either way.
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed: GeminiTurnResponse;
  try {
    parsed = JSON.parse(text) as GeminiTurnResponse;
  } catch {
    // Truncated/malformed JSON from a runaway generation hitting the token
    // cap. Treat it the same as any other upstream failure — the caller
    // (app/api/chat/route.ts) already handles this by returning a clean 502
    // without persisting anything, so the turn isn't burned against the
    // user's turn cap or message-rate limit.
    throw new Error("Gemini returned malformed JSON (likely a truncated runaway generation)");
  }

  assertSaneTurn(parsed);
  return parsed;
}
