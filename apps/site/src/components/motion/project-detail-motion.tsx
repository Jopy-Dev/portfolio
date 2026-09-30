"use client";

import { useEffect, useLayoutEffect } from "react";
import { whenMotionAllowed } from "@/lib/motion-preference";
import { scrollToPageTop } from "@/lib/section-click-navigation";

export function ProjectDetailMotion() {
  useLayoutEffect(() => {
    scrollToPageTop();
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) scrollToPageTop();
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    const stopWaiting = whenMotionAllowed(
      () =>
        void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
          ([{ gsap }, { ScrollTrigger }]) => {
            if (cancelled) return;
            gsap.registerPlugin(ScrollTrigger);
            const media = gsap.matchMedia();
            media.add("(prefers-reduced-motion: no-preference)", () => {
              const context = gsap.context(() => {
                gsap.from("[data-project-reveal]", {
                  y: 30,
                  opacity: 0,
                  duration: 0.55,
                  stagger: { amount: 0.65 },
                  ease: "power3.out",
                  delay: 0.15,
                });
                const images = gsap.utils.toArray<HTMLImageElement>(
                  ".project-detail__gallery img",
                );
                for (const [index, image] of images.entries()) {
                  gsap.fromTo(
                    image,
                    { objectPosition: "center 50%" },
                    {
                      objectPosition: "center 0%",
                      ease: "none",
                      scrollTrigger: {
                        trigger: image.parentElement,
                        start: index === 0 ? "top 50%" : "top bottom",
                        end: "bottom top",
                        scrub: true,
                        invalidateOnRefresh: true,
                      },
                    },
                  );
                }
              }, document.body);
              return () => context.revert();
            });
            media.add(
              "(min-width: 992px) and (prefers-reduced-motion: no-preference)",
              () => {
                const info = document.querySelector<HTMLElement>(
                  ".project-detail__info",
                );
                if (!info) return;
                const context = gsap.context(() => {
                  gsap.to(info, {
                    filter: "blur(3px)",
                    opacity: 0,
                    scale: 0.9,
                    scrollTrigger: {
                      trigger: info,
                      start: "bottom bottom",
                      end: "bottom top",
                      pin: true,
                      pinSpacing: false,
                      scrub: 0.5,
                      invalidateOnRefresh: true,
                    },
                  });
                }, info);
                return () => context.revert();
              },
            );
            dispose = () => media.revert();
          },
        ),
    );
    return () => {
      cancelled = true;
      stopWaiting();
      dispose();
    };
  }, []);

  return null;
}
