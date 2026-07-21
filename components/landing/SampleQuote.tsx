import { Card } from "@/components/ui/Card";

const SCOPE_ITEMS = [
  "Barcode inventory tracking",
  "Role-based staff access",
  "Sales & stock analytics dashboard",
];

export function SampleQuote() {
  return (
    <section
      className="animate-fade-in-up mx-auto max-w-md px-6 pb-16"
      style={{ animationDelay: "560ms" }}
    >
      <p className="m-0 mb-3 text-center text-xs uppercase tracking-wide text-muted">
        Sample quote — illustrative only
      </p>
      <Card>
        <p className="m-0 mb-1 text-sm text-primary">Inventory Management System</p>
        <p className="m-0 mb-4 text-xs text-secondary">Commercial project</p>

        <div className="mb-4 flex items-baseline justify-between border-b-[0.5px] border-border pb-4">
          <div>
            <p className="m-0 text-xs text-secondary">Estimated cost</p>
            <p className="m-0 text-2xl text-primary">₱35,000</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-xs text-secondary">Timeline</p>
            <p className="m-0 text-lg text-primary">5–7 weeks</p>
          </div>
        </div>

        <p className="m-0 mb-2 text-xs text-secondary">Scope of work</p>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-secondary">
          {SCOPE_ITEMS.map((item) => (
            <li key={item}>— {item}</li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
