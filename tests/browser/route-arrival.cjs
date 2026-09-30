const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const playwright = require(process.argv[2]);
const { isReportOnlyNotice, launchOptions } = require("./browser-env.cjs");
const base = "http://127.0.0.1:4173";
const output = process.env.BROWSER_TEST_OUTPUT || "test-results/route-arrival";

async function observeArrival(page, target) {
  await page.evaluate((id) => {
    window.arrivalEvidence = { done: false, frames: [] };
    let releasedAt = 0;
    const sample = (time) => {
      const section = document.getElementById(id);
      const loader = document.querySelector('.preloader[data-mode="reveal"]');
      if (location.pathname === "/" && section && loader) {
        const heading =
          id === "hero" ? section : section.querySelector(".section-heading");
        const panel = loader.querySelector(".preloader__panels span");
        const exposed =
          getComputedStyle(loader).display === "none" ||
          panel.getBoundingClientRect().bottom < innerHeight - 5;
        if (exposed) {
          const content =
            id === "projects"
              ? section.querySelector(".projects__list")
              : heading;
          window.arrivalEvidence.frames.push({
            top: heading.getBoundingClientRect().top,
            opacity: getComputedStyle(content).opacity,
          });
        }
        if (loader.dataset.released === "true") {
          releasedAt ||= time;
          if (time - releasedAt > 120) {
            window.arrivalEvidence.done = true;
            return;
          }
        }
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, target);
}

async function checkArrival(page, target) {
  await page.waitForFunction(() => window.arrivalEvidence.done);
  const frames = await page.evaluate(() => window.arrivalEvidence.frames);
  assert.ok(frames.length > 0, "Arrival must expose destination");
  assert.deepEqual(
    frames.filter((frame) => Math.abs(frame.top) > 2 || frame.opacity !== "1"),
    [],
    `${target} must be aligned/readable throughout reveal`,
  );
  assert.equal(await page.evaluate(() => document.activeElement.id), target);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  return { target, frames: frames.length };
}

async function projectPage(page) {
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .locator("#site-menu")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      Math.abs(
        document
          .querySelector("#projects .section-heading")
          .getBoundingClientRect().top,
      ) < 2,
  );
  await page
    .getByRole("link", { name: "View TopSpin project details" })
    .click();
  await page.waitForURL("**/projects/topspin/");
  await page.locator(".preloader").waitFor({ state: "hidden" });
}

async function runContext(
  browser,
  name,
  width,
  reducedMotion = "no-preference",
) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error" && !isReportOnlyNotice(entry.text()))
      errors.push(entry.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  try {
    await page.goto(`${base}/projects/topspin/`);
    await page.locator(".preloader").waitFor({ state: "hidden" });
    const results = [];
    const actions = [
      ["back", "projects"],
      ["wordmark", "hero"],
      ...["hero", "profile", "skills", "projects", "contact"].map((id) => [
        "menu",
        id,
      ]),
    ];
    const viewportActions = [375, 1280].includes(width)
      ? actions
      : [actions[0], actions[actions.length - 1]];
    for (const [action, target] of viewportActions) {
      console.log(JSON.stringify({ name, width, action, target }));
      if (action === "menu")
        await page
          .getByRole("button", { name: "Open navigation", exact: true })
          .click();
      await observeArrival(page, target);
      if (action === "back")
        await page.getByRole("link", { name: "Back to Projects" }).click();
      else if (action === "wordmark")
        await page.getByRole("link", { name: "Jopy Dev", exact: true }).click();
      else
        await page
          .locator("#site-menu")
          .getByRole("link", {
            name: target[0].toUpperCase() + target.slice(1),
            exact: true,
          })
          .click();
      results.push({ action, ...(await checkArrival(page, target)) });
      await projectPage(page);
    }
    const footer = page.locator(".site-footer__github");
    assert.equal(await footer.getAttribute("target"), "_blank");
    assert.match(await footer.getAttribute("rel"), /noopener/);
    assert.match(await footer.innerText(), /GitHub/);
    await context.route("https://github.com/Jopy-Dev/portfolio", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>External destination fixture</title>",
      }),
    );
    const popupPromise = context.waitForEvent("page");
    await footer.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.equal(popup.url(), "https://github.com/Jopy-Dev/portfolio");
    assert.equal(await popup.evaluate(() => window.opener), null);
    assert.equal(page.url(), `${base}/projects/topspin/`);
    await popup.close();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ name, width, reducedMotion, pass: true }));
    return { name, width, reducedMotion, results, errors };
  } finally {
    await context.close();
  }
}

(async () => {
  await mkdir(output, { recursive: true });
  const results = [];
  for (const name of ["focused", "reduced"].includes(process.argv[3])
    ? ["chromium"]
    : ["chromium", "firefox", "webkit"]) {
    const browser = await playwright[name].launch(launchOptions(name));
    try {
      const widths =
        process.argv[3] === "reduced"
          ? []
          : process.argv[3] === "focused"
            ? [1280]
            : name === "chromium"
              ? [375, 768, 899, 901, 991, 992, 1280, 1536, 1920]
              : [375, 1280];
      for (const width of widths) {
        results.push(await runContext(browser, name, width));
        await writeFile(
          `${output}/${process.argv[3] || "matrix"}-results.json`,
          JSON.stringify(results, null, 2),
        );
      }
      if (process.argv[3] !== "focused")
        results.push(await runContext(browser, name, 375, "reduce"));
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    `${output}/${process.argv[3] || "matrix"}-results.json`,
    JSON.stringify(results, null, 2),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
