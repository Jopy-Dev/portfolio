import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Run after `npm run build` in the production deploy pipeline only. Local and
// CI builds may be unconfigured or point at a local Worker; production may not.
export const PRODUCTION_ENDPOINT = "https://contact.jopy.dev/v1/contact";
const PRODUCTION_ORIGIN = new URL(PRODUCTION_ENDPOINT).origin;

// Cloudflare's published dummy sitekeys (always pass/fail/interactive).
const TESTING_SITEKEY = /^[123]x0{20}(AA|AB|BB|FF)$/;
const LOOPBACK_URL = /https?:\/\/(127\.0\.0\.1|localhost)\b/;

function envErrors(env) {
  const errors = [];
  if (env.NEXT_PUBLIC_CONTACT_ENDPOINT !== PRODUCTION_ENDPOINT) {
    errors.push(`Contact endpoint must be ${PRODUCTION_ENDPOINT}.`);
  }
  const sitekey = (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
  if (!sitekey) errors.push("Turnstile sitekey is missing.");
  else if (TESTING_SITEKEY.test(sitekey)) {
    errors.push("Turnstile testing sitekey cannot ship to production.");
  }
  return errors;
}

function artifactErrors(headers, scripts) {
  const errors = [];
  const connect = /connect-src ([^;\n]*)/.exec(headers)?.[1] ?? "";
  if (!connect.split(" ").includes(PRODUCTION_ORIGIN)) {
    errors.push(`CSP connect-src must allow ${PRODUCTION_ORIGIN}.`);
  }
  if (scripts.some((source) => LOOPBACK_URL.test(source))) {
    errors.push("Client bundle references a loopback URL.");
  }
  if (!scripts.some((source) => source.includes(PRODUCTION_ENDPOINT))) {
    errors.push("Client bundle does not contain the production endpoint.");
  }
  return errors;
}

export function deployConfigErrors({ env, headers, scripts }) {
  return [...envErrors(env), ...artifactErrors(headers, scripts)];
}

async function scriptSources(dir) {
  const sources = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources.push(...(await scriptSources(full)));
    else if (entry.name.endsWith(".js"))
      sources.push(await readFile(full, "utf8"));
  }
  return sources;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const out = path.join(root, "apps", "site", "out");
  const errors = deployConfigErrors({
    env: process.env,
    headers: await readFile(path.join(out, "_headers"), "utf8"),
    scripts: await scriptSources(path.join(out, "_next")),
  });
  if (errors.length > 0) {
    throw new Error(`Deploy configuration check failed:\n${errors.join("\n")}`);
  }
  process.stdout.write("DEPLOY_CONFIG_PASS\n");
}
