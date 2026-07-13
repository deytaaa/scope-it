import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getNextTurn, type ChatHistoryTurn } from "@/lib/gemini";
import { checkCompletion, type RequirementFields } from "@/lib/completion-check";
import type { ExtractedFields } from "@/lib/requirements-schema";
import { generateSummaryMarkdown } from "@/lib/summary";
import { calculateQuote } from "@/lib/pricing";
import { generateQuoteMarkdown } from "@/lib/quote";
import { checkMessageLimit } from "@/lib/rate-limit";
import { notifySummaryReady } from "@/lib/notify";

const SCALAR_FIELDS = [
  "projectCategory",
  "projectType",
  "purposeGoals",
  "targetAudience",
  "designPrefs",
  "brandingAssets",
  "techStack",
  "platformType",
  "schoolRequirements",
  "requestedTimelineDays",
  "timeline",
  "budget",
  "additionalNotes",
] as const;

const ARRAY_FIELDS = ["coreFeatures", "userRoles"] as const;

const ACTIVE_STATUSES = ["active", "awaiting_confirmation", "awaiting_contact_info"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasContent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
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
  const { sessionId, message } = body as { sessionId?: string; message?: string };

  if (!sessionId || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "sessionId and message are required" }, { status: 400 });
  }

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

  if (session.status === "awaiting_confirmation" && turn.client_confirmed === true) {
    // Client confirmed the drafted summary — ask for contact info before finalizing.
    status = "awaiting_contact_info";
    assistantContent = `${assistantContent}\n\nGreat! Before I put together your project brief and quote, could I get your name and email so we can send it over?`;
  } else if (session.status === "awaiting_contact_info") {
    const providedName = turn.extracted_fields.contactName?.trim();
    const providedEmail = turn.extracted_fields.contactEmail?.trim();
    const invalidEmail = providedEmail !== undefined && !EMAIL_PATTERN.test(providedEmail);

    const finalName: string | null = providedName || session.contactName;
    const finalEmail: string | null = (providedEmail && !invalidEmail ? providedEmail : undefined) ?? session.contactEmail;

    if (providedName) sessionUpdate.contactName = providedName;
    if (providedEmail && !invalidEmail) sessionUpdate.contactEmail = providedEmail;

    if (finalName && finalEmail) {
      const quote = calculateQuote({
        projectCategory: requirement.projectCategory,
        platformType: requirement.platformType,
        coreFeatures: requirement.coreFeatures,
        userRoles: requirement.userRoles,
        requestedTimelineDays: requirement.requestedTimelineDays,
      });
      const quoteMarkdown = generateQuoteMarkdown(requirement, quote);
      assistantContent = `Thanks, ${finalName}! Here's your project brief and quote:\n\n${quoteMarkdown}`;
      status = "complete";
      isComplete = true;

      await prisma.requirement.update({
        where: { sessionId },
        data: {
          isComplete: true,
          estimatedCost: quote.estimatedCost,
          estimatedTimelineDaysMin: quote.estimatedTimelineDaysMin,
          estimatedTimelineDaysMax: quote.estimatedTimelineDaysMax,
          quoteMarkdown,
          pricingBreakdown: quote.breakdown as unknown as Prisma.InputJsonValue,
        },
      });

      try {
        await notifySummaryReady(sessionId, requirement.projectType, {
          name: finalName,
          email: finalEmail,
        });
      } catch (err) {
        console.error("Failed to send completion notification email:", err);
      }
    } else if (invalidEmail) {
      assistantContent = "That doesn't look like a valid email address — could you double check it?";
      status = "awaiting_contact_info";
    } else {
      // Don't trust the model's own reply here — extraction can silently
      // drop one of the two fields even when both were clearly provided in
      // the same message, and its text may claim success prematurely.
      // Deterministically ask for exactly what's still missing instead.
      status = "awaiting_contact_info";
      if (!finalName && !finalEmail) {
        assistantContent = "Could you share your name and email so we can send over the project brief and quote?";
      } else if (!finalName) {
        assistantContent = "Thanks! And what name should we use for the project brief?";
      } else {
        assistantContent = `Thanks, ${finalName}! What's the best email to send the project brief and quote to?`;
      }
    }
  } else {
    // Either still gathering info, or the client asked for a change while
    // awaiting confirmation — either way, re-evaluate completeness against
    // the just-updated requirement (a correction can immediately re-satisfy
    // completeness and re-draft the summary in this same turn).
    const userTurnCount = await prisma.message.count({ where: { sessionId, role: "user" } });
    const completion = checkCompletion(requirement as unknown as RequirementFields, userTurnCount + 1);

    if (completion.status === "complete") {
      const summaryMarkdown = generateSummaryMarkdown(requirement);
      assistantContent = `${assistantContent}\n\n---\n\nHere's what I've got so far:\n\n${summaryMarkdown}\n\nDoes this look correct? Reply "yes" to confirm, or let me know what needs to change.`;
      status = "awaiting_confirmation";
      await prisma.requirement.update({ where: { sessionId }, data: { summaryMarkdown } });
    } else if (completion.status === "complete-partial") {
      const summaryMarkdown = generateSummaryMarkdown(requirement);
      status = "complete-partial";
      isComplete = true;
      await prisma.requirement.update({
        where: { sessionId },
        data: { isComplete: true, summaryMarkdown },
      });

      try {
        await notifySummaryReady(sessionId, requirement.projectType);
      } catch (err) {
        console.error("Failed to send completion notification email:", err);
      }
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
