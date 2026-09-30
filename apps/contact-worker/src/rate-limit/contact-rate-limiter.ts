import { DurableObject } from "cloudflare:workers";

const TIMESTAMPS_KEY = "timestamps";
const WINDOW_MS = 600_000;
const MAX_ATTEMPTS = 5;

export type ConsumeResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function isTimestampList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_ATTEMPTS &&
    value.every((attemptMs) => Number.isSafeInteger(attemptMs))
  );
}

function ascending(left: number, right: number): number {
  return left - right;
}

// Unreadable state must never widen admission: throwing makes the Worker
// answer 503 without calling Turnstile or sending email.
function readTimestamps(storage: DurableObjectStorage): number[] {
  const stored: unknown = storage.kv.get(TIMESTAMPS_KEY) ?? [];
  if (!isTimestampList(stored)) {
    throw new Error("Malformed rate limit state");
  }
  return stored;
}

// Ascending attempts still inside the rolling window at nowMs.
function liveTimestamps(
  storage: DurableObjectStorage,
  nowMs: number,
): number[] {
  return readTimestamps(storage)
    .filter((attemptMs) => attemptMs > nowMs - WINDOW_MS)
    .sort(ascending);
}

// Timestamps come from edge Worker clocks, which can run ahead of the caller;
// the public contract bounds Retry-After to 1..600 seconds regardless.
function retryAfter(oldestMs: number, nowMs: number): number {
  const seconds = Math.ceil((oldestMs + WINDOW_MS - nowMs) / 1000);
  return Math.min(Math.max(seconds, 1), WINDOW_MS / 1000);
}

type Decision = { result: ConsumeResult; cleanupAtMs?: number };

// Runs inside one synchronous storage transaction so concurrent requests for
// the same key cannot interleave between read and write.
function admit(storage: DurableObjectStorage, nowMs: number): Decision {
  const timestamps = liveTimestamps(storage, nowMs);
  const [oldest] = timestamps;
  if (oldest !== undefined && timestamps.length >= MAX_ATTEMPTS) {
    return {
      result: { allowed: false, retryAfterSeconds: retryAfter(oldest, nowMs) },
    };
  }
  const next = [...timestamps, nowMs].sort(ascending).slice(-MAX_ATTEMPTS);
  storage.kv.put(TIMESTAMPS_KEY, next);
  return {
    result: { allowed: true },
    cleanupAtMs: (next[0] ?? nowMs) + WINDOW_MS,
  };
}

export class ContactRateLimiter extends DurableObject {
  async consume(nowMs: number): Promise<ConsumeResult> {
    if (!Number.isSafeInteger(nowMs)) {
      throw new Error("Invalid server time");
    }
    const storage = this.ctx.storage;
    const decision = storage.transactionSync(() => admit(storage, nowMs));
    if (decision.cleanupAtMs !== undefined) {
      await storage.setAlarm(decision.cleanupAtMs);
    }
    return decision.result;
  }

  // Housekeeping only: consume() prunes on every request, so correctness never
  // depends on alarm timing.
  override async alarm(): Promise<void> {
    const storage = this.ctx.storage;
    const nowMs = Date.now();
    const remaining = liveTimestamps(storage, nowMs);
    const [oldest] = remaining;
    if (oldest === undefined) {
      await storage.deleteAll();
      return;
    }
    storage.kv.put(TIMESTAMPS_KEY, remaining);
    await storage.setAlarm(oldest + WINDOW_MS);
  }
}
