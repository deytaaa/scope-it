import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) {
    notFound();
  }

  return (
    <ChatWindow
      sessionId={sessionId}
      initialMessages={session.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))}
      initialStatus={session.status}
    />
  );
}
