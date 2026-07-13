export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-6 text-2xl font-medium text-primary">About ConsultAI</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-secondary">
        <p className="m-0">
          ConsultAI is a conversational alternative to the usual project intake form. Instead of
          filling out fields, you talk through what you&apos;re building with an AI project
          consultant — the kind of back-and-forth you&apos;d have with a developer on a discovery
          call, minus the scheduling.
        </p>
        <p className="m-0">
          The conversation adapts to what you&apos;re building. Academic and capstone projects get
          asked about tech stack, platform, and any school requirements; business and commercial
          projects get asked about the people who&apos;ll use the system and the problems it needs
          to solve — we figure out the right technical approach ourselves. Either way, it&apos;s
          one question at a time, no walls of form fields.
        </p>
        <p className="m-0">
          Once we have enough to go on, you&apos;ll get a clear summary to confirm, followed by an
          initial cost and timeline estimate. From there, a real person reviews everything and
          reaches out to finalize the details.
        </p>
      </div>
    </main>
  );
}
