import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { publicSiteEnvSchema } from "../../apps/site/src/lib/env.ts";
import { executableInlineScripts } from "./inline-scripts.mjs";
import {
  buildContentSecurityPolicy,
  buildHeadersFile,
  cspHash,
} from "./security-headers.mjs";

// Report-Only until staging proves Turnstile, analytics, hydration and motion
// run clean; switched to "enforce" before the production release.
export const CSP_MODE = "report-only";

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // Framework chunks are external scripts, never HTML documents.
    if (entry.isDirectory() && entry.name !== "_next") {
      found.push(...(await htmlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

// Same rule as the site: the endpoint counts only when the full public
// Contact config is valid, otherwise the form renders unavailable.
function contactEndpointFrom(env) {
  const result = publicSiteEnvSchema.safeParse({
    NEXT_PUBLIC_CONTACT_ENDPOINT: env.NEXT_PUBLIC_CONTACT_ENDPOINT,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
  return result.success ? result.data.NEXT_PUBLIC_CONTACT_ENDPOINT : null;
}

export async function writeSecurityHeaders(outDir, env) {
  const hashes = [];
  for (const file of await htmlFiles(outDir)) {
    const html = await readFile(file, "utf8");
    hashes.push(...executableInlineScripts(html).map(cspHash));
  }
  const csp = buildContentSecurityPolicy({
    hashes,
    contactEndpoint: contactEndpointFrom(env),
  });
  const headers = buildHeadersFile({ csp, mode: CSP_MODE });
  await writeFile(path.join(outDir, "_headers"), headers);
  return { hashCount: new Set(hashes).size, headers };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const { hashCount } = await writeSecurityHeaders(
    path.join(root, "apps", "site", "out"),
    process.env,
  );
  process.stdout.write(
    `SECURITY_HEADERS_WRITTEN (${hashCount} script hashes)\n`,
  );
}
