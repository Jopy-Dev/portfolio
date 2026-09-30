// Drives the Contact form against a locally running site and Contact Worker.
// Real Worker paths: validation, success, double submit, verification failure,
// rate limit. Provider failures the local Worker cannot produce use fulfilled
// responses so the client mapping and copy are still exercised end to end.
// Usage: node tests/browser/contact-journey.cjs <playwright-core path> [chromium|cross]
const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const playwright = require(process.argv[2]);
const {
  isReportOnlyNotice,
  isTurnstileInternal,
  launchOptions,
} = require("./browser-env.cjs");
const mode = process.argv[3] || "chromium";
const base = process.env.BROWSER_TEST_BASE || "http://localhost:4173";
const endpoint =
  process.env.CONTACT_ENDPOINT || "http://127.0.0.1:8787/v1/contact";
const output =
  process.env.BROWSER_TEST_OUTPUT || "test-results/contact-journey";

const COPY = {
  validation: "Check the highlighted fields and try again.",
  success: "Message sent. Thank you for reaching out.",
  verification:
    "Verification didn't pass. Complete the check again, then resend.",
  rateLimited:
    "Too many attempts from this connection. Try again in 10 minutes.",
  deliveryFailed:
    "Your message couldn't be delivered right now. Your text is still here, so you can try again later.",
  transport:
    "The message couldn't reach the server. Check your connection and try again.",
  uncertain:
    "We couldn't confirm whether your message was sent. It may have arrived; sending again could create a duplicate.",
};
const FIELD_ERRORS = [
  "Enter your name.",
  "Enter a valid email address.",
  "Enter a subject.",
  "Enter a message.",
];
const VALUES = {
  Name: "Test Visitor",
  Email: "visitor@example.test",
  Subject: "Local journey check",
  Message: "Hello from the local browser journey.",
};
const PLANS = {
  chromium: { engines: ["chromium"], widths: [1280, 375] },
  cross: { engines: ["firefox", "webkit"], widths: [1280] },
};

// Each context gets its own client address so limiter windows never overlap;
// the local Worker takes it from CF-Connecting-IP (the edge sets it in production).
function clientIp() {
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  return `10.${bytes[0]}.${bytes[1]}.${bytes[2]}`;
}

async function exhaustLimiter(ip) {
  // Admission runs before Origin, parsing, and Turnstile, so these requests
  // fill the window without any verification call or email.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
      body: "{}",
    });
    assert.notEqual(response.status, 429, "window filled too early");
  }
}

function corsJson(status, body) {
  return {
    status,
    contentType: "application/json",
    headers: {
      "Access-Control-Allow-Origin": new URL(base).origin,
      Vary: "Origin",
    },
    body: JSON.stringify(body),
  };
}

async function openContact(browser, width, scenario) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
  });
  await context.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      window.__cspViolations.push(
        `${event.effectiveDirective} ${event.blockedURI}`,
      ),
    );
  });
  const page = await context.newPage();
  const record = { posts: [], responses: [], failures: [] };
  const expected = scenario.expect ?? {};
  page.on("pageerror", (error) =>
    record.failures.push(`pageerror: ${error.message}`),
  );
  page.on("console", (entry) => {
    if (entry.type() !== "error") return;
    const text = entry.text();
    if (expected.status && text.includes(`status of ${expected.status}`))
      return;
    // Chromium and Firefox word the deliberately reset request differently.
    const resetNotice =
      text.includes("net::") ||
      (text.includes(endpoint) &&
        text.includes("CORS request did not succeed"));
    if (expected.aborted && resetNotice) return;
    if (isReportOnlyNotice(text)) return;
    if (isTurnstileInternal(entry.location().url)) return;
    record.failures.push(`console: ${text}`);
  });
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText ?? "";
    if (request.method() === "HEAD" && error === "net::ERR_ABORTED") return;
    if (isTurnstileInternal(request.url())) return;
    if (expected.aborted && request.url() === endpoint) return;
    record.failures.push(`requestfailed: ${request.url()} ${error}`);
  });
  page.on("request", (request) => {
    if (request.url() === endpoint && request.method() === "POST")
      record.posts.push(request.postDataJSON());
  });
  page.on("response", async (response) => {
    if (response.url() === endpoint && response.request().method() === "POST") {
      const body = await response.json().catch(() => null);
      record.responses.push({ status: response.status(), body });
      if (response.status() === expected.status) return;
    }
    if (response.status() >= 400)
      record.failures.push(`http ${response.status()}: ${response.url()}`);
  });
  const ip = scenario.ip ?? clientIp();
  await page.route(endpoint, (route) =>
    scenario.route
      ? scenario.route(route)
      : route.continue({
          headers: { ...route.request().headers(), "cf-connecting-ip": ip },
        }),
  );
  await page.goto(`${base}/#contact`);
  await page
    .locator(".preloader")
    .waitFor({ state: "hidden", timeout: 10_000 });
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page
    .locator('.turnstile-shell[data-state="ready"]')
    .waitFor({ timeout: 15_000 });
  return { context, page, record };
}

async function fill(page) {
  for (const [label, value] of Object.entries(VALUES))
    await page.getByLabel(label, { exact: true }).fill(value);
}

async function fieldValues(page) {
  const values = {};
  for (const label of Object.keys(VALUES))
    values[label] = await page.getByLabel(label, { exact: true }).inputValue();
  return values;
}

