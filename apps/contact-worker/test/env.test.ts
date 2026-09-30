import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { handleRequest } from "../src/router.ts";
import {
  call,
  ENDPOINT,
  ORIGIN,
  type SiteverifyCall,
  siteverify,
  submissionRequest,
  testingKeyPass,
  validSubmission,
} from "./helpers.ts";

const PRODUCTION_ORIGIN = "https://portfolio.jopy.dev";

async function submitWithEnv(overrides: Record<string, unknown>) {
  const calls: SiteverifyCall[] = [];
  const response = await call(
    submissionRequest(JSON.stringify(validSubmission()), {
      Origin: String(overrides.ALLOWED_ORIGIN ?? "http://localhost:3000"),
    }),
    overrides as never,
    { fetch: siteverify(testingKeyPass(), calls) },
  );
  return { status: response.status, body: await response.json(), calls };
}

describe("environment validation", () => {
  it.each<[string, Record<string, unknown>]>([
    ["a missing Turnstile secret", { TURNSTILE_SECRET_KEY: undefined }],
    ["a missing destination", { CONTACT_DESTINATION: "" }],
    ["a destination that is not an address", { CONTACT_DESTINATION: "owner" }],
    [
      "an HMAC secret under 32 bytes",
      { RATE_LIMIT_HMAC_SECRET: "short-secret" },
    ],
    ["an origin with a path", { ALLOWED_ORIGIN: "http://localhost:3000/" }],
    ["an unexpected action", { TURNSTILE_EXPECTED_ACTION: "login" }],
    ["a missing hostname", { TURNSTILE_EXPECTED_HOSTNAME: "" }],
    ["an unknown testing-key flag", { TURNSTILE_ALLOW_TESTING_KEY: "yes" }],
    [
      "testing keys allowed for the production origin",
      {
        ALLOWED_ORIGIN: PRODUCTION_ORIGIN,
        TURNSTILE_ALLOW_TESTING_KEY: "true",
      },
    ],
    ["a missing email binding", { CONTACT_EMAIL: undefined }],
    ["a missing limiter binding", { CONTACT_RATE_LIMITER: undefined }],
  ])("fails closed with %s", async (_label, overrides) => {
    const { status, body, calls } = await submitWithEnv(overrides);
    expect(status).toBe(503);
    expect(body).toMatchObject({ code: "contact_unavailable" });
    expect(calls).toHaveLength(0);
  });

  it("keeps failing closed on repeat requests to the same isolate", async () => {
    const brokenEnv = { ...env, CONTACT_DESTINATION: "owner" };
    const preflight = () =>
      handleRequest(
        new Request(ENDPOINT, {
          method: "OPTIONS",
          headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" },
        }),
        brokenEnv,
        { fetch, now: Date.now },
      );
    for (const response of [await preflight(), await preflight()]) {
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        code: "contact_unavailable",
      });
    }
  });

  it("accepts a production origin once testing keys are disallowed", async () => {
    const { status } = await submitWithEnv({
      ALLOWED_ORIGIN: PRODUCTION_ORIGIN,
      TURNSTILE_ALLOW_TESTING_KEY: "false",
    });
    // Reaches Turnstile, which then refuses the testing-key result.
    expect(status).toBe(403);
  });
});
