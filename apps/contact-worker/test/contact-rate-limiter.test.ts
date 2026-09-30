import { runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const NOW = 1_800_000_000_000;
const TIMESTAMPS_KEY = "timestamps";
const WINDOW_MS = 600_000;
const MAX_ATTEMPTS = 5;

type Limiter = ReturnType<typeof limiter>;

function limiter(key = crypto.randomUUID()) {
  return env.CONTACT_RATE_LIMITER.getByName(key);
}

async function filled(stub: Limiter, at = NOW): Promise<Limiter> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await stub.consume(at);
  }
  return stub;
}

// Adopts the RPC result into a native promise so `rejects` observes it; the
// raw RPC promise lets failures escape as unhandled rejections.
async function consumed(stub: Limiter, nowMs: number) {
  return stub.consume(nowMs);
}

describe("ContactRateLimiter.consume", () => {
  it("admits the first attempt for a new client key", async () => {
    expect(await limiter().consume(NOW)).toEqual({ allowed: true });
  });

  it("admits exactly five of six concurrent attempts in one window", async () => {
    const stub = limiter();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => stub.consume(NOW)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    expect(results.filter((r) => !r.allowed)).toEqual([
      { allowed: false, retryAfterSeconds: 600 },
    ]);
  });

  it("frees the oldest slot exactly when its window ends", async () => {
    const stub = await filled(limiter());
    expect(await stub.consume(NOW + WINDOW_MS)).toEqual({ allowed: true });
  });

  it("does not record rejected attempts in the window", async () => {
    const stub = await filled(limiter());
    await stub.consume(NOW + 1_000);
    await stub.consume(NOW + 2_000);
    const reopened = await Promise.all(
      Array.from({ length: MAX_ATTEMPTS }, () => stub.consume(NOW + WINDOW_MS)),
    );
    expect(reopened.every((r) => r.allowed)).toBe(true);
  });

  it("keeps separate windows for distinct client keys", async () => {
    await filled(limiter("key-a"));
    expect(await limiter("key-b").consume(NOW)).toEqual({ allowed: true });
  });

  it("caps retry-after at the window length when edge clocks disagree", async () => {
    const stub = await filled(limiter(), NOW + 120_000);
    expect(await stub.consume(NOW)).toEqual({
      allowed: false,
      retryAfterSeconds: 600,
    });
  });

  it("rounds retry-after up to at least one second", async () => {
    const stub = await filled(limiter());
    expect(await stub.consume(NOW + WINDOW_MS - 1)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  it("measures retry-after from the earliest attempt, whatever the arrival order", async () => {
    const stub = limiter();
    await stub.consume(NOW + 50_000);
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await stub.consume(NOW);
    }
    expect(await stub.consume(NOW + 1_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 599,
    });
  });

  it.each([
    ["a non-array value", "corrupt"],
    ["a non-numeric entry", [NOW, "x"]],
    ["a fractional entry", [NOW + 0.5]],
    ["more than five entries", [NOW, NOW, NOW, NOW, NOW, NOW]],
  ])("fails closed when stored state holds %s", async (_label, stored) => {
    const stub = limiter();
    await runInDurableObject(stub, (_instance, state) => {
      state.storage.kv.put(TIMESTAMPS_KEY, stored);
    });
    await expect(consumed(stub, NOW)).rejects.toThrow(
      "Malformed rate limit state",
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, NOW + 0.5])(
    "rejects a non-integer server time (%s)",
    async (nowMs) => {
      const stub = limiter();
      await expect(consumed(stub, nowMs)).rejects.toThrow(
        "Invalid server time",
      );
    },
  );

  it("schedules cleanup for when the oldest admitted attempt expires", async () => {
    const stub = limiter();
    await stub.consume(NOW + 5_000);
    await stub.consume(NOW);
    const alarm = await runInDurableObject(stub, (_instance, state) =>
      state.storage.getAlarm(),
    );
    expect(alarm).toBe(NOW + WINDOW_MS);
  });
});

describe("ContactRateLimiter.alarm", () => {
  // Alarms prune with the object's own clock, so seed relative to Date.now().
  function seed(stub: Limiter, ageMs: number[]): Promise<number> {
    return runInDurableObject(stub, async (_instance, state) => {
      const now = Date.now();
      state.storage.kv.put(
        TIMESTAMPS_KEY,
        ageMs.map((age) => now - age),
      );
      // Far enough ahead that only runDurableObjectAlarm() triggers it.
      await state.storage.setAlarm(now + WINDOW_MS);
      return now;
    });
  }

  function storedState(stub: Limiter) {
    return runInDurableObject(stub, async (_instance, state) => ({
      keys: [...state.storage.kv.list()].length,
      timestamps: state.storage.kv.get(TIMESTAMPS_KEY),
      alarm: await state.storage.getAlarm(),
    }));
  }

  it("removes all stored state once every attempt has expired", async () => {
    const stub = limiter();
    await seed(stub, [WINDOW_MS + 1_000, WINDOW_MS]);
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect(await storedState(stub)).toEqual({
      keys: 0,
      timestamps: undefined,
      alarm: null,
    });
  });

  it("keeps live attempts and reschedules for the oldest one's expiry", async () => {
    const stub = limiter();
    const seededAt = await seed(stub, [WINDOW_MS + 1_000, 2_000, 1_000]);
    await runDurableObjectAlarm(stub);
    expect(await storedState(stub)).toEqual({
      keys: 1,
      timestamps: [seededAt - 2_000, seededAt - 1_000],
      alarm: seededAt - 2_000 + WINDOW_MS,
    });
  });
});