async function submitAndSettle(page, copy) {
  await page.getByRole("button", { name: "Send message" }).click();
  await page
    .locator(".form-status")
    .filter({ hasText: copy })
    .waitFor({ timeout: 25_000 });
}

function tokenOf(route) {
  return JSON.parse(route.request().postData() ?? "{}");
}

const SCENARIOS = [
  {
    name: "validation-failed",
    async run(page, record) {
      await page.getByRole("button", { name: "Send message" }).click();
      await page
        .locator(".form-status")
        .filter({ hasText: COPY.validation })
        .waitFor();
      for (const message of FIELD_ERRORS)
        await page.getByText(message, { exact: true }).waitFor();
      assert.equal(
        await page.evaluate(() => document.activeElement?.id),
        "contact-name",
      );
      assert.equal(record.posts.length, 0);
    },
  },
  {
    name: "success-single-post",
    async run(page, record) {
      await fill(page);
      // Two back-to-back submits must still produce one request.
      await page.evaluate(() => {
        const form = document.querySelector(".contact-form");
        form.requestSubmit();
        form.requestSubmit();
      });
      await page
        .locator(".form-status")
        .filter({ hasText: COPY.success })
        .waitFor({ timeout: 25_000 });
      assert.equal(record.posts.length, 1);
      assert.equal(record.responses[0].status, 200);
      assert.equal(record.responses[0].body.code, "contact_sent");
      assert.equal(
        record.responses[0].body.requestId,
        record.posts[0].requestId,
      );
      assert.deepEqual(Object.values(await fieldValues(page)), [
        "",
        "",
        "",
        "",
      ]);
      return { requestId: record.posts[0].requestId };
    },
  },
  {
    // The local Worker runs Turnstile's always-pass test secret, which accepts
    // any token, so a rejection has to be supplied as a response.
    name: "verification-failed (fulfilled response)",
    expect: { status: 403 },
    route: (route) =>
      route.fulfill(
        corsJson(403, {
          ok: false,
          code: "verification_failed",
          requestId: tokenOf(route).requestId,
        }),
      ),
    async run(page, record) {
      await fill(page);
      await submitAndSettle(page, COPY.verification);
      assert.equal(record.responses[0].body.code, "verification_failed");
      assert.deepEqual(await fieldValues(page), VALUES);
    },
  },
  {
    name: "rate-limited",
    expect: { status: 429 },
    setup: async (scenario) => {
      scenario.ip = clientIp();
      await exhaustLimiter(scenario.ip);
    },
    async run(page, record) {
      await fill(page);
      await submitAndSettle(page, COPY.rateLimited);
      assert.equal(record.responses[0].body.code, "rate_limited");
      assert.deepEqual(await fieldValues(page), VALUES);
    },
  },
  {
    name: "delivery-failed (fulfilled response)",
    expect: { status: 503 },
    route: (route) =>
      route.fulfill(
        corsJson(503, {
          ok: false,
          code: "delivery_failed",
          requestId: tokenOf(route).requestId,
        }),
      ),
    async run(page) {
      await fill(page);
      await submitAndSettle(page, COPY.deliveryFailed);
      assert.deepEqual(await fieldValues(page), VALUES);
    },
  },
  {
    name: "transport-failed (fulfilled response)",
    expect: { status: 503 },
    route: (route) =>
      route.fulfill(
        corsJson(503, {
          ok: false,
          code: "contact_unavailable",
          requestId: tokenOf(route).requestId,
        }),
      ),
    async run(page) {
      await fill(page);
      await submitAndSettle(page, COPY.transport);
      assert.deepEqual(await fieldValues(page), VALUES);
    },
  },
  {
    name: "delivery-uncertain (connection reset)",
    expect: { aborted: true },
    route: (route) => route.abort("connectionreset"),
    async run(page, record) {
      await fill(page);
      await submitAndSettle(page, COPY.uncertain);
      assert.equal(record.posts.length, 1);
      assert.deepEqual(await fieldValues(page), VALUES);
    },
  },
];

async function runScenario(browser, engine, width, template) {
  const scenario = { ...template };
  if (scenario.setup) await scenario.setup(scenario);
  const { context, page, record } = await openContact(browser, width, scenario);
  try {
    const extra = (await scenario.run(page, record)) ?? {};
    const csp = await page.evaluate(() => window.__cspViolations);
    assert.deepEqual(csp, [], "no CSP violations");
    assert.deepEqual(record.failures, []);
    return {
      engine,
      width,
      scenario: scenario.name,
      pass: true,
      posts: record.posts.length,
      ...extra,
    };
  } catch (error) {
    return {
      engine,
      width,
      scenario: scenario.name,
      pass: false,
      error: error.message,
      failures: record.failures,
      responses: record.responses,
    };
  } finally {
    await context.close();
  }
}

(async () => {
  const plan = PLANS[mode];
  assert.ok(plan, `unknown mode ${mode}`);
  await mkdir(output, { recursive: true });
  const results = [];
  for (const engine of plan.engines) {
    const browser = await playwright[engine].launch(launchOptions(engine));
    try {
      for (const width of plan.widths) {
        for (const scenario of SCENARIOS) {
          const result = await runScenario(browser, engine, width, scenario);
          console.log(JSON.stringify(result));
          results.push(result);
        }
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    path.join(output, `${mode}-results.json`),
    JSON.stringify(results, null, 2),
  );
  const failed = results.filter((result) => !result.pass);
  console.log(
    JSON.stringify({ mode, total: results.length, failed: failed.length }),
  );
  if (failed.length > 0) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
