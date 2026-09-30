import { env } from "cloudflare:workers";
import { handleRequest, type RequestDeps } from "../src/router.ts";

export const ENDPOINT = "https://contact.test/v1/contact";
export const ORIGIN = "http://localhost:3000";
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type WorkerEnv = typeof env;

export const CLIENT_REQUEST_ID = "5b0e6f0a-3c2d-4e8f-9a1b-2c3d4e5f6a7b";

export function validSubmission(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ada Lovelace",
    email: "ada@example.test",
    subject: "Project enquiry",
    message: "Hello,\r\nI would like to talk about a project.",
    turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    honeypot: "",
    requestId: CLIENT_REQUEST_ID,
    ...overrides,
  };
}

type SiteverifyBody = Record<string, unknown>;

// Mirrors Cloudflare's live answer for the dummy always-pass secret
// (probed 2026-09-29): hostname example.com, no action, testing-key flag.
export function testingKeyPass(nowMs = Date.now()): SiteverifyBody {
  return {
    success: true,
    "error-codes": [],
    challenge_ts: new Date(nowMs).toISOString(),
    hostname: "example.com",
    metadata: { result_with_testing_key: true },
  };
}

export type SiteverifyCall = { url: string; body: Record<string, unknown> };

export function siteverify(
  answer: SiteverifyBody | (() => Promise<Response>),
  calls: SiteverifyCall[] = [],
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return typeof answer === "function" ? answer() : Response.json(answer);
  }) as typeof fetch;
}

export function submissionRequest(
  body: BodyInit,
  headers: Record<string, string> = {},
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    body,
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "CF-Connecting-IP": uniqueIp(),
      ...headers,
    },
  });
}

export function uniqueIp(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `10.${bytes[0]}.${bytes[1]}.${bytes[2]}`;
}

export function call(
  request: Request,
  overrides: Partial<WorkerEnv> = {},
  deps: Partial<RequestDeps> = {},
): Promise<Response> {
  return handleRequest(
    request,
    { ...env, ...overrides },
    {
      fetch: () => Promise.reject(new Error("unexpected Siteverify call")),
      now: Date.now,
      ...deps,
    },
  );
}
