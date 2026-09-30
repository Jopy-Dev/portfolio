// Official explicit-render script, loaded unmodified from Cloudflare (never
// proxied or cached locally).
export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  theme: "dark";
  size: "normal";
  "response-field": false;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
};

export type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let pending: Promise<TurnstileApi> | null = null;

// One shared script tag per page; a failed load clears the cache so a later
// mount can try again instead of staying broken.
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  pending ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile unavailable"));
    });
    script.addEventListener("error", () => {
      script.remove();
      reject(new Error("Turnstile script failed to load"));
    });
    document.head.append(script);
  }).catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}
