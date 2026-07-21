import { Card } from "@/components/ui/Card";
import { KbdBadge } from "@/components/ui/KbdBadge";
import { StartConversationButton } from "./StartConversationButton";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-24 md:grid-cols-[11fr_9fr] md:gap-12 lg:gap-16">
      <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
        <h1 className="animate-fade-in-up m-0 text-4xl font-medium leading-tight text-primary">
          Scope your project. Get a real quote. In one conversation.
        </h1>
        <p
          className="animate-fade-in-up m-0 max-w-md text-base leading-relaxed text-secondary"
          style={{ animationDelay: "80ms" }}
        >
          ScopeAI is an AI project consultant for people who need serious software built —
          student capstones and business systems alike. Answer one sharp question at a time, skip
          the static intake forms, and walk away with a polished project brief plus a transparent
          cost and timeline estimate.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Card
          className="animate-fade-in-up flex w-full items-center justify-between gap-3"
          style={{ animationDelay: "160ms" }}
        >
          <span className="flex-1 text-left text-sm text-muted">
            e.g. I need a booking platform for my growing photography business…
          </span>
          <KbdBadge>↵</KbdBadge>
        </Card>

        <StartConversationButton className="animate-fade-in-up w-full" style={{ animationDelay: "240ms" }} />
      </div>
    </section>
  );
}
