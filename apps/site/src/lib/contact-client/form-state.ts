import type { FieldErrors } from "./fields.ts";
import type { SendOutcome } from "./send-contact.ts";

// Every state the contact form can be in: in-progress phases plus each
// terminal outcome of a send.
export type ContactPhase =
  | "idle"
  | "validating"
  | "challenge-required"
  | "verifying"
  | "sending"
  | SendOutcome["state"];

export type ContactFormState = {
  phase: ContactPhase;
  fieldErrors: FieldErrors;
  retryAfterSeconds?: number;
  unconfigured?: boolean;
};

export type ContactFormEvent =
  | {
      // Computed by validateContactFields, which loads with the form logic.
      type: "submit";
      fieldErrors: FieldErrors;
      configured: boolean;
      tokenReady: boolean;
    }
  | { type: "token" }
  | { type: "dispatch" }
  | { type: "outcome"; outcome: SendOutcome };

export const INITIAL_FORM_STATE: ContactFormState = {
  phase: "idle",
  fieldErrors: {},
};

const BUSY: ReadonlySet<ContactPhase> = new Set([
  "validating",
  "verifying",
  "sending",
]);

function submitted(
  event: Extract<ContactFormEvent, { type: "submit" }>,
): ContactFormState {
  const { fieldErrors } = event;
  if (Object.keys(fieldErrors).length > 0) {
    return { phase: "validation-failed", fieldErrors };
  }
  if (!event.configured) {
    return { phase: "transport-failed", fieldErrors, unconfigured: true };
  }
  return {
    phase: event.tokenReady ? "verifying" : "challenge-required",
    fieldErrors,
  };
}

function settled(outcome: SendOutcome): ContactFormState {
  return outcome.state === "rate-limited"
    ? {
        phase: outcome.state,
        fieldErrors: {},
        retryAfterSeconds: outcome.retryAfterSeconds,
      }
    : { phase: outcome.state, fieldErrors: {} };
}

// Moves `from` -> `to` only when the form is currently in `from`.
function advance(
  state: ContactFormState,
  from: ContactPhase,
  to: ContactPhase,
) {
  return state.phase === from ? { ...state, phase: to } : state;
}

type Handlers = {
  [K in ContactFormEvent["type"]]: (
    state: ContactFormState,
    event: Extract<ContactFormEvent, { type: K }>,
  ) => ContactFormState;
};

const HANDLERS: Handlers = {
  submit: (state, event) => (BUSY.has(state.phase) ? state : submitted(event)),
  token: (state) => advance(state, "challenge-required", "verifying"),
  dispatch: (state) => advance(state, "verifying", "sending"),
  outcome: (_state, event) => settled(event.outcome),
};

// Entered values live in the form controls, not here, so every failure path
// preserves them; only the success handler clears the form.
export function reduceContactForm(
  state: ContactFormState,
  event: ContactFormEvent,
): ContactFormState {
  const handle = HANDLERS[event.type] as (
    state: ContactFormState,
    event: ContactFormEvent,
  ) => ContactFormState;
  return handle(state, event);
}

export type StatusTone = "neutral" | "success" | "error";

const SENDING = "Sending your message…";

// Approved status text for each form state; keep the wording exact.
const COPY: Record<ContactPhase, { text: string; tone: StatusTone }> = {
  idle: { text: "", tone: "neutral" },
  validating: { text: "", tone: "neutral" },
  "challenge-required": {
    text: "Complete the verification check to send your message.",
    tone: "neutral",
  },
  verifying: { text: SENDING, tone: "neutral" },
  sending: { text: SENDING, tone: "neutral" },
  success: {
    text: "Message sent. Thank you for reaching out.",
    tone: "success",
  },
  "validation-failed": {
    text: "Check the highlighted fields and try again.",
    tone: "error",
  },
  "verification-failed": {
    text: "Verification didn't pass. Complete the check again, then resend.",
    tone: "error",
  },
  "rate-limited": { text: "", tone: "error" },
  "delivery-failed": {
    text: "Your message couldn't be delivered right now. Your text is still here, so you can try again later.",
    tone: "error",
  },
  "transport-failed": {
    text: "The message couldn't reach the server. Check your connection and try again.",
    tone: "error",
  },
  "delivery-uncertain": {
    text: "We couldn't confirm whether your message was sent. It may have arrived; sending again could create a duplicate.",
    tone: "error",
  },
};

const UNAVAILABLE =
  "The contact form is unavailable right now. Please try again later.";

function retryText(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  const unit = minutes === 1 ? "minute" : "minutes";
  return `Too many attempts from this connection. Try again in ${minutes} ${unit}.`;
}

export function statusFor(state: ContactFormState): {
  text: string;
  tone: StatusTone;
} {
  if (state.unconfigured) return { text: UNAVAILABLE, tone: "error" };
  if (state.phase === "rate-limited") {
    return { text: retryText(state.retryAfterSeconds ?? 600), tone: "error" };
  }
  return COPY[state.phase];
}
