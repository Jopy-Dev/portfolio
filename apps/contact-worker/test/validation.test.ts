import { describe, expect, it } from "vitest";
import {
  CLIENT_REQUEST_ID,
  call,
  submissionRequest,
  UUID_PATTERN,
  validSubmission,
} from "./helpers.ts";

async function expectInvalid(body: BodyInit) {
  const response = await call(submissionRequest(body));
  expect(response.status).toBe(400);
  const json = (await response.json()) as { requestId: string };
  expect(json).toEqual({
    ok: false,
    code: "invalid_request",
    requestId: expect.stringMatching(UUID_PATTERN),
  });
  // Rejected input is never trusted as a correlation ID.
  expect(json.requestId).not.toBe(CLIENT_REQUEST_ID);
}

describe("request validation", () => {
  it("rejects a body that is not JSON", async () => {
    await expectInvalid("name=Ada");
  });

  it("rejects a body that is not valid UTF-8", async () => {
    await expectInvalid(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]));
  });

  it.each<[string, Record<string, unknown>]>([
    ["an injected recipient field", { cc: "attacker@example.test" }],
    ["a missing message", { message: undefined }],
    ["a subject with a line break", { subject: "Hi\r\nBcc: x@example.test" }],
    ["a non-UUID request ID", { requestId: "not-a-uuid" }],
  ])("rejects a submission with %s", async (_label, overrides) => {
    await expectInvalid(JSON.stringify(validSubmission(overrides)));
  });
});
