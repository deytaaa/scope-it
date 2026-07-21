const STEPS = [
  {
    number: "01",
    title: "Describe your project",
    description: "Tell us what you're building in your own words — no forms, no dropdowns.",
  },
  {
    number: "02",
    title: "Answer a few sharp questions",
    description: "One question at a time, only the ones that actually matter for your project.",
  },
  {
    number: "03",
    title: "Get your quote",
    description: "A complete project brief plus a transparent cost and timeline estimate.",
  },
];

// Deliberately not another bordered card grid — the page already has two of
// those (coverage cards, portfolio teaser). A quiet divided strip reads as a
// literal sequence (which this is) rather than three more boxes competing
// for the same attention.
export function HowItWorks() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-16">
      <div className="grid grid-cols-1 divide-y-[0.5px] divide-border border-y-[0.5px] border-border sm:grid-cols-3 sm:divide-x-[0.5px] sm:divide-y-0">
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            className="animate-fade-in-up px-6 py-6"
            style={{ animationDelay: `${320 + i * 80}ms` }}
          >
            <p className="m-0 mb-2 text-xs tabular-nums text-muted">{step.number}</p>
            <p className="m-0 mb-1 text-sm text-primary">{step.title}</p>
            <p className="m-0 text-[13px] leading-relaxed text-secondary">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
