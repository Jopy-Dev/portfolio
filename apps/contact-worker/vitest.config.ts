import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Test-only secrets: official Turnstile always-pass dummy secret, a
// non-routable destination, and a fixed non-production HMAC key.
const TEST_SECRETS = {
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  CONTACT_DESTINATION: "owner@example.test",
  RATE_LIMIT_HMAC_SECRET: "test-only-rate-limit-hmac-key-0000000000",
};

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: { bindings: TEST_SECRETS },
    }),
  ],
  test: {
    // Run with --coverage. The Workers runtime supports Istanbul only.
    coverage: {
      provider: "istanbul",
      include: ["src/**"],
      // Entry wiring passes the real fetch to Siteverify; it is exercised
      // against the local Worker, not in unit tests.
      exclude: ["src/index.ts"],
      thresholds: {
        statements: 100,
        lines: 100,
        functions: 100,
        // Remaining arms are typed fallbacks no request can reach.
        branches: 95,
      },
    },
  },
});
