"use client";

import { useEffect, useRef, useState } from "react";
import { BubbleCursorTrail } from "@/components/motion/bubble-cursor-trail";
import { CursorColorDisc } from "./cursor-color-disc";
import { trackPointer } from "./cursor-tracker";

export function ViewportEffects() {
  const decorativeMotionEnabled = useDecorativeMotionEnabled();

  return (
    <>
      <DecorativeCursor enabled={decorativeMotionEnabled} />
      <ScrollProgressRail />
    </>
  );
}

function DecorativeCursor({ enabled }: { enabled: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorPositionRef = useRef({ x: -40, y: -40 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !enabled) return;
    return trackPointer(cursor, cursorPositionRef.current);
  }, [enabled]);

  return (
    <>
      <BubbleCursorTrail
        cursorPositionRef={cursorPositionRef}
        enabled={enabled}
      />
      <CursorColorDisc cursorRef={cursorRef} />
    </>
  );
}

function useDecorativeMotionEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pageActive = !document.hidden;
    const sync = () =>
      setEnabled(pageActive && finePointer.matches && !reducedMotion.matches);
    const handleVisibilityChange = () => {
      pageActive = !document.hidden;
      sync();
    };
    const handlePageHide = () => {
      pageActive = false;
      sync();
    };
    const handlePageShow = () => {
      pageActive = true;
      sync();
    };

    finePointer.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    sync();

    return () => {
      finePointer.removeEventListener("change", sync);
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return enabled;
}

function ScrollProgressRail() {
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollable))
          : 0;
      fill.style.transform = `translateY(-${(1 - progress) * 100}%)`;
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <div className="scroll-rail" aria-hidden="true">
      <span ref={fillRef} className="scroll-rail__fill" />
    </div>
  );
}
