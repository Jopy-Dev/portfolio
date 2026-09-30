import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const scanRoots = [
  path.join(root, "apps", "site", "src"),
  path.join(root, "apps", "site", "out"),
];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);
const forbiddenKeys = [
  "CONTACT_DESTINATION",
  "TURNSTILE_SECRET_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_RULES_API_TOKEN",
];
const allowedPublicEmails = new Set(["contact@jopy.dev"]);
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const violations = [];

for (const scanRoot of scanRoots) {
  for (const file of await walk(scanRoot)) {
    if (!textExtensions.has(path.extname(file))) continue;
    const source = await readFile(file, "utf8");
    for (const key of forbiddenKeys) {
      if (source.includes(key)) record(file, `secret-only key ${key}`);
    }
    for (const match of source.matchAll(emailPattern)) {
      const email = match[0].toLowerCase();
      if (!allowedPublicEmails.has(email))
        record(file, "unapproved email address");
    }
  }
}

if (violations.length > 0) {
  throw new Error(`Public bundle leak guard failed:\n${violations.join("\n")}`);
}
process.stdout.write("PUBLIC_BUNDLE_GUARD_PASS\n");

function record(file, reason) {
  violations.push(`${path.relative(root, file)}: ${reason}`);
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}
