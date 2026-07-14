import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getNextTurn, type ChatHistoryTurn } from "@/lib/gemini";
import { checkCompletion, type RequirementFields } from "@/lib/completion-check";
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

const ARRAY_FIELDS = ["coreFeatures", "userRoles"] as const;

const ACTIVE_STATUSES = ["active", "awaiting_contact_info"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  for (const field of [...SCALAR_FIELDS, ...ARRAY_FIELDS]) {
    if (hasContent(fields[field])) {
      data[field] = fields[field];
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
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the assistant right now. Please try again." },
      { status: 502 }
    );
  }

  const requirementUpdate = toRequirementUpdate(turn.extracted_fields);
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
    const providedEmail = turn.extracted_fields.contactEmail?.trim();
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
    }
  }

  sessionUpdate.status = status;
  await prisma.session.update({ where: { id: sessionId }, data: sessionUpdate });
  await prisma.message.create({ data: { sessionId, role: "user", content: message } });
  await prisma.message.create({ data: { sessionId, role: "assistant", content: assistantContent } });

  return NextResponse.json({ reply: assistantContent, status, isComplete });
}
