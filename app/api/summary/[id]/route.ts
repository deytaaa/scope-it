import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSummaryMarkdown } from "@/lib/summary";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const requirement = await prisma.requirement.findUnique({
    where: { sessionId },
  });

  if (!requirement) {
    return NextResponse.json({ error: "No requirement found for this session" }, { status: 404 });
  }

  const summaryMarkdown = generateSummaryMarkdown(requirement);

  return NextResponse.json({
    sessionId,
    isComplete: requirement.isComplete,
    summaryMarkdown,
  });
}
