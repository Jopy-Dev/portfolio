import { describe, expect, it } from "vitest";
import { call, ENDPOINT, ORIGIN, uniqueIp } from "./helpers.ts";

function preflight(headers: Record<string, string>) {
  return call(new Request(ENDPOINT, { method: "OPTIONS", headers }));
}

describe("submission origin", () => {
  function submit(headers: Record<string, string>) {
    return call(
      new Request(ENDPOINT, {
        method: "POST",
        body: "{}",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": uniqueIp(),
          ...headers,
        },
      }),
    );
  }

  it.each<[string, Record<string, string>]>([
    ["another origin", { Origin: "https://evil.test" }],
    ["the opaque null origin", { Origin: "null" }],
    ["no origin", {}],
  ])("rejects a POST from %s", async (_label, headers) => {
    const response = await submit(headers);
    expect(response.status).toBe(403);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
    expect(await response.json()).toMatchObject({
      code: "verification_failed",
    });
  });
});

describe("readable outcomes", () => {
  it.each<[string, BodyInit]>([
    ["invalid_request", "{}"],
    ["payload_too_large", " ".repeat(16_385)],
  ])("lets the approved origin read %s", async (code, body) => {
    const response = await call(
      new Request(ENDPOINT, {
        method: "POST",
        body,
        headers: {
          Origin: ORIGIN,
          "Content-Type": "application/json",
          "CF-Connecting-IP": uniqueIp(),
        },
      }),
    );
    expect(await response.json()).toMatchObject({ code });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(response.headers.get("Vary")).toBe("Origin");
  });
});

describe("preflight", () => {
  it("grants only POST with Content-Type to the approved origin", async () => {
    const response = await preflight({
      Origin: ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    });
    expect(response.status).toBe(204);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "access-control-allow-origin": ORIGIN,
      "access-control-allow-methods": "POST",
      "access-control-allow-headers": "Content-Type",
      vary: "Origin",
    });
    expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(
      false,
    );
  });

  const valid = {
    Origin: ORIGIN,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
  };

  it.each<[string, Record<string, string>]>([
    ["another origin", { ...valid, Origin: "https://evil.test" }],
    ["a look-alike origin", { ...valid, Origin: `${ORIGIN}.evil.test` }],
    ["a trailing-slash origin", { ...valid, Origin: `${ORIGIN}/` }],
    ["the opaque null origin", { ...valid, Origin: "null" }],
    ["no origin", { "Access-Control-Request-Method": "POST" }],
    ["another method", { ...valid, "Access-Control-Request-Method": "PUT" }],
    ["no requested method", { Origin: ORIGIN }],
    [
      "an extra header",
      { ...valid, "Access-Control-Request-Headers": "content-type, x-debug" },
    ],
  ])("rejects a preflight with %s", async (_label, headers) => {
    const response = await preflight(headers);
    expect(response.status).toBe(403);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
    expect(await response.json()).toMatchObject({
      code: "verification_failed",
    });
  });
});
