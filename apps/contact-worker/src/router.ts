import type {
  ContactRequest,
  WorkerResponseCode,
} from "@jopy-dev/contact-contract";
import { buildContactEmail, deliver } from "./email.ts";
import { isValidEnv } from "./env.ts";
import { durationBucket, logEvent } from "./logger.ts";
import {
  corsHeaders,
  isAllowedOrigin,
  isAllowedPreflight,
  preflightHeaders,
} from "./origin.ts";
import {
  isJsonMediaType,
  parseSubmission,
  readBoundedBody,
} from "./parse-body.ts";
import { admit } from "./admission.ts";
import { rateLimited, respond } from "./response.ts";
import { verifyTurnstile } from "./turnstile.ts";

export type RequestDeps = {
  fetch: typeof fetch;
  now: () => number;
};

type Context = {
  request: Request;
  env: Env;
  deps: RequestDeps;
  startedAt: number;
  // Server UUID until the body validates; then the visitor's canonical ID.
  requestId: string;
};

const CONTACT_PATH = "/v1/contact";

const VERDICT_CODES = {
  rejected: "verification_failed",
  unavailable: "contact_unavailable",
} as const;

function elapsed(ctx: Context) {
  return durationBucket(ctx.deps.now() - ctx.startedAt);
}

// Single exit for every JSON outcome, so each request logs exactly one
// allowlisted contact.outcome line.
function reply(
  ctx: Context,
  code: WorkerResponseCode,
  headers: Record<string, string> = {},
  retryAfterSeconds?: number,
): Response {
  logEvent({
    event: "contact.outcome",
    requestId: ctx.requestId,
    code,
    durationBucket: elapsed(ctx),
  });
  return retryAfterSeconds === undefined
    ? respond(code, ctx.requestId, headers)
    : rateLimited(ctx.requestId, retryAfterSeconds, headers);
}

// Preflight never consumes the rate limiter.
function preflight(ctx: Context): Response {
  const allowed = ctx.env.ALLOWED_ORIGIN;
  if (!isAllowedPreflight(ctx.request, allowed)) {
    return reply(ctx, "verification_failed");
  }
  return new Response(null, {
    status: 204,
    headers: preflightHeaders(allowed),
  });
}

function verifyContact(ctx: Context, contact: ContactRequest) {
  const { env, deps } = ctx;
  return verifyTurnstile(
    {
      secret: env.TURNSTILE_SECRET_KEY,
      token: contact.turnstileToken,
      remoteIp: ctx.request.headers.get("CF-Connecting-IP") ?? "",
      idempotencyKey: contact.requestId,
    },
    {
      hostname: env.TURNSTILE_EXPECTED_HOSTNAME,
      action: env.TURNSTILE_EXPECTED_ACTION,
      allowTestingKey: env.TURNSTILE_ALLOW_TESTING_KEY === "true",
      nowMs: deps.now(),
    },
    deps.fetch,
  );
}

async function deliverVerified(
  ctx: Context,
  contact: ContactRequest,
): Promise<Response> {
  const verdict = await verifyContact(ctx, contact);
  if (verdict !== "valid") return reply(ctx, VERDICT_CODES[verdict]);
  const email = buildContactEmail(contact, ctx.env.CONTACT_DESTINATION);
  const delivery = await deliver(ctx.env.CONTACT_EMAIL, email);
  if (!delivery.sent) return reply(ctx, "delivery_failed");
  logEvent({
    event: "contact.accepted",
    requestId: ctx.requestId,
    code: "contact_sent",
    durationBucket: elapsed(ctx),
    messageId: delivery.messageId,
  });
  return reply(ctx, "contact_sent");
}

// Limiter faults fail closed; a full window answers 429 with Retry-After.
async function admissionRefusal(ctx: Context): Promise<Response | null> {
  const admission = await admit(ctx.request, ctx.env, ctx.deps.now());
  if (admission.kind === "unavailable") {
    return reply(ctx, "contact_unavailable");
  }
  if (admission.kind === "limited") {
    return reply(ctx, "rate_limited", {}, admission.retryAfterSeconds);
  }
  return null;
}

// Fixed order: size -> limiter -> Origin -> parse -> honeypot -> Turnstile ->
// email. Cheap, local rejections come before any external provider call.
async function submission(ctx: Context): Promise<Response> {
  const body = await readBoundedBody(ctx.request);
  if (body.kind === "too_large") return reply(ctx, "payload_too_large");
  const refusal = await admissionRefusal(ctx);
  if (refusal) return refusal;
  if (!isAllowedOrigin(ctx.request, ctx.env.ALLOWED_ORIGIN)) {
    return reply(ctx, "verification_failed");
  }
  const contact = parseSubmission(body.bytes);
  if (contact === null) return reply(ctx, "invalid_request");
  ctx.requestId = contact.requestId;
  // Bots filling the hidden field get the same generic rejection as bad input.
  if (contact.honeypot !== "") return reply(ctx, "invalid_request");
  return deliverVerified(ctx, contact);
}

// Every POST outcome (including 413/429 before the Origin gate) is readable by
// the approved site so it can show the right state; other origins get none.
function readableBy(ctx: Context, response: Response): Response {
  const allowed = ctx.env.ALLOWED_ORIGIN;
  if (isAllowedOrigin(ctx.request, allowed)) {
    for (const [name, value] of Object.entries(corsHeaders(allowed))) {
      response.headers.set(name, value);
    }
  }
  return response;
}

export async function handleRequest(
  request: Request,
  env: Env,
  deps: RequestDeps,
): Promise<Response> {
  const ctx: Context = {
    request,
    env,
    deps,
    startedAt: deps.now(),
    requestId: crypto.randomUUID(),
  };
  if (!isValidEnv(env)) return reply(ctx, "contact_unavailable");
  if (new URL(request.url).pathname !== CONTACT_PATH) {
    return reply(ctx, "not_found");
  }
  if (request.method === "OPTIONS") return preflight(ctx);
  if (request.method !== "POST") {
    return reply(ctx, "method_not_allowed", { Allow: "POST, OPTIONS" });
  }
  if (!isJsonMediaType(request)) return reply(ctx, "unsupported_media_type");
  return readableBy(ctx, await submission(ctx));
}
