// Shared launch options and known-benign console notices for browser tests.

// Firefox: Playwright loses the page when a Cross-Origin-Opener-Policy
// response replaces the browsing context (microsoft/playwright#42731, fixed
// after 1.63). Remove this pref once playwright-core >= 1.64 is pinned; COOP
// itself stays covered by Chromium, WebKit, and the header contract tests.
const FIREFOX_PREFS = {
  "browser.tabs.remote.useCrossOriginOpenerPolicy": false,
};

function launchOptions(engine) {
  if (engine === "chromium")
    return { headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" };
  if (engine === "firefox")
    return { headless: true, firefoxUserPrefs: FIREFOX_PREFS };
  return { headless: true };
}

const TURNSTILE_HOST = "challenges.cloudflare.com";

// Turnstile's own challenge frame loads, probes, and fails subresources on the
// Cloudflare host (e.g. a 401 token probe, blob URLs, unreachable mirrors) while
// the widget still issues a token. None of it is this site's traffic.
function isTurnstileInternal(url) {
  try {
    const { host, protocol, pathname } = new URL(url);
    const target = protocol === "blob:" ? new URL(pathname).host : host;
    return target === TURNSTILE_HOST || target.endsWith(`.${TURNSTILE_HOST}`);
  } catch {
    return false;
  }
}

// Messages raised inside the challenge frame that browsers report without a
// source URL: WebKit's cross-origin frame guard and Firefox rejecting a font
// the widget requests. Anything else still fails the run.
const TURNSTILE_FRAME_NOISE = [
  // WebKit may report only the tail of this SecurityError message.
  /challenges\.cloudflare\.com" from accessing a frame with origin/,
  /downloadable font: .*font-family: "Cambria Math"/,
];

function isTurnstileFrameNoise(text) {
  return TURNSTILE_FRAME_NOISE.some((pattern) => pattern.test(text));
}

module.exports = { isTurnstileFrameNoise, isTurnstileInternal, launchOptions };
