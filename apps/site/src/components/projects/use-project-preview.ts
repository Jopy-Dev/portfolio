"use client";

import { type RefObject, useEffect } from "react";
import { whenMotionAllowed } from "@/lib/motion-preference";

export function useProjectPreview(
  listRef: RefObject<HTMLDivElement | null>,
  previewRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    const stopWaiting = whenMotionAllowed(
      () =>
        void import("gsap").then(({ gsap }) => {
          const list = listRef.current;
          const preview = previewRef.current;
          if (cancelled || !list || !preview) return;
          const media = gsap.matchMedia();
          media.add(
            "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
            () => {
              const move = (event: MouseEvent) => {
                const bounds = list.getBoundingClientRect();
                const outside =
                  event.clientX < bounds.left ||
                  event.clientX > bounds.right ||
                  event.clientY < bounds.top ||
                  event.clientY > bounds.bottom;
                gsap.to(
                  preview,
                  outside
                    ? { opacity: 0, duration: 0.3, overwrite: "auto" }
                    : {
                        y:
                          event.clientY -
                          bounds.top -
                          preview.getBoundingClientRect().height / 2,
                        opacity: 1,
                        duration: 1,
                        ease: "power1.out",
                        overwrite: "auto",
                      },
                );
              };
              const focus = (event: FocusEvent) => {
                if (!(event.target instanceof HTMLElement)) return;
                const row = event.target.closest<HTMLElement>(".project-row");
                if (!row) return;
                const bounds = row.getBoundingClientRect();
                gsap.to(preview, {
                  y:
                    bounds.top +
                    bounds.height / 2 -
                    list.getBoundingClientRect().top -
                    preview.getBoundingClientRect().height / 2,
                  opacity: 1,
                  duration: 1,
                  ease: "power1.out",
                  overwrite: "auto",
                });
              };
              const blur = () =>
                gsap.to(preview, {
                  opacity: 0,
                  duration: 0.3,
                  overwrite: "auto",
                });
              window.addEventListener("mousemove", move);
              list.addEventListener("focusin", focus);
              list.addEventListener("focusout", blur);
              return () => {
                window.removeEventListener("mousemove", move);
                list.removeEventListener("focusin", focus);
                list.removeEventListener("focusout", blur);
                gsap.killTweensOf(preview);
                gsap.set(preview, { clearProps: "transform,opacity" });
              };
            },
          );
          dispose = () => media.revert();
        }),
    );
    return () => {
      cancelled = true;
      stopWaiting();
      dispose();
    };
  }, [listRef, previewRef]);
}
