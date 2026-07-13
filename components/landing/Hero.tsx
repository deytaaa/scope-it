import { Card } from "@/components/ui/Card";
import { KbdBadge } from "@/components/ui/KbdBadge";
import { StartConversationButton } from "./StartConversationButton";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 pb-16 pt-24 text-center">
      <h1 className="m-0 text-4xl font-medium leading-tight text-primary">
        Tell us about your project. We&apos;ll turn it into a spec.
      </h1>
      <p className="m-0 max-w-md text-base leading-relaxed text-secondary">
        A short conversation with an AI project consultant, one question at a time — no forms,
        no guesswork. When it&apos;s done, you get a clear summary ready for review.
      </p>

      <Card className="flex w-full items-center justify-between gap-3">
        <span className="flex-1 text-left text-sm text-muted">
          e.g. I need a booking app for my photography studio…
        </span>
        <KbdBadge>↵</KbdBadge>
      </Card>

      <StartConversationButton className="w-full" />
    </section>
  );
}
