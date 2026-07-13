import { Card } from "@/components/ui/Card";

const SECTIONS = [
  {
    title: "Project basics",
    description: "What you're building, who it's for, and what problem it solves.",
  },
  {
    title: "Features and design",
    description: "The must-have features and how you want the product to look and feel.",
  },
  {
    title: "Logistics",
    description: "Timeline, budget, and any technical constraints you already know about.",
  },
];

export function CoverageCards() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-3">
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <p className="m-0 mb-2 text-sm text-primary">{section.title}</p>
          <p className="m-0 text-[13px] leading-relaxed text-secondary">{section.description}</p>
        </Card>
      ))}
    </div>
  );
}
