// Loads every public route and fails on runtime errors, failed requests,
// unexpected HTTP errors, CSP violations, horizontal overflow, or (in the
// a11y mode) serious/critical axe findings.
// Usage: node tests/browser/route-smoke.cjs <playwright-core path> [chromium|cross|a11y]
const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const playwright = require(process.argv[2]);
const {
  isTurnstileFrameNoise,
  isTurnstileInternal,
  launchOptions,
} = require("./browser-env.cjs");
const mode = process.argv[3] || "chromium";
const base = process.env.BROWSER_TEST_BASE || "http://localhost:4173";
const output = process.env.BROWSER_TEST_OUTPUT || "test-results/route-smoke";

const PROJECT_SLUGS = [
  "topspin",
  "canva-clone",
  "zoom-clone",
  "durable-impact-academy",
  "local-notes",
  "ai-powered-resume",
  "figma-clone",
  "online-notes-management",
];
const ROUTES = [
  { name: "home", path: "/", status: 200 },
  { name: "not-found", path: "/no-such-page/", status: 404 },
  ...PROJECT_SLUGS.map((slug) => ({
    name: `project-${slug}`,
    path: `/projects/${slug}/`,
    status: 200,
  })),
];
const SECTIONS = ["hero", "profile", "skills", "projects", "contact"];
const PLANS = {
  // 320 CSS px = 400% zoom of a 1280 layout (WCAG 1.4.10 reflow).
  chromium: { engines: ["chromium"], widths: [320, 375, 768, 1280] },
  cross: { engines: ["firefox", "webkit"], widths: [375, 1280] },
  a11y: { engines: ["chromium"], widths: [375, 1280] },
};

function watch(page, route) {
  const failures = [];
  const documentUrl = `${base}${route.path}`;
  page.on("pageerror", (error) => {
    if (isTurnstileFrameNoise(error.message)) return;
    failures.push(`pageerror: ${error.message}`);
  });
  page.on("console", (entry) => {
    if (entry.type() !== "error") return;
    // The browser logs the intentional not-found document status as an error.
    if (route.status === 404 && entry.text().includes("404")) return;
    if (isTurnstileFrameNoise(entry.text())) return;
    if (isTurnstileInternal(entry.location().url)) return;
    failures.push(`console: ${entry.text()}`);
  });
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText;
    // Chromium reports the router's HEAD existence probe as aborted even
    // though the segment prefetch that depends on it then succeeds.
    if (request.method() === "HEAD" && error === "net::ERR_ABORTED") return;
    if (isTurnstileInternal(request.url())) return;
    failures.push(`requestfailed: ${request.url()} ${error}`);
  });
  page.on("response", (response) => {
    if (isTurnstileInternal(response.url())) return;
    const expected =
      response.url() === documentUrl ? route.status : response.status() < 400;
    if (expected === true || expected === response.status()) return;
    failures.push(`http ${response.status()}: ${response.url()}`);
  });
  return failures;
}

async function scrollThrough(page) {
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  for (let y = 0; y < height; y += 500) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(400);
}

async function inspect(page, route) {
  const facts = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    h1: document.querySelectorAll("h1").length,
    sections: [...document.querySelectorAll("section")].map((s) => s.id),
    csp: window.__cspViolations ?? [],
  }));
  assert.equal(facts.overflow, false, "no horizontal page scroll");
  assert.equal(facts.h1, 1, "exactly one h1");
  if (route.name === "home") assert.deepEqual(facts.sections, SECTIONS);
  assert.deepEqual(facts.csp, [], "no CSP violations");
  return facts;
}

async function axe(page) {
  const { AxeBuilder } = require(
    require.resolve("@axe-core/playwright", { paths: [process.cwd()] }),
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
  }));
  const blocking = summary.filter((v) =>
    ["serious", "critical"].includes(v.impact),
  );
  assert.deepEqual(blocking, [], "no serious/critical axe findings");
  return summary;
}

