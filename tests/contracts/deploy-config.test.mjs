import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  artifactSources,
  deployConfigErrors,
} from "../../scripts/guards/check-deploy-config.mjs";

const PRODUCTION = "https://contact.jopy.dev/v1/contact";
const GOOD = {
  env: {
    NEXT_PUBLIC_CONTACT_ENDPOINT: PRODUCTION,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAexampleRealKey",
  },
  headers:
    "/*\n  Content-Security-Policy-Report-Only: connect-src 'self' https://contact.jopy.dev; x\n",
  scripts: [`fetch("${PRODUCTION}")`],
};

test("accepts a production build wired to the approved endpoint", () => {
  assert.deepEqual(deployConfigErrors(GOOD), []);
});

for (const [label, change, message] of [
  [
    "a missing endpoint",
    { env: { ...GOOD.env, NEXT_PUBLIC_CONTACT_ENDPOINT: undefined } },
    /endpoint/,
  ],
  [
    "a staging endpoint",
    {
      env: {
        ...GOOD.env,
        NEXT_PUBLIC_CONTACT_ENDPOINT:
          "https://contact-staging.jopy.dev/v1/contact",
      },
    },
    /endpoint/,
  ],
  [
    "a loopback endpoint",
    {
      env: {
        ...GOOD.env,
        NEXT_PUBLIC_CONTACT_ENDPOINT: "http://127.0.0.1:8787/v1/contact",
      },
    },
    /endpoint/,
  ],
  [
    "a missing sitekey",
    { env: { ...GOOD.env, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "" } },
    /sitekey/,
  ],
  [
    "a Turnstile testing sitekey",
    {
      env: {
        ...GOOD.env,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      },
    },
    /testing sitekey/,
  ],
  [
    "headers without the Contact origin",
    {
      headers:
        "/*\n  Content-Security-Policy-Report-Only: connect-src 'self'; x\n",
    },
    /connect-src/,
  ],
  [
    "a bundle still calling a loopback Worker",
    { scripts: ['fetch("http://127.0.0.1:8787/v1/contact")'] },
    /loopback/,
  ],
  [
    "a bundle without the production endpoint",
    { scripts: ["noop()"] },
    /bundle/,
  ],
]) {
  test(`rejects ${label}`, () => {
    const errors = deployConfigErrors({ ...GOOD, ...change });
    assert.ok(
      errors.some((error) => message.test(error)),
      errors.join("; "),
    );
  });
}

// The Contact config is a build-time server prop, so a real export serializes
// the endpoint into the page HTML and RSC payload, not into a JS chunk.
async function exportFixture(files) {
  const out = await mkdtemp(path.join(os.tmpdir(), "deploy-config-"));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(out, name)), { recursive: true });
    await writeFile(path.join(out, name), content);
  }
  return out;
}

test("accepts an export that ships the endpoint in the page payload", async () => {
  const out = await exportFixture({
    "index.html": `<script>self.__next_f.push([1,"${PRODUCTION}"])</script>`,
    "index.txt": `0:{"endpoint":"${PRODUCTION}"}`,
    "_next/static/chunks/app.js": "export const noop = () => {};",
  });
  try {
    const scripts = await artifactSources(out);
    assert.deepEqual(deployConfigErrors({ ...GOOD, scripts }), []);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("accepts project copy that mentions a local app URL", () => {
  const scripts = [
    ...GOOD.scripts,
    '{"usage":"Local URL: http://127.0.0.1:8989"}',
  ];
  assert.deepEqual(deployConfigErrors({ ...GOOD, scripts }), []);
});

test("rejects an export whose page payload still calls a loopback Worker", async () => {
  const out = await exportFixture({
    "index.html": `<script>self.__next_f.push([1,"${PRODUCTION}"])</script>`,
    "index.txt": '0:{"endpoint":"http://127.0.0.1:8787/v1/contact"}',
  });
  try {
    const scripts = await artifactSources(out);
    const errors = deployConfigErrors({ ...GOOD, scripts });
    assert.ok(
      errors.some((error) => /loopback/.test(error)),
      errors.join("; "),
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
