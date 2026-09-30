import assert from "node:assert/strict";
import test from "node:test";
import { readContactConfig } from "../../apps/site/src/lib/env.ts";

function withEnv(endpoint, sitekey, run) {
  const saved = { ...process.env };
  if (endpoint === undefined) delete process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;
  else process.env.NEXT_PUBLIC_CONTACT_ENDPOINT = endpoint;
  if (sitekey === undefined) delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  else process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = sitekey;
  try {
    return run();
  } finally {
    process.env = saved;
  }
}

const SITEKEY = "1x00000000000000000000AA";

for (const endpoint of [
  "https://contact.jopy.dev/v1/contact",
  "http://127.0.0.1:8787/v1/contact",
  "http://localhost:8787/v1/contact",
]) {
  test(`accepts ${endpoint}`, () => {
    assert.deepEqual(withEnv(endpoint, SITEKEY, readContactConfig), {
      endpoint,
      sitekey: SITEKEY,
    });
  });
}

for (const [label, endpoint, sitekey] of [
  [
    "plain http to a public host",
    "http://contact.jopy.dev/v1/contact",
    SITEKEY,
  ],
  [
    "http to a look-alike loopback host",
    "http://127.0.0.1.evil.test/v1/contact",
    SITEKEY,
  ],
  ["a missing endpoint", undefined, SITEKEY],
  ["a missing sitekey", "https://contact.jopy.dev/v1/contact", undefined],
  ["a blank sitekey", "https://contact.jopy.dev/v1/contact", "  "],
]) {
  test(`treats ${label} as unconfigured`, () => {
    assert.equal(withEnv(endpoint, sitekey, readContactConfig), null);
  });
}
