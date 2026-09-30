import { describe, expect, it } from "vitest";
import { call, ENDPOINT, UUID_PATTERN } from "./helpers.ts";

describe("routing", () => {
  it("answers unknown paths with a generic not_found response", async () => {
    const response = await call(new Request("https://contact.test/admin"));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      code: "not_found",
      requestId: expect.stringMatching(UUID_PATTERN),
    });
  });

  it.each(["GET", "PUT", "DELETE"])(
    "refuses %s on the contact path and advertises allowed methods",
    async (method) => {
      const response = await call(new Request(ENDPOINT, { method }));
      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
      expect(await response.json()).toMatchObject({
        code: "method_not_allowed",
      });
    },
  );
});
