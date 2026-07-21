"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/Pill";

interface StartConversationButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function StartConversationButton({ className, style }: StartConversationButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startConversation() {
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/session", { method: "POST" });
      if (!res.ok) {
        setError("Couldn't start a session right now. Please try again.");
        return;
      }
      const { sessionId } = await res.json();
      router.push(`/chat/${sessionId}`);
    } catch {
      setError("Couldn't start a session right now. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className={["flex flex-col items-center gap-3", className].filter(Boolean).join(" ")} style={style}>
      <Pill onClick={startConversation} disabled={isStarting}>
        {isStarting ? "Starting…" : "Get my project estimate"}
      </Pill>
      <p className="m-0 text-sm text-muted">Takes about 3 minutes · no signup needed</p>
      {error && <p className="m-0 text-sm text-secondary">{error}</p>}
    </div>
  );
}
