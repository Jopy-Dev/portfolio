import { afterEach, describe, expect, it, vi } from "vitest";
import { durationBucket } from "../src/logger.ts";
import {
  CLIENT_REQUEST_ID,
  call,
  ENDPOINT,
  siteverify,
  submissionRequest,
  testingKeyPass,
  validSubmission,
} from "./helpers.ts";

const ALLOWED_KEYS = [
  "event",
  "requestId",
  "code",
  "durationBucket",
  "messageId",
];

function captureLogs() {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  return () => spy.mock.calls.map(([line]) => JSON.parse(String(line)));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("outcome logging", () => {
  it("logs acceptance with the provider message ID and nothing personal", async () => {
    const logs = captureLogs();
    const ip = "198.51.100.23";
    await call(
      submissionRequest(JSON.stringify(validSubmission()), {
        "CF-Connecting-IP": ip,
      }),
      {},
      { fetch: siteverify(testingKeyPass()) },
    );
    const lines = logs();
    expect(lines).toEqual([
      {
        event: "contact.accepted",
        requestId: CLIENT_REQUEST_ID,
        code: "contact_sent",
        durationBucket: expect.any(String),
        messageId: expect.any(String),
      },
      {
        event: "contact.outcome",
        requestId: CLIENT_REQUEST_ID,
        code: "contact_sent",
        durationBucket: expect.any(String),
      },
    ]);
    const raw = JSON.stringify(lines);
    for (const secret of [
      ip,
      "Ada Lovelace",
      "ada@example.test",
      "owner@example.test",
      "DUMMY.TOKEN",
      "project",
    ]) {
      expect(raw).not.toContain(secret);
    }
  });

  it.each<[string, Request]>([
    ["not_found", new Request("https://contact.test/")],
    ["method_not_allowed", new Request(ENDPOINT)],
    ["invalid_request", submissionRequest("{}")],
  ])("logs exactly one allowlisted outcome for %s", async (code, request) => {
    const logs = captureLogs();
    await call(request);
    const lines = logs();
    expect(lines).toEqual([
      expect.objectContaining({ event: "contact.outcome", code }),
    ]);
    expect(
      Object.keys(lines[0]).every((key) => ALLOWED_KEYS.includes(key)),
    ).toBe(true);
  });
});

describe("duration buckets", () => {
  it.each([
    [0, "lt_250ms"],
    [249, "lt_250ms"],
    [250, "lt_500ms"],
    [999, "lt_1s"],
    [2_999, "lt_3s"],
    [5_999, "lt_6s"],
    [11_999, "lt_12s"],
    [12_000, "gte_12s"],
  ])("puts %i ms in %s", (ms, bucket) => {
    expect(durationBucket(ms)).toBe(bucket);
  });
});
