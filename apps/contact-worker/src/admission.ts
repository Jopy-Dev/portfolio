import { clientKey } from "./client-key.ts";

export type Admission =
  | { kind: "admitted" }
  | { kind: "limited"; retryAfterSeconds: number }
  | { kind: "unavailable" };

// Runs before Origin, JSON, Turnstile, and email so abusive traffic cannot
// spend provider quota. Any limiter fault fails closed.
export async function admit(
  request: Request,
  env: Env,
  nowMs: number,
): Promise<Admission> {
  const address = request.headers.get("CF-Connecting-IP");
  if (!address) return { kind: "unavailable" };
  try {
    const key = await clientKey(env.RATE_LIMIT_HMAC_SECRET, address);
    const result = await env.CONTACT_RATE_LIMITER.getByName(key).consume(nowMs);
    return result.allowed
      ? { kind: "admitted" }
      : { kind: "limited", retryAfterSeconds: result.retryAfterSeconds };
  } catch {
    return { kind: "unavailable" };
  }
}
