import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { SITE_ORIGIN } from "../../apps/site/src/lib/site.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
// RFC 9116 recommends an Expires value less than a year ahead; this test
// fails once the file lapses so it gets renewed rather than silently stale.
const MAX_EXPIRY_MS = 366 * DAY_MS;

async function securityTxtFields() {
  const source = await readFile(
    path.resolve("apps", "site", "out", ".well-known", "security.txt"),
    "utf8",
  );
  const fields = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = /^([A-Za-z-]+):\s*(.+)$/.exec(line);
    if (match) fields.set(match[1].toLowerCase(), match[2].trim());
  }
  return fields;
}

test("security.txt points researchers to the contact form without an email address", async () => {
  const fields = await securityTxtFields();
  assert.equal(fields.get("contact"), `${SITE_ORIGIN}/#contact`);
  assert.equal(
    fields.get("canonical"),
    `${SITE_ORIGIN}/.well-known/security.txt`,
  );
  assert.equal(fields.get("preferred-languages"), "en");
});

test("security.txt has a current expiry no more than a year ahead", async () => {
  const expires = Date.parse((await securityTxtFields()).get("expires") ?? "");
  assert.ok(Number.isFinite(expires), "Expires must be an ISO 8601 date");
  const remaining = expires - Date.now();
  assert.ok(remaining > 0, "security.txt has expired; renew Expires");
  assert.ok(remaining <= MAX_EXPIRY_MS, "Expires must be within a year");
});
