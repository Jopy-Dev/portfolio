import { describe, expect, it } from "vitest";
import { call, ENDPOINT, ORIGIN } from "./helpers.ts";

// Same policy as the site: one year, no includeSubDomains (the apex zone
// hosts other services), no preload.
const HSTS = "max-age=31536000";

describe("transport security", () => {
  it.each<[string, Request]>([
    ["an unknown path", new Request("https://contact.test/admin")],
    ["a refused method", new Request(ENDPOINT, { method: "GET" })],
    [
      "a refused preflight",
      new Request(ENDPOINT, {
        method: "OPTIONS",
        headers: { Origin: "https://evil.test" },
      }),
    ],
    [
      "an accepted preflight",
      new Request(ENDPOINT, {
        method: "OPTIONS",
        headers: {
          Origin: ORIGIN,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      }),
    ],
  ])("pins HTTPS on %s", async (_, request) => {
    const response = await call(request);
    expect(response.headers.get("Strict-Transport-Security")).toBe(HSTS);
  });
});
