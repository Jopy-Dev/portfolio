import assert from "node:assert/strict";
import test from "node:test";
import {
  navigateToSection,
  registerSectionScroller,
  usesNativeSectionActivation,
} from "../../apps/site/src/lib/section-click-navigation.ts";

function withBrowser(run) {
  const original = {
    window: globalThis.window,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    getComputedStyle: globalThis.getComputedStyle,
  };
  const nativeCalls = [];
  let reduced = false;
  const section = {
    getBoundingClientRect: () => ({ top: -1000 }),
    querySelector: () => ({ getBoundingClientRect: () => ({ top: 500 }) }),
    focus() {},
    addEventListener() {},
    removeAttribute() {},
  };
  globalThis.document = { getElementById: () => section };
  globalThis.getComputedStyle = () => ({
    transform: "matrix(1, 0, 0, 1, 0, 56)",
  });
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  globalThis.window = {
    scrollY: 1000,
    location: { hash: "" },
    history: { pushState() {}, replaceState() {} },
    matchMedia: () => ({ matches: reduced }),
    scrollTo: (options) => nativeCalls.push(options),
  };
  try {
    run({
      nativeCalls,
      reduce: () => {
        reduced = true;
      },
    });
  } finally {
    Object.assign(globalThis, original);
  }
}

test("section scrolling keeps the current motion owner when an older owner cleans up", () => {
  withBrowser(({ nativeCalls }) => {
    const first = [];
    const second = [];
    const disposeFirst = registerSectionScroller((top) => first.push(top));
    const disposeSecond = registerSectionScroller((top) => second.push(top));
    try {
      disposeFirst();
      navigateToSection("contact");
      assert.deepEqual(first, []);
      assert.deepEqual(second, [1444]);
      assert.deepEqual(nativeCalls, []);
      disposeSecond();
      navigateToSection("contact");
      assert.deepEqual(nativeCalls, [{ top: 1444, behavior: "smooth" }]);
    } finally {
      disposeFirst();
      disposeSecond();
    }
  });
});

test("reduced-motion section navigation bypasses interpolation immediately", () => {
  withBrowser(({ nativeCalls, reduce }) => {
    const delegated = [];
    const dispose = registerSectionScroller((top) => delegated.push(top));
    try {
      reduce();
      navigateToSection("contact");
      assert.deepEqual(delegated, []);
      assert.deepEqual(nativeCalls, [{ top: 1444, behavior: "auto" }]);
    } finally {
      dispose();
    }
  });
});

test("Hero navigation replaces active scrolling through the current motion owner", () => {
  withBrowser(({ nativeCalls }) => {
    const destinations = [];
    const dispose = registerSectionScroller((top) => destinations.push(top));
    try {
      navigateToSection("hero");
      assert.deepEqual(destinations, [0]);
      assert.deepEqual(nativeCalls, []);
    } finally {
      dispose();
    }
  });
});

test("route restoration synchronizes the motion owner without interpolation", () => {
  withBrowser(({ nativeCalls }) => {
    const calls = [];
    const dispose = registerSectionScroller((top, immediate) =>
      calls.push({ top, immediate }),
    );
    try {
      navigateToSection("projects", true);
      assert.deepEqual(calls, [{ top: 1444, immediate: true }]);
      assert.deepEqual(nativeCalls, []);
    } finally {
      dispose();
    }
  });
});

test("restoring an existing hash preserves router history state", () => {
  withBrowser(() => {
    window.location.hash = "#projects";
    const historyCalls = [];
    window.history.replaceState = (...args) => historyCalls.push(args);
    window.history.pushState = (...args) => historyCalls.push(args);
    navigateToSection("projects", true);
    assert.deepEqual(historyCalls, []);
  });
});

test("Hero return preserves native fallback and immediate reduced-motion landing", () => {
  withBrowser(({ nativeCalls, reduce }) => {
    navigateToSection("hero");
    reduce();
    navigateToSection("hero");
    assert.deepEqual(nativeCalls, [
      { top: 0, behavior: "smooth" },
      { top: 0, behavior: "auto" },
    ]);
  });
});

test("section links leave modified and non-self activations to the browser", () => {
  const event = {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    currentTarget: { target: "" },
  };
  assert.equal(usesNativeSectionActivation(event), false);
  for (const key of [
    "defaultPrevented",
    "metaKey",
    "ctrlKey",
    "shiftKey",
    "altKey",
  ]) {
    assert.equal(usesNativeSectionActivation({ ...event, [key]: true }), true);
  }
  assert.equal(usesNativeSectionActivation({ ...event, button: 1 }), true);
  assert.equal(
    usesNativeSectionActivation({
      ...event,
      currentTarget: { target: "_blank" },
    }),
    true,
  );
  assert.equal(
    usesNativeSectionActivation({
      ...event,
      currentTarget: { target: "_self" },
    }),
    false,
  );
});
