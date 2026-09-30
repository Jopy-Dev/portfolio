"use client";

import { type ReactNode, useEffect } from "react";

type CtaClickRevealProps = {
  className: string;
  direction: "down" | "up";
  label: ReactNode;
  onComplete: () => void;
};

export function CtaClickReveal({
  className,
  direction,
  label,
  onComplete,
}: CtaClickRevealProps) {
  useEffect(() => {
    const fallback = window.setTimeout(onComplete, 650);
    const reduction = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finishOnReduction = () => {
      if (reduction.matches) onComplete();
    };
    reduction.addEventListener("change", finishOnReduction);
    finishOnReduction();
    return () => {
      window.clearTimeout(fallback);
      reduction.removeEventListener("change", finishOnReduction);
    };
  }, [onComplete]);

  return (
    <span
      className={`cta-click-reveal ${className}`}
      data-direction={direction}
      aria-hidden="true"
    >
      <span className="cta-click-reveal__word">{label}</span>
      <span
        className="cta-click-reveal__incoming"
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) onComplete();
        }}
      >
        <span className="cta-click-reveal__fill" />
        <svg
          className="cta-click-reveal__chevrons"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
          aria-hidden="true"
        >
          <path d="m6 5 6 6 6-6" />
          <path d="m6 13 6 6 6-6" />
        </svg>
      </span>
    </span>
  );
}
