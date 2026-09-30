import { z } from "zod";
import {
  isSafeMultiline,
  isSafeSingleLine,
  normalizeLineEndings,
  withinCodePoints,
} from "./text.ts";

type Limit = readonly [number, number];

const LIMITS = {
  name: [1, 80],
  subject: [1, 120],
  message: [1, 2000],
  honeypot: [0, 200],
  email: [3, 254],
} as const;

const TURNSTILE_TOKEN_MAX = 2048;
export const CANONICAL_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function bounded([min, max]: Limit) {
  return z
    .string()
    .refine((value) => withinCodePoints(value, min, max), "length");
}

const singleLine = (limit: Limit) =>
  z.string().trim().pipe(bounded(limit).refine(isSafeSingleLine, "characters"));

// Message content is preserved verbatim apart from line endings; whitespace-only is blank.
const message = z
  .string()
  .transform(normalizeLineEndings)
  .pipe(
    bounded(LIMITS.message)
      .refine(isSafeMultiline, "characters")
      .refine((value) => value.trim() !== "", "blank"),
  );

// Strict: an attacker-supplied recipient/cc field must fail, never be ignored.
export const ContactRequestSchema = z.strictObject({
  name: singleLine(LIMITS.name),
  email: singleLine(LIMITS.email).pipe(z.email()),
  subject: singleLine(LIMITS.subject),
  message,
  turnstileToken: z.string().min(1).max(TURNSTILE_TOKEN_MAX),
  honeypot: bounded(LIMITS.honeypot).refine(
    (value) => value.isWellFormed(),
    "characters",
  ),
  // Echoed as correlation id; never trust non-canonical client text in logs.
  requestId: z.string().regex(CANONICAL_UUID),
});

export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export function parseContactRequest(input: unknown) {
  return ContactRequestSchema.safeParse(input);
}
