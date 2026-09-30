import { describe, expect, it } from "vitest";
import {
  CLIENT_REQUEST_ID,
  call,
  ORIGIN,
  type SiteverifyCall,
  siteverify,
  submissionRequest,
  testingKeyPass,
  validSubmission,
} from "./helpers.ts";

describe("honeypot", () => {
  it("rejects a filled honeypot without verifying or sending", async () => {
    const calls: SiteverifyCall[] = [];
    const response = await call(
      submissionRequest(
        JSON.stringify(validSubmission({ honeypot: "https://spam.test" })),
      ),
      {},
      { fetch: siteverify(testingKeyPass(), calls) },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "invalid_request" });
    expect(calls).toHaveLength(0);
  });
});

describe("accepted submission", () => {
  it("sends the email and answers contact_sent with the client request ID", async () => {
    const response = await call(
      submissionRequest(JSON.stringify(validSubmission())),
      {},
      { fetch: siteverify(testingKeyPass()) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(response.headers.get("Vary")).toBe("Origin");
    expect(await response.json()).toEqual({
      ok: true,
      code: "contact_sent",
      requestId: CLIENT_REQUEST_ID,
    });
  });
});
