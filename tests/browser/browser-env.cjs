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

// WebKit reports these at error level while the policy ships report-only;
// they disappear once the header is enforced.
const REPORT_ONLY_NOTICES = [
  "is ignored when delivered in a report-only policy",
  "was delivered in report-only mode, but does not specify a 'report-to'",
];

function isReportOnlyNotice(text) {
  return REPORT_ONLY_NOTICES.some((notice) => text.includes(notice));
}

// WebKit fails a blob resource inside Turnstile's own challenge frame even on
// a bare page without this site's headers; the widget still issues a token.
function isTurnstileInternal(url) {
  return url.startsWith("blob:https://challenges.cloudflare.com/");
}

module.exports = { isReportOnlyNotice, isTurnstileInternal, launchOptions };
