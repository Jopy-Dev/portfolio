"use client";

import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  loadTurnstile,
  type TurnstileApi,
} from "@/lib/turnstile/load-turnstile";

export const TURNSTILE_ACTION = "portfolio_contact";

export type TurnstileHandle = { reset: () => void };

type WidgetState = "loading" | "ready" | "failed";

type TurnstileCallbacks = {
  onToken: (token: string) => void;
  onInvalidate: () => void;
};

type TurnstileWidgetProps = TurnstileCallbacks & {
  sitekey: string;
  ref?: Ref<TurnstileHandle>;
};

function useTurnstile(
  sitekey: string,
  callbacks: TurnstileCallbacks,
  ref: Ref<TurnstileHandle> | undefined,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const [state, setState] = useState<WidgetState>("loading");

  // Tokens are single-use, so the form resets the widget after every attempt.
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widget.current) widget.current.api.reset(widget.current.id);
    },
  }));

  useEffect(() => {
    let active = true;
    const invalidate = () => latest.current.onInvalidate();
    const mount = (api: TurnstileApi) => {
      const container = containerRef.current;
      if (!active || !container) return;
      const id = api.render(container, {
        sitekey,
        action: TURNSTILE_ACTION,
        theme: "dark",
        size: "flexible",
        "response-field": false,
        callback: (token) => latest.current.onToken(token),
        "expired-callback": invalidate,
        "error-callback": invalidate,
        "timeout-callback": invalidate,
      });
      if (id) widget.current = { api, id };
      setState("ready");
    };
    loadTurnstile()
      .then(mount)
      .catch(() => active && setState("failed"));
    return () => {
      active = false;
      if (widget.current) widget.current.api.remove(widget.current.id);
      widget.current = null;
    };
  }, [sitekey]);

  return { containerRef, state };
}

function PlaceholderCopy() {
  return (
    <>
      <span aria-hidden="true" />
      <div>
        <strong>Protected by Turnstile</strong>
        <small>Managed verification loads here.</small>
      </div>
    </>
  );
}

export function TurnstilePlaceholder() {
  return (
    <div className="turnstile-shell">
      <PlaceholderCopy />
    </div>
  );
}

export function TurnstileWidget({
  sitekey,
  ref,
  ...callbacks
}: TurnstileWidgetProps) {
  const { containerRef, state } = useTurnstile(sitekey, callbacks, ref);
  return (
    <div className="turnstile-shell" data-state={state}>
      {state === "ready" ? null : <PlaceholderCopy />}
      <div className="turnstile-shell__widget" ref={containerRef} />
    </div>
  );
}
