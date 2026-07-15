import { prisma } from "@/lib/db";
import { SubmissionsTable, type SubmissionRow } from "@/components/admin/SubmissionsTable";

export default async function AdminPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: { requirement: { select: { projectType: true } } },
  });

  const rows: SubmissionRow[] = sessions.map((session) => ({
    id: session.id,
    status: session.status,
    createdAt: session.createdAt.toISOString().slice(0, 10),
    projectType: session.requirement?.projectType ?? null,
    client: session.contactName ?? session.contactEmail ?? null,
  }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium text-primary">Submissions</h1>
      <SubmissionsTable initialSessions={rows} />
    </main>
  );
}
