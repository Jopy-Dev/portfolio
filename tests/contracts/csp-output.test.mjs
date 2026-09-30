import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { executableInlineScripts } from "../../scripts/security/inline-scripts.mjs";
import {
  cspHash,
  MAX_HEADER_LINE,
} from "../../scripts/security/security-headers.mjs";

// Runs against the real static export produced by `npm run build`.
const outDir = path.resolve("apps", "site", "out");

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "_next") {
      found.push(...(await htmlFiles(full)));
    } else if (entry.name.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

const headers = await readFile(path.join(outDir, "_headers"), "utf8");

test("the exported site ships a _headers file for every route", () => {
  assert.match(headers, /^\/\*\n/);
  assert.match(headers, /^ {2}Content-Security-Policy: /m);
});

test("every executable inline script in the export is allowed by hash", async () => {
  const files = await htmlFiles(outDir);
  assert.ok(files.length >= 10);
  for (const file of files) {
    const html = await readFile(file, "utf8");
    for (const script of executableInlineScripts(html)) {
      assert.ok(
        headers.includes(cspHash(script)),
        `${path.relative(outDir, file)} has an unhashed inline script`,
      );
    }
  }
});

test("every _headers line fits the provider limit", () => {
  for (const line of headers.split("\n")) {
    assert.ok(line.length <= MAX_HEADER_LINE, `line of ${line.length} chars`);
  }
});
