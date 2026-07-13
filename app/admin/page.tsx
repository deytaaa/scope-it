import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: { requirement: { select: { projectType: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium text-primary">Submissions</h1>

      <div className="overflow-hidden rounded-card border-[0.5px] border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-[0.5px] border-border text-left text-secondary">
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Created</th>
              <th className="px-4 py-3 font-normal">Project type</th>
              <th className="px-4 py-3 font-normal">Client</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b-[0.5px] border-border last:border-0">
                <td className="px-4 py-3 text-primary">{session.status}</td>
                <td className="px-4 py-3 text-secondary">
                  {session.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-secondary">
                  {session.requirement?.projectType ?? "—"}
                </td>
                <td className="px-4 py-3 text-secondary">
                  {session.contactName ?? session.contactEmail ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/${session.id}`} className="text-primary underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
