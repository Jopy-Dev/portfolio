const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const playwright = require(process.argv[2]);
const { launchOptions } = require("./browser-env.cjs");
const base = "http://127.0.0.1:4173";
const output = process.env.BROWSER_TEST_OUTPUT || "test-results/font-fallback";
const PHONE = { width: 412, height: 823 };
const WEB_FONT = /\.(?:woff2?|otf|ttf)(?:\?|$)/;
const FONT_DELAY_MS = 1500;
const MAX_LAYOUT_SHIFT = 0.1;

// Before the display font arrives, text renders in a fallback face. If that
// face is wider than the display font, nowrap headings overflow a phone
// screen: mobile browsers then widen the layout viewport and snap it back
// when the real font lands, shifting every full-width layer.
async function phonePage(browser, fonts) {
  const context = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  if (fonts === "blocked") await page.route(WEB_FONT, (route) => route.abort());
  if (fonts === "late")
    await page.route(WEB_FONT, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, FONT_DELAY_MS));
      await route.continue();
    });
  await page.addInitScript(() => {
    window.layoutShiftTotal = 0;
    if (!PerformanceObserver.supportedEntryTypes?.includes("layout-shift"))
      return;
    // Under mobile emulation Chromium marks this viewport snap-back as
    // `hadRecentInput`, yet Lighthouse still scores it, so count every shift.
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.layoutShiftTotal += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  return { context, page };
}

async function fallbackFitsPhone(browser, name) {
  const { context, page } = await phonePage(browser, "blocked");
  try {
    await page.goto(`${base}/`, { waitUntil: "load" });
    const layout = await page.evaluate(() => ({
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.deepEqual(
      layout,
      { innerWidth: PHONE.width, scrollWidth: PHONE.width },
      `${name}: fallback text must not widen the phone layout`,
    );
    return layout;
  } finally {
    await context.close();
  }
}

async function lateFontStaysStable(browser, name) {
  const { context, page } = await phonePage(browser, "late");
  try {
    await page.goto(`${base}/`, { waitUntil: "load" });
    // `load` and `document.fonts.ready` can settle before a late font starts.
    await page.waitForFunction(() =>
      [...document.fonts].some(
        (face) => face.family.includes("Anton") && face.status === "loaded",
      ),
    );
    await page.waitForTimeout(500);
    const shift = await page.evaluate(() => window.layoutShiftTotal);
    assert.ok(
      shift < MAX_LAYOUT_SHIFT,
      `${name}: font swap layout shift ${shift.toFixed(4)} must stay below ${MAX_LAYOUT_SHIFT}`,
    );
    return { shift: +shift.toFixed(4) };
  } finally {
    await context.close();
  }
}

(async () => {
  await mkdir(output, { recursive: true });
  const results = [];
  const failures = [];
  const run = async (check, browser, name) => {
    try {
      results.push({
        name,
        check: check.name,
        ...(await check(browser, name)),
      });
    } catch (error) {
      failures.push(error);
      results.push({ name, check: check.name, error: error.message });
    }
  };
  for (const name of ["chromium", "webkit"]) {
    const browser = await playwright[name].launch(launchOptions(name));
    try {
      await run(fallbackFitsPhone, browser, name);
      // Only Chromium reports layout-shift entries.
      if (name === "chromium") await run(lateFontStaysStable, browser, name);
    } finally {
      await browser.close();
    }
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  if (failures.length > 0) throw failures[0];
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
