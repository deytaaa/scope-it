import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkSessionCreationLimit } from "@/lib/rate-limit";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { success } = await checkSessionCreationLimit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many sessions started from this network. Please try again later." },
      { status: 429 }
    );
  }

  const session = await prisma.session.create({ data: {} });
  return NextResponse.json({ sessionId: session.id });
}
