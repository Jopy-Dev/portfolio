import { z } from "zod";
import { CANONICAL_UUID } from "./request.ts";

// Single source for code -> HTTP status -> UI state; the Worker and the site
// both read this table.
const RESPONSE_TABLE = {
  contact_sent: { status: 200, ok: true, state: "success" },
  invalid_request: { status: 400, ok: false, state: "validation-failed" },
  verification_failed: { status: 403, ok: false, state: "verification-failed" },
  payload_too_large: { status: 413, ok: false, state: "validation-failed" },
  unsupported_media_type: { status: 415, ok: false, state: "transport-failed" },
  method_not_allowed: { status: 405, ok: false, state: "transport-failed" },
  not_found: { status: 404, ok: false, state: "transport-failed" },
  rate_limited: { status: 429, ok: false, state: "rate-limited" },
  contact_unavailable: { status: 503, ok: false, state: "transport-failed" },
  delivery_failed: { status: 503, ok: false, state: "delivery-failed" },
  // Client-only: the Worker response was lost after email may have been sent.
  delivery_uncertain: { status: null, ok: false, state: "delivery-uncertain" },
} as const;

export type ContactResponseCode = keyof typeof RESPONSE_TABLE;
export type ContactClientState =
  (typeof RESPONSE_TABLE)[ContactResponseCode]["state"];
export type WorkerResponseCode = Exclude<
  ContactResponseCode,
  "delivery_uncertain"
>;

export const CONTACT_RESPONSE_CODES = Object.keys(
  RESPONSE_TABLE,
) as ContactResponseCode[];

const WORKER_CODES = CONTACT_RESPONSE_CODES.filter(
  (code): code is WorkerResponseCode => code !== "delivery_uncertain",
) as [WorkerResponseCode, ...WorkerResponseCode[]];

export const RETRY_AFTER_MAX_SECONDS = 600;

export function httpStatusFor(code: ContactResponseCode) {
  return RESPONSE_TABLE[code].status;
}

export function clientStateFor(code: ContactResponseCode): ContactClientState {
  return RESPONSE_TABLE[code].state;
}

export const ContactResponseSchema = z
  .strictObject({
    ok: z.boolean(),
    code: z.enum(WORKER_CODES),
    requestId: z.string().regex(CANONICAL_UUID),
    retryAfterSeconds: z.int().min(1).max(RETRY_AFTER_MAX_SECONDS).optional(),
  })
  .refine((response) => response.ok === RESPONSE_TABLE[response.code].ok)
  .refine(
    (response) =>
      (response.code === "rate_limited") ===
      (response.retryAfterSeconds !== undefined),
  );

export type ContactResponse = z.infer<typeof ContactResponseSchema>;

// Anything unrecognized is treated by the caller as a transport failure, never success.
export function parseContactResponse(input: unknown): ContactResponse | null {
  const result = ContactResponseSchema.safeParse(input);
  return result.success ? result.data : null;
}
