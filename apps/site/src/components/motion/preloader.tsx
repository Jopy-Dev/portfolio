"use client";

import { useEffect, useRef } from "react";
import {
  PAGE_ARRIVAL_READY_EVENT,
  PRELOADER_RELEASED_EVENT,
} from "@/components/motion/motion-events";

const PRELOADER_NAME = "JOPY DEV";
const PRELOADER_CHARACTERS = Array.from(PRELOADER_NAME, (character, index) => ({
  id: `preloader-character-${index}-${character.codePointAt(0)}`,
  character,
}));
const PANELS = [
  "panel-1",
  "panel-2",
  "panel-3",
  "panel-4",
  "panel-5",
  "panel-6",
  "panel-7",
  "panel-8",
  "panel-9",
  "panel-10",
] as const;
const PRELOADER_MOTION = {
  enterDurationSeconds: 0.2,
  enterStaggerSeconds: 0.05,
  holdSeconds: 1,
  panelDurationSeconds: 0.5,
  panelStaggerSeconds: 0.1,
  fadeDurationSeconds: 0.5,
  travelPercent: 100,
} as const;

export function Preloader({ mode = "full" }: { mode?: "full" | "reveal" }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const release = () => {
      if (root.dataset.released === "true") return;
      root.dataset.released = "true";
      root.style.visibility = "hidden";
      root.style.pointerEvents = "none";
      window.dispatchEvent(new Event(PRELOADER_RELEASED_EVENT));
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) release();
    };
    window.addEventListener("pageshow", handlePageShow);
    if (reduceMotion) {
      release();
      return () => window.removeEventListener("pageshow", handlePageShow);
    }

    let cancelled = false;
    let context: { revert: () => void } | undefined;
    const animate = () => {
      const destination = document.querySelector(
        "main[data-section-order-contract]",
      );
      if (
        mode === "reveal" &&
        destination &&
        destination.getAttribute("data-arrival-ready") !== "true"
      )
        return;
      window.removeEventListener(PAGE_ARRIVAL_READY_EVENT, animate);
      void import("gsap").then(({ gsap }) => {
        if (cancelled || root.dataset.released === "true") return;
        context = gsap.context(() => {
          const characters = root.querySelectorAll(".preloader__character");
          const panels = root.querySelectorAll(".preloader__panels span");
          if (mode === "reveal") {
            gsap.to(panels, {
              yPercent: -100,
              duration: PRELOADER_MOTION.panelDurationSeconds,
              stagger: PRELOADER_MOTION.panelStaggerSeconds,
              ease: "power1.inOut",
              onComplete: release,
            });
            return;
          }
          gsap
            .timeline({
              defaults: { ease: "power1.inOut" },
              onComplete: release,
            })
            .fromTo(
              characters,
              { y: 0, yPercent: PRELOADER_MOTION.travelPercent },
              {
                yPercent: 0,
                duration: PRELOADER_MOTION.enterDurationSeconds,
                stagger: PRELOADER_MOTION.enterStaggerSeconds,
              },
            )
            .to(
              panels,
              {
                yPercent: -100,
                duration: PRELOADER_MOTION.panelDurationSeconds,
                stagger: PRELOADER_MOTION.panelStaggerSeconds,
              },
              `+=${PRELOADER_MOTION.holdSeconds}`,
            )
            .to(
              characters,
              { opacity: 0, duration: PRELOADER_MOTION.fadeDurationSeconds },
              "<0.5",
            )
            .to(
              root,
              { autoAlpha: 0, duration: PRELOADER_MOTION.fadeDurationSeconds },
              "<1",
            );
        }, root);
      });
    };
    window.addEventListener(PAGE_ARRIVAL_READY_EVENT, animate);
    animate();

    return () => {
      cancelled = true;
      window.removeEventListener(PAGE_ARRIVAL_READY_EVENT, animate);
      context?.revert();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [mode]);

  return (
    <div
      ref={rootRef}
      className="preloader"
      data-mode={mode}
      role="status"
      aria-live="polite"
      aria-label={mode === "full" ? "Loading Jopy Dev" : "Opening page"}
    >
      {mode === "full" ? (
        <div className="preloader__name" aria-hidden="true">
          {PRELOADER_CHARACTERS.map((item) => (
            <span className="preloader__character" key={item.id}>
              {item.character === " " ? "\u00a0" : item.character}
            </span>
          ))}
        </div>
      ) : null}
      <div className="preloader__panels" aria-hidden="true">
        {PANELS.map((panel) => (
          <span key={panel} />
        ))}
      </div>
    </div>
  );
}
