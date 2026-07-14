import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateSummaryMarkdown } from "@/lib/summary";
import { RATE_CARD } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { MessageBubble } from "@/components/chat/MessageBubble";

function formatField(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "name" in item) {
          const feature = item as { name: unknown; complexity?: unknown };
          return feature.complexity ? `${feature.name} (${feature.complexity})` : String(feature.name);
        }
        return String(item);
      })
      .join(", ");
  }
  return String(value);
}

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      requirement: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    notFound();
  }

  const summaryMarkdown =
    session.requirement?.summaryMarkdown ??
    (session.requirement ? generateSummaryMarkdown(session.requirement) : null);

  const rawFields: Array<[string, string]> = session.requirement
    ? [
        ["Project type", formatField(session.requirement.projectType)],
        ["Purpose / goals", formatField(session.requirement.purposeGoals)],
        ["Target audience", formatField(session.requirement.targetAudience)],
        ["Core features", formatField(session.requirement.coreFeatures)],
        ["Design preferences", formatField(session.requirement.designPrefs)],
        ["User roles", formatField(session.requirement.userRoles)],
        ["Tech stack", formatField(session.requirement.techStack)],
        ["Platform type", formatField(session.requirement.platformType)],
        ["Timeline", formatField(session.requirement.timeline)],
        ["Requested timeline (days)", formatField(session.requirement.requestedTimelineDays)],
        ["Budget", formatField(session.requirement.budget)],
        [
          "Estimated cost",
          session.requirement.estimatedCost != null
            ? `${RATE_CARD.currency}${session.requirement.estimatedCost.toLocaleString("en-US")}`
            : "—",
        ],
        ["Additional notes", formatField(session.requirement.additionalNotes)],
      ]
    : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin" className="text-sm text-secondary underline">
        ← back to submissions
      </Link>

      <h1 className="mb-2 mt-4 text-2xl font-medium text-primary">Submission detail</h1>
      <p className="mb-1 text-sm text-secondary">Status: {session.status}</p>
      <p className="mb-8 text-sm text-secondary">
        Client: {session.contactName ?? "—"}
        {session.contactEmail ? ` <${session.contactEmail}>` : ""}
      </p>

      <h2 className="mb-3 text-lg text-primary">Summary</h2>
      {summaryMarkdown ? (
        <Card className="mb-8 whitespace-pre-wrap text-sm leading-relaxed text-primary">
          {summaryMarkdown}
        </Card>
      ) : (
        <p className="mb-8 text-sm text-muted">No requirement data yet.</p>
      )}

      <h2 className="mb-3 text-lg text-primary">Raw fields</h2>
      <Card className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rawFields.length === 0 && <p className="text-sm text-muted">No requirement data yet.</p>}
        {rawFields.map(([label, value]) => (
          <div key={label}>
            <p className="m-0 mb-1 text-xs text-secondary">{label}</p>
            <p className="m-0 text-sm text-primary">{value}</p>
          </div>
        ))}
      </Card>

      <h2 className="mb-3 text-lg text-primary">Transcript</h2>
      <div className="flex flex-col gap-3">
        {session.messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
        {session.messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={message.content}
          />
        ))}
      </div>
    </main>
  );
}
