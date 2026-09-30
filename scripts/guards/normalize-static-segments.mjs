import { copyFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Next 16.3.3 on Windows emits nested segment files; the router requests flat names.
// https://github.com/vercel/next.js/issues/92339 (verified 2026-09).
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../apps/site/out",
);
let copied = 0;
await visit(root);
process.stdout.write(`STATIC_SEGMENT_PATHS_PASS (${copied} normalized)\n`);

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(directory, entry.name);
    if (entry.name.startsWith("__next.")) await flatten(directory, child);
    else await visit(child);
  }
}

async function flatten(parent, directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await flatten(parent, source);
    } else if (entry.name.endsWith(".txt")) {
      const filename = path.relative(parent, source).split(path.sep).join(".");
      const destination = path.join(parent, filename);
      await copySegment(source, destination);
    }
  }
}

async function copySegment(source, destination) {
  const existing = await readFile(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing) {
    if (!existing.equals(await readFile(source))) {
      throw new Error(`Conflicting static segment: ${destination}`);
    }
    return;
  }
  await copyFile(source, destination);
  copied += 1;
}
