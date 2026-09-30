"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { TurnstileHandle } from "@/components/contact/turnstile-widget";
import {
  type ContactFields,
  FIELD_ORDER,
  type FieldErrors,
} from "@/lib/contact-client/fields";
import {
  INITIAL_FORM_STATE,
  reduceContactForm,
  statusFor,
} from "@/lib/contact-client/form-state";
import type { ContactConfig } from "@/lib/env";

const BUSY_PHASES = new Set(["verifying", "sending"]);

type ContactEngine = typeof import("@/lib/contact-client/contact-engine");
let engine: Promise<ContactEngine> | null = null;

// Validation and sending share the request schema, so they load together on
// the first focus, press, or submit instead of with the page.
function loadEngine(): Promise<ContactEngine> {
  engine ??= import("@/lib/contact-client/contact-engine").catch((error) => {
    engine = null;
    throw error;
  });
  return engine;
}

type Submitted = { fields: ContactFields; honeypot: string };

function readSubmission(form: HTMLFormElement): Submitted {
  const data = new FormData(form);
  const value = (name: string) => String(data.get(name) ?? "");
  return {
    fields: {
      name: value("name"),
      email: value("email"),
      subject: value("subject"),
      message: value("message"),
    },
    honeypot: value("website"),
  };
}

// Started on first focus or press so a submit rarely waits for the download;
// a failed load is retried by the next interaction.
function warmUpEngine() {
  void loadEngine().catch(() => {});
}

// Already loaded: sending is only reachable after a validated submit.
function sendSubmission(submitted: Submitted, token: string, endpoint: string) {
  return loadEngine().then(({ sendContact }) =>
    sendContact(
      {
        ...submitted.fields,
        turnstileToken: token,
        honeypot: submitted.honeypot,
        requestId: crypto.randomUUID(),
      },
      { endpoint },
    ),
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Only a locally valid submit plays the click reveal; it never delays the
// request.
function playsReveal(fieldErrors: FieldErrors) {
  return Object.keys(fieldErrors).length === 0 && !prefersReducedMotion();
}

// The form logic failed to load: nothing was sent, so the entered text stays
// and resubmitting is safe.
const LOAD_FAILED = {
  type: "outcome",
  outcome: { state: "transport-failed" },
} as const;

export function useContactSubmission(config: ContactConfig | null) {
  const [state, dispatch] = useReducer(reduceContactForm, INITIAL_FORM_STATE);
  const [activationSequence, setActivationSequence] = useState<number | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const widgetRef = useRef<TurnstileHandle>(null);
  const tokenRef = useRef<string | null>(null);
  const submittedRef = useRef<Submitted>(null);
  const busy = BUSY_PHASES.has(state.phase);

  const completeActivation = useCallback(() => setActivationSequence(null), []);
  const onToken = useCallback((token: string) => {
    tokenRef.current = token;
    dispatch({ type: "token" });
  }, []);
  const onInvalidate = useCallback(() => {
    tokenRef.current = null;
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submitted = readSubmission(event.currentTarget);
    void loadEngine().then(
      ({ validateContactFields }) => {
        const fieldErrors = validateContactFields(submitted.fields);
        if (playsReveal(fieldErrors)) {
          setActivationSequence((current) => (current ?? 0) + 1);
        }
        submittedRef.current = submitted;
        dispatch({
          type: "submit",
          fieldErrors,
          configured: config !== null,
          tokenReady: tokenRef.current !== null,
        });
      },
      () => dispatch(LOAD_FAILED),
    );
  }

  // verifying -> sending: exactly one POST per explicit submit; the token is
  // consumed immediately because Turnstile tokens are single-use.
  useEffect(() => {
    const submitted = submittedRef.current;
    const token = tokenRef.current;
    if (state.phase !== "verifying" || !config || !submitted || !token) return;
    tokenRef.current = null;
    dispatch({ type: "dispatch" });
    void sendSubmission(submitted, token, config.endpoint).then((outcome) => {
      widgetRef.current?.reset();
      if (outcome.state === "success") formRef.current?.reset();
      dispatch({ type: "outcome", outcome });
    });
  }, [state.phase, config]);

  // Recovery focus only where it helps: the first field needing a fix.
  useEffect(() => {
    if (state.phase !== "validation-failed") return;
    const first = FIELD_ORDER.find((field) => state.fieldErrors[field]);
    const control = first ? formRef.current?.elements.namedItem(first) : null;
    if (control instanceof HTMLElement) control.focus();
  }, [state]);

  return {
    state,
    status: statusFor(state),
    busy,
    activationSequence,
    completeActivation,
    formRef,
    widgetRef,
    onSubmit,
    warmUp: warmUpEngine,
    onToken,
    onInvalidate,
  };
}
