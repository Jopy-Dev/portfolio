import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTACT_RESPONSE_CODES,
  clientStateFor,
  httpStatusFor,
  parseContactResponse,
} from "../src/response.ts";

const requestId = "0b7c6c1e-8f3a-4d2b-9c1a-2f6e5d4c3b2a";

// Expected contract: code -> [HTTP status, client state]
const TABLE: Record<string, [number | null, string]> = {
  contact_sent: [200, "success"],
  invalid_request: [400, "validation-failed"],
  verification_failed: [403, "verification-failed"],
  payload_too_large: [413, "validation-failed"],
  unsupported_media_type: [415, "transport-failed"],
  method_not_allowed: [405, "transport-failed"],
  not_found: [404, "transport-failed"],
  rate_limited: [429, "rate-limited"],
  contact_unavailable: [503, "transport-failed"],
  delivery_failed: [503, "delivery-failed"],
  delivery_uncertain: [null, "delivery-uncertain"],
};

test("every response code maps to its documented HTTP status and client state", () => {
  assert.deepEqual(
    [...CONTACT_RESPONSE_CODES].sort(),
    Object.keys(TABLE).sort(),
  );
  for (const [code, [status, state]] of Object.entries(TABLE)) {
    assert.equal(httpStatusFor(code as never), status, code);
    assert.equal(clientStateFor(code as never), state, code);
  }
});

test("well-formed success response parses", () => {
  const parsed = parseContactResponse({
    ok: true,
    code: "contact_sent",
    requestId,
  });
  assert.deepEqual(parsed, { ok: true, code: "contact_sent", requestId });
});

test("rate-limited response carries retry seconds between 1 and 600", () => {
  const base = { ok: false, code: "rate_limited", requestId };
  assert.ok(parseContactResponse({ ...base, retryAfterSeconds: 600 }));
  assert.equal(parseContactResponse({ ...base, retryAfterSeconds: 601 }), null);
  assert.equal(parseContactResponse({ ...base, retryAfterSeconds: 0 }), null);
});

test("retry seconds are rejected on non-rate-limited codes", () => {
  const response = {
    ok: false,
    code: "invalid_request",
    requestId,
    retryAfterSeconds: 5,
  };
  assert.equal(parseContactResponse(response), null);
});

test("unknown, inconsistent, or malformed responses never parse as success", () => {
  assert.equal(
    parseContactResponse({ ok: true, code: "mystery", requestId }),
    null,
  );
  assert.equal(
    parseContactResponse({ ok: true, code: "invalid_request", requestId }),
    null,
  );
  assert.equal(
    parseContactResponse({ ok: false, code: "contact_sent", requestId }),
    null,
  );
  assert.equal(parseContactResponse({ ok: true, code: "contact_sent" }), null);
  assert.equal(parseContactResponse("contact_sent"), null);
});

test("delivery_uncertain is client-only and never parsed from a Worker response", () => {
  assert.equal(
    parseContactResponse({ ok: false, code: "delivery_uncertain", requestId }),
    null,
  );
});
