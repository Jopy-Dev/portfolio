import { z } from "zod";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost"]);

// HTTPS everywhere; plain http only for a local `wrangler dev` Worker.
function isAllowedEndpoint(value: string): boolean {
  const url = new URL(value);
  return (
    url.protocol === "https:" ||
    (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname))
  );
}

export const publicSiteEnvSchema = z.strictObject({
  NEXT_PUBLIC_CONTACT_ENDPOINT: z.url().refine(isAllowedEndpoint, {
    message: "Contact endpoint must use HTTPS (http only for loopback).",
  }),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().trim().min(1).max(256),
});

export type PublicSiteEnv = z.infer<typeof publicSiteEnvSchema>;

export type ContactConfig = { endpoint: string; sitekey: string };

// Literal process.env references let Next inline the public values at build.
// A missing or invalid pair renders the form as unavailable, never broken.
export function readContactConfig(): ContactConfig | null {
  const result = publicSiteEnvSchema.safeParse({
    NEXT_PUBLIC_CONTACT_ENDPOINT: process.env.NEXT_PUBLIC_CONTACT_ENDPOINT,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
  if (!result.success) return null;
  return {
    endpoint: result.data.NEXT_PUBLIC_CONTACT_ENDPOINT,
    sitekey: result.data.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  };
}
