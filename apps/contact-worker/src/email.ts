import type { ContactRequest } from "@jopy-dev/contact-contract";

export const SENDER = { email: "contact@jopy.dev", name: "Jopy Dev Portfolio" };
const SUBJECT_PREFIX = "[Portfolio]";

// Plain text only, built through the structured API: visitor values never
// become raw headers, and the schema already rejected CR/LF in single-line
// fields, so the subject cannot smuggle extra headers.
export function buildContactEmail(
  contact: ContactRequest,
  destination: string,
): EmailMessageBuilder {
  return {
    from: SENDER,
    to: destination,
    replyTo: contact.email,
    subject: `${SUBJECT_PREFIX} ${contact.subject}`,
    text: [
      "New message from the portfolio contact form.",
      "",
      `Name: ${contact.name}`,
      `Email: ${contact.email}`,
      `Subject: ${contact.subject}`,
      `Request ID: ${contact.requestId}`,
      "",
      "Message:",
      contact.message,
    ].join("\n"),
  };
}

export type Delivery = { sent: true; messageId: string } | { sent: false };

// Exactly one send attempt: a retry could duplicate the owner's email because
// nothing records which messages were already delivered. Provider error
// details stay here; callers only learn sent / not sent.
export async function deliver(
  binding: SendEmail,
  message: EmailMessageBuilder,
): Promise<Delivery> {
  try {
    const result = await binding.send(message);
    return { sent: true, messageId: result.messageId };
  } catch {
    return { sent: false };
  }
}
