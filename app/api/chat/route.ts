import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getNextTurn, type ChatHistoryTurn } from "@/lib/gemini";
import { checkCompletion, OPTIONAL_BUT_ASK_ONCE, type RequirementFields } from "@/lib/completion-check";
import type { ExtractedFields } from "@/lib/requirements-schema";
import { generateFinalSummary } from "@/lib/summary";
import { calculateQuote } from "@/lib/pricing";
import { checkMessageLimit } from "@/lib/rate-limit";
import { notifySummaryReady } from "@/lib/notify";

const SCALAR_FIELDS = [
  "projectType",
  "purposeGoals",
  "targetAudience",
  "designPrefs",
  "techStack",
  "platformType",
  "requestedTimelineDays",
  "timeline",
  "budget",
  "additionalNotes",
] as const;

// Mirrors the maxItems caps in lib/requirements-schema.ts — a second,
// independent line of defense in case a degenerate generation ever slips
// past the schema-level constraint.
const ARRAY_FIELD_CAPS = { coreFeatures: 40, userRoles: 15 } as const;
const ARRAY_FIELDS = Object.keys(ARRAY_FIELD_CAPS) as (keyof typeof ARRAY_FIELD_CAPS)[];

const ACTIVE_STATUSES = ["active", "awaiting_contact_info"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Unanchored variant of EMAIL_PATTERN, for finding an email inside a free-text
// message rather than validating a whole string against it.
const EMAIL_SEARCH_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

// A short, unambiguous "no more" reply — used as a fallback when the model
// fails to write the required "skip" sentinel for an optional field it just
// asked about (observed in production: the client replied "None." to being
// asked about additional requirements, and the model left additionalNotes
// empty instead of writing "skip", which stalled the conversation because
// completion-check.ts correctly kept waiting on that field forever).
const DECLINE_PATTERN = /^(none|no|nope|nah|n\/a|na|nothing|nothing else|nothing more|no more|not really|that'?s (it|all)|that is (it|all))[.!]*$/i;

// Fallback question for whichever field checkCompletion still lists as
// missing, used when the model itself produced no next_question (see below).
const FIELD_PROMPTS: Record<string, string> = {
  projectType: "What type of project is this?",
  purposeGoals: "What's the main purpose or goal of the project?",
  targetAudience: "Who will be using this system, and in what capacity?",
  coreFeatures: "What core features or functionality does it need?",
  platformType: "Will this be a web, mobile, or desktop application?",
  designPrefs: "Do you have any design preferences for how it should look and feel?",
  timeline: "Do you have a timeline in mind for this project, or should we skip that?",
  additionalNotes: "Is there anything else you'd like to add, or should we move on?",
};

function hasContent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// Only merges fields the model actually populated with non-empty new info,
// so a turn with no update for a field never clobbers a previously saved value.
function toRequirementUpdate(fields: ExtractedFields) {
  const data: Record<string, unknown> = {};
  for (const field of SCALAR_FIELDS) {
    if (hasContent(fields[field])) {
      data[field] = fields[field];
    }
  }
  for (const field of ARRAY_FIELDS) {
    if (hasContent(fields[field])) {
      data[field] = (fields[field] as unknown[]).slice(0, ARRAY_FIELD_CAPS[field]);
    }
  }
  return data;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId: rawSessionId, message } = body as { sessionId?: string; message?: string };

  if (!rawSessionId || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "sessionId and message are required" }, { status: 400 });
  }
  // Re-bound to a non-optional const: closures below (e.g. finalize) don't
  // retain narrowing on the original destructured variable across function
  // boundaries, so this fixes that at the source instead of asserting later.
  const sessionId: string = rawSessionId;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } }, requirement: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!ACTIVE_STATUSES.includes(session.status)) {
    return NextResponse.json({ error: "This session is no longer active" }, { status: 409 });
  }

  const { success } = await checkMessageLimit(sessionId);
  if (!success) {
    return NextResponse.json(
      { error: "This session has reached its message limit." },
      { status: 429 }
    );
  }

  const history: ChatHistoryTurn[] = [
    ...session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // Gemini is called before anything is persisted: if it fails (e.g. transient
  // quota/network error), the turn shouldn't be burned against the user's turn
  // cap or message-rate limit with no reply ever given.
  let turn;
  try {
    turn = await getNextTurn(history);
  } catch (err) {
    console.error("getNextTurn failed:", err);
    return NextResponse.json(
      { error: "Couldn't reach the assistant right now. Please try again." },
      { status: 502 }
    );
  }

  const requirementUpdate = toRequirementUpdate(turn.extracted_fields);

  if (session.status === "active" && DECLINE_PATTERN.test(message.trim())) {
    const merged: Record<string, unknown> = {
      ...(session.requirement as unknown as Record<string, unknown> | null),
      ...requirementUpdate,
    };
    const stillOpen = OPTIONAL_BUT_ASK_ONCE.filter((field) => !hasContent(merged[field]));
    // Only act when exactly one optional field is still open — if both are,
    // it's ambiguous which one the client is declining, so leave it to the
    // model/normal flow rather than risk marking the wrong field "skip".
    if (stillOpen.length === 1) {
      requirementUpdate[stillOpen[0]] = "skip";
    }
  }

  const requirement = await prisma.requirement.upsert({
    where: { sessionId },
    create: { sessionId, ...requirementUpdate },
    update: requirementUpdate,
  });

  let assistantContent = turn.next_question
    ? `${turn.reply_to_user}\n\n${turn.next_question}`
    : turn.reply_to_user;

  let status = session.status;
  let isComplete = false;
  const sessionUpdate: Prisma.SessionUpdateInput = {};

  async function finalize(contactName: string, contactEmail: string) {
    const quote = calculateQuote({
      platformType: requirement.platformType,
      coreFeatures: requirement.coreFeatures,
      userRoles: requirement.userRoles,
      requestedTimelineDays: requirement.requestedTimelineDays,
    });
    const finalSummary = generateFinalSummary(
      { name: contactName, email: contactEmail },
      requirement,
      quote
    );
    assistantContent = `Thank you for sharing all those details! Here's your complete project summary:\n\n${finalSummary}`;
    status = "complete";
    isComplete = true;

    await prisma.requirement.update({
      where: { sessionId },
      data: {
        isComplete: true,
        estimatedCost: quote.estimatedCost,
        estimatedTimelineDaysMin: quote.estimatedTimelineDaysMin,
        estimatedTimelineDaysMax: quote.estimatedTimelineDaysMax,
        summaryMarkdown: finalSummary,
        pricingBreakdown: quote.breakdown as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      await notifySummaryReady(sessionId, requirement.projectType, {
        name: contactName,
        email: contactEmail,
      });
    } catch (err) {
      console.error("Failed to send completion notification email:", err);
    }
  }

  if (session.status === "awaiting_contact_info") {
    const providedName = turn.extracted_fields.contactName?.trim();
    // Email has an unambiguous, easily-verified format, unlike the other two
    // contact fields — extraction shouldn't depend on model reliability for it.
    // Observed in production: a message containing a name, email, and budget
    // together came back from the model with only the name extracted. Fall
    // back to pulling the email straight out of the raw message when the
    // model didn't find one.
    const providedEmail =
      turn.extracted_fields.contactEmail?.trim() || message.match(EMAIL_SEARCH_PATTERN)?.[0];
    const invalidEmail = providedEmail !== undefined && !EMAIL_PATTERN.test(providedEmail);

    const finalName: string | null = providedName || session.contactName;
    const finalEmail: string | null =
      (providedEmail && !invalidEmail ? providedEmail : undefined) ?? session.contactEmail;

    if (providedName) sessionUpdate.contactName = providedName;
    if (providedEmail && !invalidEmail) sessionUpdate.contactEmail = providedEmail;

    const hasBudget = hasContent(requirement.budget);

    if (finalName && finalEmail && hasBudget) {
      await finalize(finalName, finalEmail);
    } else if (invalidEmail) {
      assistantContent = "That doesn't look like a valid email address — could you double check it?";
      status = "awaiting_contact_info";
    } else {
      // Don't trust the model's own reply here — extraction can silently
      // drop a field even when it was clearly provided, and its text may
      // claim success prematurely. Deterministically ask for exactly what's
      // still missing instead.
      status = "awaiting_contact_info";
      const missing: string[] = [];
      if (!finalName) missing.push("your full name");
      if (!finalEmail) missing.push("your email address");
      if (!hasBudget) missing.push("your estimated budget");
      assistantContent = `Thanks! Could you also share ${joinWithAnd(missing)}?`;
    }
  } else {
    const userTurnCount = await prisma.message.count({ where: { sessionId, role: "user" } });
    const completion = checkCompletion(requirement as unknown as RequirementFields, userTurnCount + 1);

    if (completion.status === "complete") {
      assistantContent = `${assistantContent}\n\nGreat, I think I have a solid understanding of your project! Before I put together your full summary and cost estimate, could you share your full name, email address, and your estimated budget?`;
      status = "awaiting_contact_info";
    } else if (completion.status === "complete-partial") {
      await finalize(session.contactName ?? "Not provided", session.contactEmail ?? "Not provided");
    } else {
      status = "active";
      // The model occasionally believes it has nothing left to ask (empty
      // next_question) even though the backend checklist says otherwise —
      // observed in production: targetAudience was never actually captured,
      // but the model's reply sounded conclusive with no follow-up, making
      // the conversation look finished when it wasn't. Never trust that
      // silence; deterministically ask about whatever's still missing.
      if (!turn.next_question?.trim()) {
        const nextField = completion.missingRequired[0] ?? completion.missingOptional[0];
        const fallbackQuestion = nextField ? FIELD_PROMPTS[nextField] : undefined;
        if (fallbackQuestion) {
          assistantContent = `${turn.reply_to_user}\n\n${fallbackQuestion}`;
        }
      }
    }
  }

  sessionUpdate.status = status;
  await prisma.session.update({ where: { id: sessionId }, data: sessionUpdate });
  await prisma.message.create({ data: { sessionId, role: "user", content: message } });
  await prisma.message.create({ data: { sessionId, role: "assistant", content: assistantContent } });

  return NextResponse.json({ reply: assistantContent, status, isComplete });
}
