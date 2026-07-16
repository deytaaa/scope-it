"use client";

import { useState } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  /** Only set on the final assistant message once the conversation completes. */
  showCopyButton?: boolean;
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function MessageBubble({ role, content, showCopyButton }: MessageBubbleProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (insecure context, denied permission) — a
      // failed copy isn't worth surfacing as an alarming error, so fail quiet.
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-card border-[0.5px] border-border px-4 py-3.5 text-sm leading-relaxed text-primary ${
          isUser ? "bg-chrome" : "bg-card"
        }`}
      >
        <p className="m-0 whitespace-pre-wrap">{content}</p>
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 flex cursor-pointer items-center gap-1.5 border-t-[0.5px] border-border pt-3 text-xs text-secondary transition-colors duration-150 hover:text-primary"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy summary"}
          </button>
        )}
      </div>
    </div>
  );
}
