import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { writeSecurityHeaders } from "../../scripts/security/generate-csp-manifest.mjs";
import { cspHash } from "../../scripts/security/security-headers.mjs";

async function exportFixture(files) {
  const dir = await mkdtemp(path.join(tmpdir(), "csp-out-"));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), content);
  }
  return dir;
}

const CONFIG_ENV = {
  NEXT_PUBLIC_CONTACT_ENDPOINT: "https://contact.jopy.dev/v1/contact",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
};

test("hashes every executable inline script across all exported pages", async () => {
  const dir = await exportFixture({
    "index.html":
      '<script>home()</script><script type="application/ld+json">{"x":1}</script>',
    "projects/a/index.html":
      '<script>detail()</script><script src="/x.js"></script>',
    "404.html": "<script>home()</script>",
    "_next/static/chunk.html": "<script>ignored()</script>",
  });
  try {
    await writeSecurityHeaders(dir, CONFIG_ENV);
    const headers = await readFile(path.join(dir, "_headers"), "utf8");
    assert.ok(headers.includes(cspHash("home()")));
    assert.ok(headers.includes(cspHash("detail()")));
    assert.ok(!headers.includes(cspHash('{"x":1}')));
    assert.ok(!headers.includes(cspHash("ignored()")));
    assert.match(headers, /connect-src 'self' https:\/\/contact\.jopy\.dev;/);
    assert.match(headers, /^ {2}Content-Security-Policy: /m);
    assert.doesNotMatch(headers, /Report-Only/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("leaves the Contact origin out when the build has no Contact config", async () => {
  const dir = await exportFixture({ "index.html": "<p>static</p>" });
  try {
    await writeSecurityHeaders(dir, {});
    const headers = await readFile(path.join(dir, "_headers"), "utf8");
    assert.match(headers, /connect-src 'self';/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
