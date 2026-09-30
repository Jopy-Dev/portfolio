const PRESS_ANIMATION_ID = "jopy-press-feedback";
const OUTLINE_ANIMATION_ID = "jopy-outline-feedback";

export function highlightOutline(element: HTMLElement | null): void {
  if (!element) return;
  for (const animation of element.getAnimations()) {
    if (animation.id === OUTLINE_ANIMATION_ID) animation.cancel();
  }
  const duration = durationMilliseconds(
    getComputedStyle(element).getPropertyValue("--duration-cue-outline"),
  );
  element.animate(
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.65 },
      { opacity: 0 },
    ],
    { id: OUTLINE_ANIMATION_ID, duration },
  );
}

export function playPressFeedback(element: HTMLElement): void {
  const reduction = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduction.matches) return;
  if (element.matches(":disabled, .is-loading")) return;

  for (const animation of element.getAnimations()) {
    if (animation.id === PRESS_ANIMATION_ID) animation.cancel();
  }

  const tokens = getComputedStyle(element);
  const compression = durationMilliseconds(
    tokens.getPropertyValue("--duration-press"),
  );
  const release = durationMilliseconds(
    tokens.getPropertyValue("--duration-press-release"),
  );
  const duration = compression + release;
  const scale = tokens.getPropertyValue("--press-scale").trim();
  const easing = tokens.getPropertyValue("--ease-editorial").trim();

  const press = element.animate(
    [
      { scale: "1", easing },
      { scale, offset: compression / duration, easing },
      { scale: "1" },
    ],
    { id: PRESS_ANIMATION_ID, duration },
  );
  stopPressOnReduction(press, reduction);
}

function stopPressOnReduction(press: Animation, reduction: MediaQueryList) {
  const handleChange = () => {
    if (reduction.matches) press.cancel();
  };
  const releaseListener = () =>
    reduction.removeEventListener("change", handleChange);
  reduction.addEventListener("change", handleChange);
  press.onfinish = releaseListener;
  press.oncancel = releaseListener;
}

function durationMilliseconds(value: string): number {
  return Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);
}
