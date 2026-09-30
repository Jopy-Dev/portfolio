import {
  type ContactClientState,
  type ContactRequest,
  type ContactResponse,
  clientStateFor,
  httpStatusFor,
  parseContactResponse,
} from "@jopy-dev/contact-contract";

export const CONTACT_TIMEOUT_MS = 12_000;

export type SendOutcome =
  | { state: Exclude<ContactClientState, "rate-limited"> }
  | { state: "rate-limited"; retryAfterSeconds: number };

export type SendOptions = {
  endpoint: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  isOnline?: () => boolean;
};

// Never retried automatically: a retry could send a second email.
export async function sendContact(
  request: ContactRequest,
  options: SendOptions,
): Promise<SendOutcome> {
  const isOnline = options.isOnline ?? (() => navigator.onLine !== false);
  if (!isOnline()) return { state: "transport-failed" };
  try {
    return await exchange(request, options);
  } catch {
    // Once dispatched, a timeout or dropped connection cannot prove the
    // Worker did not already send the email; only a known offline browser can.
    return { state: isOnline() ? "delivery-uncertain" : "transport-failed" };
  }
}

async function exchange(
  request: ContactRequest,
  options: SendOptions,
): Promise<SendOutcome> {
  const fetcher = options.fetch ?? fetch;
  const response = await fetcher(options.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(options.timeoutMs ?? CONTACT_TIMEOUT_MS),
  });
  const parsed = parseContactResponse(await readJson(response));
  // A body whose code disagrees with the HTTP status did not come from the
  // Worker contract, so it can never be read as success.
  const trusted = parsed && httpStatusFor(parsed.code) === response.status;
  return outcomeOf(trusted ? parsed : null);
}

// Syntax errors mean a non-Worker body (e.g. a proxy page); stream errors
// propagate because the Worker may already have acted.
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function outcomeOf(response: ContactResponse | null): SendOutcome {
  if (response === null) return { state: "transport-failed" };
  if (response.retryAfterSeconds !== undefined) {
    return {
      state: "rate-limited",
      retryAfterSeconds: response.retryAfterSeconds,
    };
  }
  return { state: clientStateFor(response.code) } as SendOutcome;
}
