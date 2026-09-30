import assert from "node:assert/strict";
import test from "node:test";
import {
  INITIAL_FORM_STATE,
  reduceContactForm,
  statusFor,
} from "../../apps/site/src/lib/contact-client/form-state.ts";
import { validateContactFields } from "../../apps/site/src/lib/contact-client/validate-fields.ts";

const VALID = {
  name: "Ada",
  email: "ada@example.test",
  subject: "Hi",
  message: "Hello",
};

function run(events, from = INITIAL_FORM_STATE) {
  return events.reduce(reduceContactForm, from);
}

// Mirrors the form: fields are validated, then the result is submitted.
const submit = ({ fields = VALID, ...overrides } = {}) => ({
  type: "submit",
  fieldErrors: validateContactFields(fields),
  configured: true,
  tokenReady: true,
  ...overrides,
});

test("a valid submit with a fresh token goes straight to verifying", () => {
  assert.equal(run([submit()]).phase, "verifying");
});

test("invalid fields stop at validation-failed with per-field errors", () => {
  const state = run([submit({ fields: { ...VALID, email: "x" } })]);
  assert.equal(state.phase, "validation-failed");
  assert.deepEqual(state.fieldErrors, {
    email: "Enter a valid email address.",
  });
});

test("a missing token waits in challenge-required, then resumes on the widget callback", () => {
  const waiting = run([submit({ tokenReady: false })]);
  assert.equal(waiting.phase, "challenge-required");
  assert.equal(run([{ type: "token" }], waiting).phase, "verifying");
});

test("a token arriving outside a pending submit changes nothing", () => {
  assert.equal(run([{ type: "token" }]).phase, "idle");
});

test("an unconfigured build reports the form as unavailable", () => {
  const state = run([submit({ configured: false })]);
  assert.equal(state.phase, "transport-failed");
  assert.equal(
    statusFor(state).text,
    "The contact form is unavailable right now. Please try again later.",
  );
});

test("verifying moves to sending once the request is dispatched", () => {
  assert.equal(run([submit(), { type: "dispatch" }]).phase, "sending");
});

test("repeat submits are ignored while verifying or sending", () => {
  const sending = run([submit(), { type: "dispatch" }]);
  assert.equal(run([submit()], sending), sending);
});

test("each Worker outcome becomes the terminal phase", () => {
  const sending = run([submit(), { type: "dispatch" }]);
  const limited = run(
    [
      {
        type: "outcome",
        outcome: { state: "rate-limited", retryAfterSeconds: 61 },
      },
    ],
    sending,
  );
  assert.equal(limited.phase, "rate-limited");
  assert.equal(limited.retryAfterSeconds, 61);
});

test("a failed attempt can be resubmitted explicitly", () => {
  const failed = run([
    submit(),
    { type: "dispatch" },
    { type: "outcome", outcome: { state: "delivery-uncertain" } },
  ]);
  assert.equal(run([submit()], failed).phase, "verifying");
});

for (const [phase, text, tone] of [
  ["idle", "", "neutral"],
  [
    "challenge-required",
    "Complete the verification check to send your message.",
    "neutral",
  ],
  ["verifying", "Sending your message…", "neutral"],
  ["sending", "Sending your message…", "neutral"],
  ["success", "Message sent. Thank you for reaching out.", "success"],
  ["validation-failed", "Check the highlighted fields and try again.", "error"],
  [
    "verification-failed",
    "Verification didn't pass. Complete the check again, then resend.",
    "error",
  ],
  [
    "delivery-failed",
    "Your message couldn't be delivered right now. Your text is still here, so you can try again later.",
    "error",
  ],
  [
    "transport-failed",
    "The message couldn't reach the server. Check your connection and try again.",
    "error",
  ],
  [
    "delivery-uncertain",
    "We couldn't confirm whether your message was sent. It may have arrived; sending again could create a duplicate.",
    "error",
  ],
]) {
  test(`shows approved copy for ${phase}`, () => {
    assert.deepEqual(statusFor({ ...INITIAL_FORM_STATE, phase }), {
      text,
      tone,
    });
  });
}

for (const [seconds, text] of [
  [1, "Too many attempts from this connection. Try again in 1 minute."],
  [60, "Too many attempts from this connection. Try again in 1 minute."],
  [61, "Too many attempts from this connection. Try again in 2 minutes."],
  [600, "Too many attempts from this connection. Try again in 10 minutes."],
]) {
  test(`rounds ${seconds} s of retry-after up to whole minutes`, () => {
    const state = {
      ...INITIAL_FORM_STATE,
      phase: "rate-limited",
      retryAfterSeconds: seconds,
    };
    assert.deepEqual(statusFor(state), { text, tone: "error" });
  });
}
