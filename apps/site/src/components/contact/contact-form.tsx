"use client";

import type { FocusEvent } from "react";
import { ContactFieldGroup } from "@/components/contact/contact-fields";
import {
  TurnstilePlaceholder,
  TurnstileWidget,
} from "@/components/contact/turnstile-widget";
import { useContactSubmission } from "@/components/contact/use-contact-submission";
import { CtaClickReveal } from "@/components/ui/cta-click-reveal";
import { playPressFeedback } from "@/components/ui/press-feedback";
import type { ContactConfig } from "@/lib/env";

// Browsers only scroll on focus when a control is fully out of view, so a
// keyboard-focused field can sit half under the fixed section cue; "nearest"
// honours the page scroll padding and the field's scroll margin.
function revealKeyboardFocus(event: FocusEvent<HTMLFormElement>) {
  const target = event.target;
  if (target instanceof HTMLElement && target.matches(":focus-visible")) {
    target.scrollIntoView({ block: "nearest" });
  }
}

type SubmitButtonProps = {
  busy: boolean;
  activationSequence: number | null;
  onActivationComplete: () => void;
};

function SubmitButton({
  busy,
  activationSequence,
  onActivationComplete,
}: SubmitButtonProps) {
  const label = busy ? "Sending" : "Send message";
  return (
    <button
      className={`submit-button${activationSequence === null ? "" : " is-activated"}${busy ? " is-loading" : ""}`}
      type="submit"
      disabled={busy}
      onClick={(event) => playPressFeedback(event.currentTarget)}
    >
      <span className="submit-button__fill" aria-hidden="true" />
      <span className="submit-button__outline" aria-hidden="true" />
      <span className="submit-button__label submit-button__label--base">
        {label}
      </span>
      <span className="submit-button__label--filled" aria-hidden="true">
        {label}
      </span>
      {activationSequence === null ? null : (
        <CtaClickReveal
          className="submit-button__click-window"
          key={activationSequence}
          direction="up"
          label="Send message"
          onComplete={onActivationComplete}
        />
      )}
      <i className="submit-button__spinner" aria-hidden="true" />
    </button>
  );
}

// `config` is read at build time by the server-rendered section, so the
// environment schema never ships to the browser.
export function ContactForm({ config }: { config: ContactConfig | null }) {
  const form = useContactSubmission(config);
  return (
    <form
      className="contact-form"
      aria-describedby="contact-required"
      noValidate
      ref={form.formRef}
      onSubmit={form.onSubmit}
      onPointerDown={form.warmUp}
      onFocus={(event) => {
        form.warmUp();
        revealKeyboardFocus(event);
      }}
    >
      <p className="contact-required" id="contact-required">
        All fields are required.
      </p>
      <ContactFieldGroup errors={form.state.fieldErrors} />
      {config ? (
        <TurnstileWidget
          ref={form.widgetRef}
          sitekey={config.sitekey}
          onToken={form.onToken}
          onInvalidate={form.onInvalidate}
        />
      ) : (
        <TurnstilePlaceholder />
      )}
      <SubmitButton
        busy={form.busy}
        activationSequence={form.activationSequence}
        onActivationComplete={form.completeActivation}
      />
      <p
        className="form-status"
        data-tone={form.status.tone}
        role="status"
        aria-live="polite"
      >
        {form.status.text}
      </p>
    </form>
  );
}
