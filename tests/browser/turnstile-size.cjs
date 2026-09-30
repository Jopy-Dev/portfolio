const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const playwright = require(process.argv[2]);
const { launchOptions } = require("./browser-env.cjs");
const base = process.env.BROWSER_TEST_BASE || "http://127.0.0.1:4173";
const output = process.env.BROWSER_TEST_OUTPUT || "test-results/turnstile-size";
// Cloudflare's standard ("normal") widget is a fixed 300 x 65 px frame.
const WIDGET = { width: 300, height: 65 };
const WIDTHS = [320, 412, 768, 1280, 1920];

async function measure(browser, name, width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
  });
  const page = await context.newPage();
  try {
    await page.goto(`${base}/#contact`);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    const ready = page.locator('.turnstile-shell[data-state="ready"]');
    await ready.waitFor({ timeout: 20_000 });
    const widget = ready.locator(".turnstile-shell__widget > *").first();
    await widget.waitFor({ timeout: 20_000 });
    const box = (locator) =>
      locator.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
    const result = {
      name,
      width,
      widget: await box(widget),
      shell: await box(ready),
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    };
    assert.deepEqual(result.widget, WIDGET, `${name} ${width}px widget size`);
    assert.equal(
      result.shell.width,
      WIDGET.width,
      `${name} ${width}px shell must match the widget width`,
    );
    assert.equal(result.overflow, false, `${name} ${width}px page overflow`);
    return result;
  } finally {
    await context.close();
  }
}

(async () => {
  await mkdir(output, { recursive: true });
  const results = [];
  const failures = [];
  const engines =
    process.argv[3] === "cross"
      ? ["chromium", "firefox", "webkit"]
      : ["chromium"];
  for (const name of engines) {
    const browser = await playwright[name].launch(launchOptions(name));
    try {
      for (const width of WIDTHS) {
        try {
          results.push(await measure(browser, name, width));
        } catch (error) {
          failures.push(error);
          results.push({ name, width, error: error.message });
        }
      }
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
