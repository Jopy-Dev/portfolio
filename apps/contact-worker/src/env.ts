import { z } from "zod";

const PRODUCTION_ORIGIN = "https://portfolio.jopy.dev";
const MIN_HMAC_SECRET_BYTES = 32;

const exactOrigin = z
  .string()
  .refine((value) => URL.canParse(value) && new URL(value).origin === value);

const hasMethod = (name: string) => (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Record<string, unknown>)[name] === "function";

const EnvSchema = z
  .object({
    TURNSTILE_SECRET_KEY: z.string().min(1),
    CONTACT_DESTINATION: z.email(),
    RATE_LIMIT_HMAC_SECRET: z
      .string()
      .refine(
        (value) =>
          new TextEncoder().encode(value).byteLength >= MIN_HMAC_SECRET_BYTES,
      ),
    ALLOWED_ORIGIN: exactOrigin,
    TURNSTILE_EXPECTED_HOSTNAME: z.string().min(1),
    TURNSTILE_EXPECTED_ACTION: z.literal("portfolio_contact"),
    TURNSTILE_ALLOW_TESTING_KEY: z.enum(["true", "false"]),
    CONTACT_EMAIL: z.custom(hasMethod("send")),
    CONTACT_RATE_LIMITER: z.custom(hasMethod("getByName")),
  })
  // Dummy Turnstile results must never be honoured for the real site.
  .refine(
    (env) =>
      !(
        env.ALLOWED_ORIGIN === PRODUCTION_ORIGIN &&
        env.TURNSTILE_ALLOW_TESTING_KEY === "true"
      ),
  );

const verdicts = new WeakMap<object, boolean>();

// Validated once per isolate (env object) and cached; a bad deployment fails
// closed on every request instead of partially working.
export function isValidEnv(env: Env): boolean {
  const cached = verdicts.get(env);
  if (cached !== undefined) return cached;
  const valid = EnvSchema.safeParse(env).success;
  verdicts.set(env, valid);
  return valid;
}
