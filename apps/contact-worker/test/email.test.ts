import { describe, expect, it } from "vitest";
import {
  CLIENT_REQUEST_ID,
  call,
  siteverify,
  submissionRequest,
  testingKeyPass,
  validSubmission,
} from "./helpers.ts";

type Sent = EmailMessageBuilder[];

// The Email binding is the provider boundary; this double records messages.
function emailBinding(sent: Sent, outcome: () => Promise<EmailSendResult>) {
  return {
    send: async (message: EmailMessageBuilder) => {
      sent.push(message);
      return outcome();
    },
  } as unknown as SendEmail;
}

const accepted = async () => ({ messageId: "<test-message@jopy.dev>" });

function submit(
  binding: SendEmail,
  fetcher = siteverify(testingKeyPass()),
  overrides: Record<string, unknown> = {},
) {
  return call(
    submissionRequest(JSON.stringify(validSubmission(overrides))),
    { CONTACT_EMAIL: binding },
    { fetch: fetcher },
  );
}

describe("owner notification email", () => {
  it("builds a plain-text message to the private destination", async () => {
    const sent: Sent = [];
    await submit(emailBinding(sent, accepted));
    expect(sent).toEqual([
      {
        from: { email: "contact@jopy.dev", name: "Jopy Dev Portfolio" },
        to: "owner@example.test",
        replyTo: "ada@example.test",
        subject: "[Portfolio] Project enquiry",
        text: [
          "New message from the portfolio contact form.",
          "",
          "Name: Ada Lovelace",
          "Email: ada@example.test",
          "Subject: Project enquiry",
          `Request ID: ${CLIENT_REQUEST_ID}`,
          "",
          "Message:",
          "Hello,",
          "I would like to talk about a project.",
        ].join("\n"),
      },
    ]);
  });

  it("sends nothing when Turnstile rejects the token", async () => {
    const sent: Sent = [];
    const rejected = siteverify({
      success: false,
      "error-codes": ["invalid-input-response"],
    });
    await submit(emailBinding(sent, accepted), rejected);
    expect(sent).toHaveLength(0);
  });

  it("answers delivery_failed after one provider rejection, without retrying", async () => {
    const sent: Sent = [];
    const failing = emailBinding(sent, () =>
      Promise.reject(
        Object.assign(new Error("sender not verified"), {
          code: "E_SENDER_NOT_VERIFIED",
        }),
      ),
    );
    const response = await submit(failing);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      code: "delivery_failed",
      requestId: CLIENT_REQUEST_ID,
    });
    expect(sent).toHaveLength(1);
  });
});
