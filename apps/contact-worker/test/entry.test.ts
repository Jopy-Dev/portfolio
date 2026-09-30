import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { ENDPOINT, ORIGIN } from "./helpers.ts";

describe("Worker entry", () => {
  it("routes requests through the deployed fetch handler", async () => {
    const response = await exports.default.fetch(
      new Request(ENDPOINT, {
        method: "OPTIONS",
        headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });
});
