import { Resend } from "resend";

let resend: Resend | undefined;

function getClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function notifySummaryReady(
  sessionId: string,
  projectType?: string | null,
  contact?: { name?: string | null; email?: string | null }
) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    throw new Error("ADMIN_NOTIFICATION_EMAIL environment variable is not set");
  }

  const subject = projectType
    ? `New project submission ready for review: ${projectType}`
    : "New project submission ready for review";

  const contactLine =
    contact?.name || contact?.email
      ? `\nClient: ${contact?.name ?? "(no name)"} <${contact?.email ?? "no email"}>`
      : "";

  await getClient().emails.send({
    from: "onboarding@resend.dev",
    to: adminEmail,
    subject,
    text: `A new project intake conversation has finished and is ready for review.\n\nSession ID: ${sessionId}${contactLine}\n\nOpen it in the admin view at /admin/${sessionId}.`,
  });
}
