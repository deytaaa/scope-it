import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Auth is enforced by proxy.ts (matcher covers /api/admin/:path*), the same
// Basic Auth gate protecting the /admin pages — this route relies on that
// rather than duplicating the check here.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: "This submission no longer exists." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { sessionId: id } }),
    prisma.requirement.deleteMany({ where: { sessionId: id } }),
    prisma.session.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
