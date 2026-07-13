interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] whitespace-pre-wrap rounded-card border-[0.5px] border-border px-4 py-3.5 text-sm leading-relaxed text-primary ${
          isUser ? "bg-chrome" : "bg-card"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
