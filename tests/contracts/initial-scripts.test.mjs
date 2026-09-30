import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const outRoot = path.resolve("apps", "site", "out");
// The validation library ships with the Contact form logic, which loads when
// a visitor first uses the form, so no page pays for it on first load.
const VALIDATION_LIBRARY = "ZodError";

async function initialScripts(page) {
  const html = await readFile(path.join(outRoot, page), "utf8");
  return [...html.matchAll(/<script[^>]+src="(\/_next\/[^"]+\.js)"/g)].map(
    (match) => match[1],
  );
}

for (const page of ["index.html", "projects/topspin/index.html", "404.html"]) {
  test(`${page} loads no form-validation code up front`, async () => {
    const scripts = await initialScripts(page);
    assert.ok(scripts.length > 0, "no scripts found");
    const offenders = [];
    for (const script of scripts) {
      const source = await readFile(path.join(outRoot, script), "utf8");
      if (source.includes(VALIDATION_LIBRARY)) offenders.push(script);
    }
    assert.deepEqual(offenders, []);
  });
}
