"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { pillClassName } from "@/components/ui/Pill";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  sessionId: string;
  initialMessages?: ChatMessage[];
  initialStatus?: string;
}

const FINAL_STATUSES = ["complete", "complete-partial"];

export function ChatWindow({ sessionId, initialMessages = [], initialStatus = "active" }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(FINAL_STATUSES.includes(initialStatus));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  async function handleSend() {
    const content = inputValue.trim();
    if (!content) return;

    setMessages((prev) => [...prev, { role: "user", content }]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => prev.slice(0, -1));
        setInputValue(content);
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.isComplete) {
        setIsComplete(true);
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setInputValue(content);
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-8">
      <div className="flex min-h-[50vh] flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted">Tell us about the project you have in mind to get started.</p>
        )}
        {messages.map((message, i) => (
          <MessageBubble key={i} role={message.role} content={message.content} />
        ))}
        {isLoading && <p className="text-sm text-muted">Thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {isComplete ? (
        <div className="sticky bottom-0 flex flex-col items-center gap-4 bg-page pb-6 pt-4 text-center">
          <p className="text-sm text-secondary">
            This conversation is complete. Thanks for the details — we&apos;ll be in touch.
          </p>
          <Link href="/" className={pillClassName}>
            Back to homepage
          </Link>
        </div>
      ) : (
        <div className="sticky bottom-0 flex flex-col gap-2 bg-page pb-6 pt-4">
          <ChatInput value={inputValue} onChange={setInputValue} onSubmit={handleSend} disabled={isLoading} />
          {error && <p className="text-sm text-secondary">{error}</p>}
        </div>
      )}
    </div>
  );
}
