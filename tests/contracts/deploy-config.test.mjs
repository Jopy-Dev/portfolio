import assert from "node:assert/strict";
import test from "node:test";
import { deployConfigErrors } from "../../scripts/guards/check-deploy-config.mjs";

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
