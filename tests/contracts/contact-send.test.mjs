import assert from "node:assert/strict";
import test from "node:test";
import { sendContact } from "../../apps/site/src/lib/contact-client/send-contact.ts";

const ENDPOINT = "https://contact.example.test/v1/contact";
const REQUEST_ID = "5b0e6f0a-3c2d-4e8f-9a1b-2c3d4e5f6a7b";
const REQUEST = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  subject: "Project enquiry",
  message: "Hello",
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  honeypot: "",
  requestId: REQUEST_ID,
};

function respondingWith(status, body, calls = []) {
  return async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

test("posts the request credential-free, uncached, and redirect-refusing", async () => {
  const calls = [];
  const outcome = await sendContact(REQUEST, {
    endpoint: ENDPOINT,
    fetch: respondingWith(
      200,
      { ok: true, code: "contact_sent", requestId: REQUEST_ID },
      calls,
    ),
  });
  assert.deepEqual(outcome, { state: "success" });
  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, ENDPOINT);
  assert.equal(init.method, "POST");
  assert.equal(init.credentials, "omit");
  assert.equal(init.cache, "no-store");
  assert.equal(init.redirect, "error");
  assert.equal(init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(init.body), REQUEST);
  assert.ok(init.signal instanceof AbortSignal);
});

for (const [code, status, state] of [
  ["invalid_request", 400, "validation-failed"],
  ["payload_too_large", 413, "validation-failed"],
  ["verification_failed", 403, "verification-failed"],
  ["delivery_failed", 503, "delivery-failed"],
  ["contact_unavailable", 503, "transport-failed"],
  ["unsupported_media_type", 415, "transport-failed"],
  ["method_not_allowed", 405, "transport-failed"],
  ["not_found", 404, "transport-failed"],
]) {
  test(`maps ${code} to ${state}`, async () => {
    const outcome = await sendContact(REQUEST, {
      endpoint: ENDPOINT,
      fetch: respondingWith(status, { ok: false, code, requestId: REQUEST_ID }),
    });
    assert.deepEqual(outcome, { state });
  });
}

for (const [label, fetcher] of [
  ["a non-JSON body", async () => new Response("<html>", { status: 200 })],
  [
    "an unknown code",
    respondingWith(200, { ok: true, code: "sent", requestId: REQUEST_ID }),
  ],
  [
    "success JSON on an error status",
    respondingWith(503, {
      ok: true,
      code: "contact_sent",
      requestId: REQUEST_ID,
    }),
  ],
  [
    "an extra field",
    respondingWith(200, {
      ok: true,
      code: "contact_sent",
      requestId: REQUEST_ID,
      debug: 1,
    }),
  ],
]) {
  test(`treats ${label} as transport-failed`, async () => {
    const outcome = await sendContact(REQUEST, {
      endpoint: ENDPOINT,
      fetch: fetcher,
    });
    assert.deepEqual(outcome, { state: "transport-failed" });
  });
}

function failingWith(error, calls) {
  return async (url, init) => {
    calls.push({ url, init });
    throw error;
  };
}

for (const [label, error] of [
  ["the 12 s deadline passes", new DOMException("timed out", "TimeoutError")],
  ["the connection drops while online", new TypeError("Failed to fetch")],
]) {
  test(`reports delivery-uncertain once, without retrying, when ${label}`, async () => {
    const calls = [];
    const outcome = await sendContact(REQUEST, {
      endpoint: ENDPOINT,
      fetch: failingWith(error, calls),
      isOnline: () => true,
    });
    assert.deepEqual(outcome, { state: "delivery-uncertain" });
    assert.equal(calls.length, 1);
  });
}

test("reports delivery-uncertain when the response body breaks mid-stream", async () => {
  const broken = new ReadableStream({
    start(controller) {
      controller.error(new TypeError("network error"));
    },
  });
  const outcome = await sendContact(REQUEST, {
    endpoint: ENDPOINT,
    fetch: async () => new Response(broken, { status: 200 }),
    isOnline: () => true,
  });
  assert.deepEqual(outcome, { state: "delivery-uncertain" });
});

test("reports transport-failed when the browser went offline during the request", async () => {
  const outcome = await sendContact(REQUEST, {
    endpoint: ENDPOINT,
    fetch: failingWith(new TypeError("Failed to fetch"), []),
    isOnline: () => false,
  });
  assert.deepEqual(outcome, { state: "transport-failed" });
});

test("reports transport-failed without sending when already offline", async () => {
  const calls = [];
  const outcome = await sendContact(REQUEST, {
    endpoint: ENDPOINT,
    fetch: failingWith(new TypeError("unreachable"), calls),
    isOnline: () => false,
  });
  assert.deepEqual(outcome, { state: "transport-failed" });
  assert.equal(calls.length, 0);
});

test("maps rate_limited to rate-limited with its retry seconds", async () => {
  const outcome = await sendContact(REQUEST, {
    endpoint: ENDPOINT,
    fetch: respondingWith(429, {
      ok: false,
      code: "rate_limited",
      requestId: REQUEST_ID,
      retryAfterSeconds: 125,
    }),
  });
  assert.deepEqual(outcome, { state: "rate-limited", retryAfterSeconds: 125 });
});
