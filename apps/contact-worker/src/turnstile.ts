import { z } from "zod";

export const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 4_000;
const MAX_CHALLENGE_AGE_MS = 300_000;
const MAX_CLOCK_SKEW_MS = 30_000;

// Codes that mean "this token is not acceptable" (403). Anything else, such
// as internal-error or a rejected secret, is a provider/config fault (503).
const TOKEN_REJECTIONS = new Set([
  "missing-input-response",
  "invalid-input-response",
  "timeout-or-duplicate",
]);

export type Verdict = "valid" | "rejected" | "unavailable";

export type SiteverifyInput = {
  secret: string;
  token: string;
  remoteIp: string;
  idempotencyKey: string;
};

export type Expectations = {
  hostname: string;
  action: string;
  allowTestingKey: boolean;
  nowMs: number;
};

const SiteverifySchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).default([]),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  metadata: z
    .object({ result_with_testing_key: z.boolean().optional() })
    .optional(),
});

type SiteverifyResult = z.infer<typeof SiteverifySchema>;

function failureVerdict(result: SiteverifyResult): Verdict {
  const codes = result["error-codes"];
  const tokenProblem =
    codes.length > 0 && codes.every((code) => TOKEN_REJECTIONS.has(code));
  return tokenProblem ? "rejected" : "unavailable";
}

function challengeVerdict(challengeTs: string | undefined, nowMs: number) {
  const issuedMs = Date.parse(challengeTs ?? "");
  if (Number.isNaN(issuedMs)) return "unavailable";
  const ageMs = nowMs - issuedMs;
  const fresh = ageMs <= MAX_CHALLENGE_AGE_MS && ageMs >= -MAX_CLOCK_SKEW_MS;
  return fresh ? "valid" : "rejected";
}

// Cloudflare's dummy secrets answer hostname example.com and no action; they
// are honoured only where the environment explicitly allows testing keys.
function identityMatches(result: SiteverifyResult, expected: Expectations) {
  const testing = result.metadata?.result_with_testing_key === true;
  if (testing && !expected.allowTestingKey) return false;
  if (result.hostname !== expected.hostname) return false;
  return testing || result.action === expected.action;
}

export function judge(
  result: SiteverifyResult,
  expected: Expectations,
): Verdict {
  if (!result.success) return failureVerdict(result);
  if (!identityMatches(result, expected)) return "rejected";
  return challengeVerdict(result.challenge_ts, expected.nowMs);
}

async function callSiteverify(
  input: SiteverifyInput,
  fetcher: typeof fetch,
): Promise<SiteverifyResult | null> {
  const response = await fetcher(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: input.secret,
      response: input.token,
      remoteip: input.remoteIp,
      idempotency_key: input.idempotencyKey,
    }),
    signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const parsed = SiteverifySchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

// One bounded call, never retried: a token is single-use and the request ID
// doubles as Siteverify's idempotency key.
export async function verifyTurnstile(
  input: SiteverifyInput,
  expected: Expectations,
  fetcher: typeof fetch,
): Promise<Verdict> {
  try {
    const result = await callSiteverify(input, fetcher);
    return result === null ? "unavailable" : judge(result, expected);
  } catch {
    return "unavailable";
  }
}
