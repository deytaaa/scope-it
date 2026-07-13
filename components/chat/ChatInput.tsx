"use client";

import type { FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { KbdBadge } from "@/components/ui/KbdBadge";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSubmit, disabled, placeholder }: ChatInputProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="flex items-center gap-3">
        <input
          className="flex-1 bg-transparent font-mono text-sm text-primary outline-none placeholder:text-muted disabled:opacity-60"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Type your reply…"}
          disabled={disabled}
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="cursor-pointer disabled:cursor-default"
        >
          <KbdBadge>↵</KbdBadge>
        </button>
      </Card>
    </form>
  );
}
