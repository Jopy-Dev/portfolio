"use client";

import { useEffect, useRef } from "react";
import { whenMotionAllowed } from "@/lib/motion-preference";

export function HeroArrow() {
  const arrowRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const arrow = arrowRef.current;
    if (!arrow) return;
    let cancelled = false;
    let dispose = () => {};

    const stopWaiting = whenMotionAllowed(
      () =>
        void import("gsap").then(({ gsap }) => {
          if (cancelled) return;
          const media = gsap.matchMedia();
          media.add("(prefers-reduced-motion: no-preference)", () => {
            const paths = Array.from(arrow.querySelectorAll("path"));
            let timeline: ReturnType<typeof gsap.timeline> | undefined;
            const context = gsap.context(() => {
              gsap.set(arrow, { autoAlpha: 0, fillOpacity: 0, y: 0 });
              for (const path of paths) {
                const length = path.getTotalLength();
                gsap.set(path, {
                  strokeDasharray: length,
                  strokeDashoffset: length,
                });
              }

              timeline = gsap.timeline({ repeat: -1 });
              timeline
                .to(arrow, { autoAlpha: 1, duration: 0.1 })
                .to(paths, {
                  delay: 1,
                  duration: 2,
                  strokeDashoffset: 0,
                })
                .to(arrow, {
                  delay: 0.5,
                  duration: 0.5,
                  fillOpacity: 0.03,
                })
                .to(arrow, { duration: 1, y: 300 })
                .set(arrow, { autoAlpha: 0, fillOpacity: 0, y: 0 });
            }, arrow);
            const syncVisibility = () => timeline?.paused(document.hidden);
            document.addEventListener("visibilitychange", syncVisibility);
            return () => {
              document.removeEventListener("visibilitychange", syncVisibility);
              context.revert();
            };
          });
          dispose = () => media.revert();
        }),
    );

    return () => {
      cancelled = true;
      stopWaiting();
      dispose();
    };
  }, []);

  return (
    <div className="hero-arrow-shell" aria-hidden="true">
      <svg
        ref={arrowRef}
        className="hero-arrow"
        viewBox="0 0 376 111"
        fill="currentColor"
      >
        <title>Decorative downward arrow</title>
        <path d="M1 1V39.9286L188 110V70.6822L1 1Z" />
        <path d="M375 1V39.9286L188 110V70.6822L375 1Z" />
      </svg>
    </div>
  );
}