async function runRoute(browser, engine, width, route) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: mode === "a11y" ? "reduce" : "no-preference",
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
  const failures = watch(page, route);
  try {
    const response = await page.goto(`${base}${route.path}`);
    assert.equal(response.status(), route.status);
    await page
      .locator(".preloader")
      .waitFor({ state: "hidden", timeout: 10_000 });
    await scrollThrough(page);
    const facts = await inspect(page, route);
    const violations = mode === "a11y" ? await axe(page) : undefined;
    assert.deepEqual(failures, []);
    return {
      engine,
      width,
      route: route.path,
      pass: true,
      csp: facts.csp.length,
      violations,
    };
  } catch (error) {
    return {
      engine,
      width,
      route: route.path,
      pass: false,
      error: error.message,
      failures,
    };
  } finally {
    await context.close();
  }
}

// Component-level accessibility checks that a page scan cannot express.
const A11Y_CHECKS = [
  {
    name: "forced colors: open menu close icon stays visible",
    async run(browser) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        forcedColors: "active",
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        await page.goto(`${base}/`);
        await page.locator(".preloader").waitFor({ state: "hidden" });
        await page
          .getByRole("button", { name: "Open navigation", exact: true })
          .click();
        const paint = await page.evaluate(() => ({
          canvas: getComputedStyle(document.body).backgroundColor,
          lines: [...document.querySelectorAll(".menu-toggle span")].map(
            (line) => getComputedStyle(line).backgroundColor,
          ),
        }));
        assert.equal(paint.lines.length, 2);
        for (const line of paint.lines) assert.notEqual(line, paint.canvas);
      } finally {
        await context.close();
      }
    },
  },
  {
    name: "reduced motion: menu opens without stagger and closes immediately",
    async run(browser) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 800 },
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        await page.goto(`${base}/`);
        await page.locator(".preloader").waitFor({ state: "hidden" });
        await page.locator(".menu-toggle").click();
        await page.waitForTimeout(50);
        const links = await page.evaluate(() =>
          [...document.querySelectorAll("#site-menu li")].map((item) => {
            const style = getComputedStyle(item);
            const offset = new DOMMatrixReadOnly(style.transform).m41;
            return `opacity ${style.opacity} offset ${offset}`;
          }),
        );
        assert.deepEqual(links, Array(5).fill("opacity 1 offset 0"));
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);
        const visibility = await page.evaluate(
          () =>
            getComputedStyle(document.querySelector(".menu-layer")).visibility,
        );
        assert.equal(visibility, "hidden");
      } finally {
        await context.close();
      }
    },
  },
  {
    name: "reduced motion: animation library loads only after motion is allowed",
    async run(browser) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        const bodies = [];
        page.on("response", (response) => {
          if (response.request().resourceType() === "script")
            bodies.push(response.text().catch(() => ""));
        });
        const animationScripts = async () =>
          (await Promise.all(bodies)).filter((body) =>
            body.includes("GreenSock"),
          ).length;
        for (const route of ["/", "/projects/topspin/"]) {
          await page.goto(`${base}${route}`);
          await page.locator(".preloader").waitFor({ state: "hidden" });
          await scrollThrough(page);
        }
        assert.equal(
          await animationScripts(),
          0,
          "loaded under reduced motion",
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.waitForTimeout(1500);
        assert.ok(
          (await animationScripts()) > 0,
          "not loaded after motion became allowed",
        );
      } finally {
        await context.close();
      }
    },
  },
  {
    name: "desktop menu: every link, including its arrow, fits the viewport",
    async run(browser) {
      // 901px is the first width with the single-row desktop menu.
      for (const width of [901, 910, 919, 920]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        try {
          const page = await context.newPage();
          await page.goto(`${base}/`);
          await page.locator(".preloader").waitFor({ state: "hidden" });
          await page.locator(".menu-toggle").click();
          const overflow = await page.evaluate(() => {
            const right = Math.max(
              ...[...document.querySelectorAll("#site-menu a")].map(
                (link) => link.getBoundingClientRect().right,
              ),
            );
            return Math.round(right - document.documentElement.clientWidth);
          });
          assert.ok(
            overflow <= 0,
            `menu overflows ${overflow}px at ${width}px`,
          );
        } finally {
          await context.close();
        }
      }
    },
  },
  {
    name: "mobile: header wordmark tap area is at least 44px tall",
    async run(browser) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        await page.goto(`${base}/projects/topspin/`);
        await page.locator(".preloader").waitFor({ state: "hidden" });
        const hitHeight = await page.evaluate(() => {
          const link = document.querySelector("a.wordmark");
          const box = link.getBoundingClientRect();
          const x = box.left + box.width / 2;
          let hits = 0;
          for (let y = Math.max(0, box.top - 20); y < box.bottom + 20; y += 1) {
            const target = document.elementFromPoint(x, y);
            if (target && link.contains(target)) hits += 1;
          }
          return hits;
        });
        assert.ok(hitHeight >= 44, `wordmark tap height ${hitHeight}px`);
      } finally {
        await context.close();
      }
    },
  },
  {
    name: "contact: focused fields and their errors clear the section cue",
    async run(browser) {
      for (const [width, height, reducedMotion] of [
        [1536, 864, "reduce"],
        [1280, 900, "reduce"],
        [375, 812, "reduce"],
        // Normal motion runs the smooth-scroll owner as well.
        [1920, 1080, "no-preference"],
        [1280, 900, "no-preference"],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height },
          reducedMotion,
        });
        try {
          const page = await context.newPage();
          await page.goto(`${base}/#contact`);
          await page.locator(".preloader").waitFor({ state: "hidden" });
          await page.getByRole("button", { name: "Send message" }).click();
          await page.getByText("Enter your name.", { exact: true }).waitFor();
          const overlaps = [];
          for (const id of ["email", "subject", "message"]) {
            await page.keyboard.press("Tab");
            assert.equal(
              await page.evaluate(() => document.activeElement?.id),
              `contact-${id}`,
            );
            await scrollSettled(page);
            overlaps.push(await cueOverlap(page, `contact-${id}`));
          }
          await page.locator(".contact-form button[type=submit]").focus();
          await scrollSettled(page);
          overlaps.push(await cueOverlap(page, null));
          assert.deepEqual(
            overlaps.filter((o) => o.pixels > 0),
            [],
            `cue overlap at ${width}px (${reducedMotion})`,
          );
        } finally {
          await context.close();
        }
      }
    },
  },
];

