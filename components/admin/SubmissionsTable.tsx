"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface SubmissionRow {
  id: string;
  status: string;
  createdAt: string;
  projectType: string | null;
  client: string | null;
}

const ACTION_LINK_CLASS = "text-primary underline disabled:cursor-default disabled:opacity-60";

export function SubmissionsTable({ initialSessions }: { initialSessions: SubmissionRow[] }) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });

      if (res.status === 404) {
        // Already gone (e.g. deleted from another tab) — treat as success
        // since the end state the user wanted (row gone) is already true.
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setMessage({ type: "success", text: "This submission was already deleted." });
        router.refresh();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: data?.error ?? "Failed to delete this submission. Please try again." });
        return;
      }

      setSessions((prev) => prev.filter((s) => s.id !== id));
      setMessage({ type: "success", text: "Submission deleted." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Please check your connection and try again." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {message && (
        <p
          className={`mb-4 text-sm ${message.type === "error" ? "text-secondary" : "text-primary"}`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div className="overflow-hidden rounded-card border-[0.5px] border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-[0.5px] border-border text-left text-secondary">
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Created</th>
              <th className="px-4 py-3 font-normal">Project type</th>
              <th className="px-4 py-3 font-normal">Client</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b-[0.5px] border-border last:border-0">
                <td className="px-4 py-3 text-primary">{session.status}</td>
                <td className="px-4 py-3 text-secondary">{session.createdAt}</td>
                <td className="px-4 py-3 text-secondary">{session.projectType ?? "—"}</td>
                <td className="px-4 py-3 text-secondary">{session.client ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/${session.id}`} className={ACTION_LINK_CLASS}>
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                      className={ACTION_LINK_CLASS}
                    >
                      {deletingId === session.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
