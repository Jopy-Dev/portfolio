import { describe, expect, it } from "vitest";
import type { ContactRateLimiter } from "../src/index.ts";
import {
  call,
  ENDPOINT,
  ORIGIN,
  type SiteverifyCall,
  siteverify,
  testingKeyPass,
  uniqueIp,
  validSubmission,
} from "./helpers.ts";

function attempt(ip: string | null, now: () => number = Date.now) {
  const headers: Record<string, string> = {
    Origin: ORIGIN,
    "Content-Type": "application/json",
  };
  if (ip !== null) headers["CF-Connecting-IP"] = ip;
  return call(
    new Request(ENDPOINT, { method: "POST", body: "{}", headers }),
    {},
    { now },
  );
}

describe("limiter failure", () => {
  function validFrom(headers: Record<string, string>) {
    return new Request(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(validSubmission()),
      headers: {
        Origin: ORIGIN,
        "Content-Type": "application/json",
        ...headers,
      },
    });
  }

  const brokenLimiter = {
    getByName: () => ({
      consume: () => Promise.reject(new Error("storage quota exceeded")),
    }),
  } as unknown as DurableObjectNamespace<ContactRateLimiter>;

  it.each<[string, Request, Record<string, unknown>]>([
    ["no edge client address", validFrom({}), {}],
    [
      "a failing limiter",
      validFrom({ "CF-Connecting-IP": uniqueIp() }),
      { CONTACT_RATE_LIMITER: brokenLimiter },
    ],
  ])(
    "fails closed on %s without calling Turnstile",
    async (_label, request, env) => {
      const calls: SiteverifyCall[] = [];
      const response = await call(request, env as never, {
        fetch: siteverify(testingKeyPass(), calls),
      });
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        code: "contact_unavailable",
      });
      expect(calls).toHaveLength(0);
    },
  );
});

describe("rate limiting", () => {
  it("answers the sixth attempt from one client with 429 and Retry-After", async () => {
    // A frozen clock keeps Retry-After exact however slow the test runner is.
    const ip = uniqueIp();
    const frozen = Date.now();
    const now = () => frozen;
    for (let i = 0; i < 5; i++) {
      expect((await attempt(ip, now)).status).not.toBe(429);
    }
    const response = await attempt(ip, now);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(await response.json()).toMatchObject({
      ok: false,
      code: "rate_limited",
      retryAfterSeconds: 600,
    });
  });

  it("counts Retry-After down from the oldest attempt in the window", async () => {
    const ip = uniqueIp();
    let clock = Date.now();
    const now = () => clock;
    for (let i = 0; i < 5; i++) {
      expect((await attempt(ip, now)).status).not.toBe(429);
    }
    clock += 1_500;
    const response = await attempt(ip, now);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("599");
  });
});
