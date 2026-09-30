import {
  type ContactResponse,
  httpStatusFor,
  type WorkerResponseCode,
} from "@jopy-dev/contact-contract";

type HeaderMap = Record<string, string>;

// Every Worker response is one of the stable contract codes plus a request
// ID; no provider detail, stack, or visitor data ever reaches the body.
export function respond(
  code: WorkerResponseCode,
  requestId: string,
  headers: HeaderMap = {},
): Response {
  return json({ ok: code === "contact_sent", code, requestId }, headers);
}

export function rateLimited(
  requestId: string,
  retryAfterSeconds: number,
  headers: HeaderMap = {},
): Response {
  return json(
    { ok: false, code: "rate_limited", requestId, retryAfterSeconds },
    { ...headers, "Retry-After": String(retryAfterSeconds) },
  );
}

function json(body: ContactResponse, headers: HeaderMap): Response {
  return new Response(JSON.stringify(body), {
    status: httpStatusFor(body.code) ?? 500,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
