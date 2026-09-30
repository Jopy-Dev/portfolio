import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const siteRoot = path.join(root, "apps", "site");
const examplePath = path.join(siteRoot, ".env.example");
const schemaPath = path.join(siteRoot, "src", "lib", "env.ts");
const envLinePattern = /^\s*([A-Z][A-Z0-9_]*)\s*=.*$/gm;
const schemaKeyPattern = /^\s*([A-Z][A-Z0-9_]*)\s*:\s*z\b/gm;
const secretLikePublicKeyPattern =
  /^NEXT_PUBLIC_.*(?:SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE|REDIS)/;

const [exampleText, schemaText] = await Promise.all([
  readFile(examplePath, "utf8"),
  readFile(schemaPath, "utf8"),
]);
const exampleKeys = collectKeys(exampleText, envLinePattern);
const schemaKeys = collectKeys(schemaText, schemaKeyPattern);
const errors = [];

for (const key of schemaKeys) {
  if (!exampleKeys.has(key)) errors.push(`Missing from .env.example: ${key}`);
}
for (const key of exampleKeys) {
  if (!schemaKeys.has(key)) errors.push(`Missing from env schema: ${key}`);
  if (secretLikePublicKeyPattern.test(key)) {
    errors.push(`Secret-like key uses public prefix: ${key}`);
  }
}

if (errors.length > 0) {
  throw new Error(`Environment parity failed:\n${errors.join("\n")}`);
}
process.stdout.write(`ENV_PARITY_PASS (${schemaKeys.size} keys)\n`);

function collectKeys(source, pattern) {
  return new Set(Array.from(source.matchAll(pattern), (match) => match[1]));
}
