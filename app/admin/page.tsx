import { prisma } from "@/lib/db";
import { SubmissionsTable, type SubmissionRow } from "@/components/admin/SubmissionsTable";

// This route has no dynamic API usage (no cookies()/headers()/uncached
// fetch()), so without this, Next.js's build treats it as a static-rendering
// candidate — on Vercel that means it's prerendered once and served as a
// frozen snapshot from the CDN until the next deploy, regardless of what
// changes in the database. next dev never applies this optimization, which
// is why the staleness only ever showed up in production. force-dynamic
// opts this page out of the Full Route Cache entirely: the Prisma query
// below runs fresh on every request, matching what an admin dashboard
// actually needs (always-current data, not cacheable at all).
export const dynamic = "force-dynamic";

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
