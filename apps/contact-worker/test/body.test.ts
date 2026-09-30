import { describe, expect, it } from "vitest";
import { call, ENDPOINT, ORIGIN, uniqueIp } from "./helpers.ts";

function post(body: BodyInit | null, headers: Record<string, string>) {
  return call(
    new Request(ENDPOINT, {
      method: "POST",
      body,
      headers: { Origin: ORIGIN, "CF-Connecting-IP": uniqueIp(), ...headers },
    }),
  );
}

const JSON_TYPE = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 16_384;

// Chunked body with no Content-Length, so only the streamed cap can stop it.
function streamOf(totalBytes: number, chunkBytes = 1_000) {
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= totalBytes) return controller.close();
      const size = Math.min(chunkBytes, totalBytes - sent);
      sent += size;
      controller.enqueue(new Uint8Array(size).fill(0x20));
    },
  });
}

describe("request body cap", () => {
  it("rejects a string body one byte over 16 KiB", async () => {
    const response = await post(" ".repeat(MAX_BODY_BYTES + 1), JSON_TYPE);
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: "payload_too_large" });
  });

  // The runtime adds no Content-Length to constructed requests, so the header
  // is set explicitly; the small body proves the declaration alone rejects.
  it.each([String(MAX_BODY_BYTES + 1), "not-a-number"])(
    "rejects a declared Content-Length of %s before reading the body",
    async (declared) => {
      const response = await post("{}", {
        ...JSON_TYPE,
        "Content-Length": declared,
      });
      expect(response.status).toBe(413);
      expect(await response.json()).toMatchObject({
        code: "payload_too_large",
      });
    },
  );

  it("rejects a streamed body one byte over 16 KiB", async () => {
    const response = await post(streamOf(MAX_BODY_BYTES + 1), JSON_TYPE);
    expect(response.status).toBe(413);
  });

  it("answers invalid_request when the POST carries no body", async () => {
    const response = await post(null, JSON_TYPE);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "invalid_request" });
  });

  it.each([MAX_BODY_BYTES - 1, MAX_BODY_BYTES])(
    "reads a streamed body of %i bytes past the cap check",
    async (size) => {
      const response = await post(streamOf(size), JSON_TYPE);
      expect(response.status).not.toBe(413);
    },
  );
});

describe("request media type", () => {
  it.each<[string, Record<string, string>]>([
    ["plain text", { "Content-Type": "text/plain" }],
    ["form encoding", { "Content-Type": "application/x-www-form-urlencoded" }],
    ["a JSON look-alike", { "Content-Type": "application/jsonp" }],
  ])("rejects %s with unsupported_media_type", async (_label, headers) => {
    const response = await post("{}", headers);
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({
      code: "unsupported_media_type",
    });
  });

  // A string body would gain text/plain from the runtime; bytes carry none.
  it("rejects a body with no content type", async () => {
    const response = await post(new TextEncoder().encode("{}"), {});
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({
      code: "unsupported_media_type",
    });
  });
});
