import { createHash } from "node:crypto";

// Cloudflare Workers static assets `_headers`: each line <= 2,000 characters.
export const MAX_HEADER_LINE = 2000;

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
const WEB_ANALYTICS_ORIGIN = "https://static.cloudflareinsights.com";

export function cspHash(scriptText) {
  const digest = createHash("sha256")
    .update(scriptText, "utf8")
    .digest("base64");
  return `'sha256-${digest}'`;
}

// A static export cannot use per-request nonces, so inline scripts are
// allowed only by exact hash; GSAP needs style attributes only.
export function buildContentSecurityPolicy({ hashes, contactEndpoint }) {
  const scriptHashes = [...new Set(hashes)].sort();
  const connect = ["'self'"];
  if (contactEndpoint) connect.push(new URL(contactEndpoint).origin);
  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      ...scriptHashes,
      TURNSTILE_ORIGIN,
      WEB_ANALYTICS_ORIGIN,
    ].join(" "),
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${TURNSTILE_ORIGIN}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

// HSTS deliberately omits includeSubDomains until every jopy.dev host is
// HTTPS-only (shared zone with the future apex site).
const STATIC_HEADERS = [
  ["Strict-Transport-Security", "max-age=31536000"],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["X-XSS-Protection", "0"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Resource-Policy", "same-origin"],
];

export function buildHeadersFile({ csp, mode }) {
  const cspName =
    mode === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
  const lines = [
    "/*",
    ...[[cspName, csp], ...STATIC_HEADERS].map(
      ([name, value]) => `  ${name}: ${value}`,
    ),
  ];
  const tooLong = lines.find((line) => line.length > MAX_HEADER_LINE);
  if (tooLong) {
    throw new Error(
      `_headers line exceeds the 2,000-character limit (${tooLong.length})`,
    );
  }
  return `${lines.join("\n")}\n`;
}
