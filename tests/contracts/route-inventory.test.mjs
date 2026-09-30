import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getProjectStaticParams } from "../../apps/site/src/content/portfolio.ts";

const outRoot = path.resolve("apps", "site", "out");
const PRIVATE_ROUTE =
  /\/(?:admin|dashboard|login|log-in|signin|sign-in|signup|sign-up|register|account|auth)(?:[/"'?#]|$)/i;

async function filesUnder(directory, extension) {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) =>
      path
        .relative(outRoot, path.join(entry.parentPath, entry.name))
        .replaceAll("\\", "/"),
    )
    .sort();
}

test("static output contains only the homepage, not-found, and project pages", async () => {
  const projectPages = getProjectStaticParams().map(
    ({ slug }) => `projects/${slug}/index.html`,
  );
  // 404/ and _not-found/ are copies Next.js emits for the not-found route.
  const expected = [
    "404.html",
    "404/index.html",
    "_not-found/index.html",
    "index.html",
    ...projectPages,
  ].sort();
  assert.deepEqual(await filesUnder(outRoot, ".html"), expected);
});

test("no page or script references a login, admin, or dashboard route", async () => {
  const files = [
    ...(await filesUnder(outRoot, ".html")),
    ...(await filesUnder(outRoot, ".js")),
    "sitemap.xml",
    "robots.txt",
  ];
  const offenders = [];
  for (const file of files) {
    const source = await readFile(path.join(outRoot, file), "utf8");
    if (PRIVATE_ROUTE.test(source)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
