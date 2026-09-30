import { describe, expect, it } from "vitest";
import {
  CLIENT_REQUEST_ID,
  call,
  type SiteverifyCall,
  siteverify,
  submissionRequest,
  testingKeyPass,
  uniqueIp,
  validSubmission,
} from "./helpers.ts";

const NOW = Date.UTC(2026, 8, 29, 12, 0, 0);

// Production-shaped environment: real hostname, no testing-key allowance.
const PRODUCTION_TURNSTILE = {
  TURNSTILE_EXPECTED_HOSTNAME: "portfolio.jopy.dev",
  TURNSTILE_ALLOW_TESTING_KEY: "false",
} as never;

function productionPass(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    "error-codes": [],
    challenge_ts: new Date(NOW).toISOString(),
    hostname: "portfolio.jopy.dev",
    action: "portfolio_contact",
    ...overrides,
  };
}

async function submitWith(
  fetcher: typeof fetch,
  envOverrides: Record<string, unknown> = PRODUCTION_TURNSTILE,
  ip = uniqueIp(),
) {
  const response = await call(
    submissionRequest(JSON.stringify(validSubmission()), {
      "CF-Connecting-IP": ip,
    }),
    envOverrides as never,
    { fetch: fetcher, now: () => NOW },
  );
  return { status: response.status, body: await response.json() };
}

describe("Siteverify request", () => {
  it("sends secret, token, client address, and request ID once", async () => {
    const calls: SiteverifyCall[] = [];
    await submitWith(
      siteverify(productionPass(), calls),
      undefined,
      "203.0.113.7",
    );
    expect(calls).toEqual([
      {
        url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        body: {
          secret: "1x0000000000000000000000000000000AA",
          response: "XXXX.DUMMY.TOKEN.XXXX",
          remoteip: "203.0.113.7",
          idempotency_key: CLIENT_REQUEST_ID,
        },
      },
    ]);
  });

  it("bounds the Siteverify call with an abort signal", async () => {
    let signal: unknown;
    const fetcher = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      return Response.json(productionPass());
    }) as typeof fetch;
    await submitWith(fetcher);
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});

describe("Turnstile verdicts", () => {
  it("accepts a production-shaped pass", async () => {
    expect((await submitWith(siteverify(productionPass()))).status).toBe(200);
  });

  it.each<[string, Record<string, unknown>]>([
    [
      "an invalid token",
      { success: false, "error-codes": ["invalid-input-response"] },
    ],
    [
      "a replayed token",
      { success: false, "error-codes": ["timeout-or-duplicate"] },
    ],
    ["another hostname", { hostname: "evil.test" }],
    ["another action", { action: "login" }],
    ["no action", { action: undefined }],
    [
      "a challenge older than 300 s",
      { challenge_ts: new Date(NOW - 301_000).toISOString() },
    ],
    [
      "a challenge dated over 30 s ahead",
      { challenge_ts: new Date(NOW + 31_000).toISOString() },
    ],
    ["a testing-key result", { metadata: { result_with_testing_key: true } }],
  ])("answers verification_failed for %s", async (_label, overrides) => {
    const { status, body } = await submitWith(
      siteverify(productionPass(overrides)),
    );
    expect(status).toBe(403);
    expect(body).toMatchObject({ code: "verification_failed" });
  });

  it.each([
    ["300 s old", NOW - 300_000],
    ["30 s ahead", NOW + 30_000],
  ])("accepts a challenge at the %s boundary", async (_label, ts) => {
    const pass = productionPass({ challenge_ts: new Date(ts).toISOString() });
    expect((await submitWith(siteverify(pass))).status).toBe(200);
  });

  it("accepts a testing-key result only where the environment allows it", async () => {
    const local = await submitWith(siteverify(testingKeyPass(NOW)), {});
    expect(local.status).toBe(200);
  });
});

describe("Siteverify faults", () => {
  it.each<[string, () => Promise<Response>]>([
    ["a network error", () => Promise.reject(new TypeError("network"))],
    [
      "a timeout",
      () => Promise.reject(new DOMException("timed out", "TimeoutError")),
    ],
    ["an HTTP 500", async () => new Response("oops", { status: 500 })],
    ["a non-JSON body", async () => new Response("<html>")],
    ["a body without success", async () => Response.json({ hostname: "x" })],
    [
      "a pass without challenge time",
      async () => Response.json(productionPass({ challenge_ts: undefined })),
    ],
    [
      "a provider internal error",
      async () =>
        Response.json({ success: false, "error-codes": ["internal-error"] }),
    ],
    [
      "a rejected secret",
      async () =>
        Response.json({
          success: false,
          "error-codes": ["invalid-input-secret"],
        }),
    ],
  ])("answers contact_unavailable for %s", async (_label, answer) => {
    const { status, body } = await submitWith(siteverify(answer));
    expect(status).toBe(503);
    expect(body).toMatchObject({ code: "contact_unavailable" });
  });
});
