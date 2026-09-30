import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const sourceRoot = path.join(root, "apps", "site", "src");
const allowedColorFile = path.join(sourceRoot, "styles", "tokens.css");
const colorLiteral = /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/gi;
const violations = [];

for (const file of await walk(sourceRoot)) {
  if (!/\.(?:css|ts|tsx)$/.test(file) || file === allowedColorFile) continue;
  const source = await readFile(file, "utf8");
  const matches = [...source.matchAll(colorLiteral)].map((match) => match[0]);
  if (matches.length > 0)
    violations.push(`${path.relative(root, file)}: ${matches.join(", ")}`);
}

if (violations.length > 0)
  throw new Error(
    `Raw color literals outside token source:\n${violations.join("\n")}`,
  );
process.stdout.write("DESIGN_TOKEN_GUARD_PASS\n");

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}
