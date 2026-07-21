import { Card } from "@/components/ui/Card";

const SECTIONS = [
  {
    title: "Project scope",
    description: "What you're building, who it's for, and the outcome you actually need.",
  },
  {
    title: "Features & design",
    description: "The functionality that matters most, and how you want it to look and feel.",
  },
  {
    title: "Cost & timeline",
    description: "Your budget and deadline, turned into a clear, itemized estimate — not a guess.",
  },
];

export function CoverageCards() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-3">
      {SECTIONS.map((section, i) => (
        <Card
          key={section.title}
          className="elevated-card animate-fade-in-up"
          style={{ animationDelay: `${640 + i * 80}ms` }}
        >
          <p className="m-0 mb-2 text-sm text-primary">{section.title}</p>
          <p className="m-0 text-[13px] leading-relaxed text-secondary">{section.description}</p>
        </Card>
      ))}
    </div>
  );
}