// Resolves once the page has stopped scrolling for 300ms (smooth scrolling).
function scrollSettled(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = window.scrollY;
        let stableSince = performance.now();
        const tick = (now) => {
          if (window.scrollY !== last) {
            last = window.scrollY;
            stableSince = now;
          }
          if (now - stableSince > 300) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

// Overlap between the fixed section cue and the focused control plus, for
// fields, the error message that describes it.
function cueOverlap(page, fieldId) {
  return page.evaluate((id) => {
    const cue = document.querySelector(".section-cue").getBoundingClientRect();
    const focused = document.activeElement;
    const boxes = [focused.getBoundingClientRect()];
    const errorId = id && focused.getAttribute("aria-describedby");
    if (errorId)
      boxes.push(document.getElementById(errorId).getBoundingClientRect());
    const pixels = boxes.reduce((sum, box) => {
      const w = Math.min(box.right, cue.right) - Math.max(box.left, cue.left);
      const h = Math.min(box.bottom, cue.bottom) - Math.max(box.top, cue.top);
      return sum + Math.max(0, w) * Math.max(0, h);
    }, 0);
    return { target: id ?? "submit", pixels: Math.round(pixels) };
  }, fieldId);
}

async function runChecks(browser, engine) {
  const results = [];
  for (const check of A11Y_CHECKS) {
    try {
      await check.run(browser);
      results.push({ engine, check: check.name, pass: true });
    } catch (error) {
      results.push({
        engine,
        check: check.name,
        pass: false,
        error: error.message,
      });
    }
  }
  return results;
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
        for (const route of ROUTES) {
          const result = await runRoute(browser, engine, width, route);
          console.log(JSON.stringify(result));
          results.push(result);
        }
      }
      if (mode === "a11y") {
        for (const result of await runChecks(browser, engine)) {
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
