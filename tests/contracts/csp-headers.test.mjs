import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSecurityPolicy,
  buildHeadersFile,
  cspHash,
} from "../../scripts/security/security-headers.mjs";

const EMPTY_SHA256 = "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='";

test("hashes script text as base64 SHA-256 in CSP source syntax", () => {
  assert.equal(cspHash(""), EMPTY_SHA256);
});

test("hashes the UTF-8 bytes of non-ASCII script text", () => {
  assert.equal(
    cspHash("é"),
    "'sha256-SplVfkAzw1Od4utlRyAXytX5VX96BiWgnxw/biumnEw='",
  );
});

test("builds a policy with sorted, de-duplicated hashes and exact provider origins", () => {
  const csp = buildContentSecurityPolicy({
    hashes: ["'sha256-b'", "'sha256-a'", "'sha256-b'"],
    contactEndpoint: "https://contact.jopy.dev/v1/contact",
  });
  assert.equal(
    csp,
    [
      "default-src 'self'",
      "script-src 'self' 'sha256-a' 'sha256-b' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "style-src 'self'",
      "style-src-attr 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' https://contact.jopy.dev",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
});

test("omits the Contact origin for an unconfigured build", () => {
  const csp = buildContentSecurityPolicy({ hashes: [], contactEndpoint: null });
  assert.match(csp, /connect-src 'self';/);
});

test("never allows inline or eval script execution", () => {
  const csp = buildContentSecurityPolicy({ hashes: [], contactEndpoint: null });
  const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "));
  assert.doesNotMatch(scriptSrc, /unsafe-inline|unsafe-eval|\*/);
});

test("writes one /* rule with report-only CSP and the static security headers", () => {
  const file = buildHeadersFile({
    csp: "default-src 'self'",
    mode: "report-only",
  });
  assert.equal(
    file,
    [
      "/*",
      "  Content-Security-Policy-Report-Only: default-src 'self'",
      "  Strict-Transport-Security: max-age=31536000",
      "  X-Content-Type-Options: nosniff",
      "  X-Frame-Options: DENY",
      "  X-XSS-Protection: 0",
      "  Referrer-Policy: strict-origin-when-cross-origin",
      "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
      "  Cross-Origin-Opener-Policy: same-origin",
      "  Cross-Origin-Resource-Policy: same-origin",
      "",
    ].join("\n"),
  );
});

test("uses the enforcing header name in enforce mode", () => {
  const file = buildHeadersFile({ csp: "default-src 'self'", mode: "enforce" });
  assert.match(file, /^ {2}Content-Security-Policy: default-src 'self'$/m);
  assert.doesNotMatch(file, /Report-Only/);
});

test("refuses a header line over the 2,000-character provider limit", () => {
  assert.throws(
    () =>
      buildHeadersFile({
        csp: `default-src ${"x".repeat(2000)}`,
        mode: "enforce",
      }),
    /2,000/,
  );
});
