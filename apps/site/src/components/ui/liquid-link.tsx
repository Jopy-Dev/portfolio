"use client";

import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  HOMEPAGE_SECTION_ORDER,
  type HomepageSectionId,
} from "@/content/portfolio";
import {
  navigateToSection,
  usesExactHeadingLanding,
} from "@/lib/section-click-navigation";
import { CtaClickReveal } from "./cta-click-reveal";
import { playPressFeedback } from "./press-feedback";

function isModifiedActivation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function usesNativeActivation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.defaultPrevented ||
    isModifiedActivation(event) ||
    Boolean(
      event.currentTarget.target && event.currentTarget.target !== "_self",
    )
  );
}

function getActivationLabel(
  anchor: HTMLAnchorElement,
  label: ReactNode,
  hoverLabel: ReactNode,
): ReactNode {
  const hoverLayer = anchor.querySelector(".liquid-button__label--hover");
  const hoverVisible =
    hoverLayer && Number(getComputedStyle(hoverLayer).opacity) > 0.5;
  return hoverVisible ? hoverLabel : label;
}

function getSectionTarget(href: string): HomepageSectionId | undefined {
  return HOMEPAGE_SECTION_ORDER.find(
    (id) =>
      href === `#${id}` &&
      usesExactHeadingLanding(id) &&
      Boolean(document.getElementById(id)),
  );
}

type LiquidLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
  hoverLabel?: ReactNode;
};

export function LiquidLink({
  children,
  className = "",
  href,
  hoverLabel = children,
  onClick,
  ...props
}: LiquidLinkProps) {
  const [activationSequence, setActivationSequence] = useState<number | null>(
    null,
  );
  const pendingNavigationRef = useRef<HomepageSectionId | null>(null);
  const [activationLabel, setActivationLabel] = useState(children);

  const completeActivation = useCallback(() => {
    setActivationSequence(null);
    const pendingNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (pendingNavigation) navigateToSection(pendingNavigation);
  }, []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (usesNativeActivation(event)) return;
    const targetId = getSectionTarget(href);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (targetId) {
        event.preventDefault();
        navigateToSection(targetId);
      }
      return;
    }
    playPressFeedback(event.currentTarget);

    setActivationLabel(
      getActivationLabel(event.currentTarget, children, hoverLabel),
    );
    setActivationSequence((current) => (current ?? 0) + 1);
    if (!targetId) return;

    event.preventDefault();
    pendingNavigationRef.current = targetId;
  };

  return (
    <a
      className={`liquid-button${activationSequence === null ? "" : " is-activated"} ${className}`.trim()}
      href={href}
      onClick={handleClick}
      {...props}
    >
      <span className="liquid-button__fill" aria-hidden="true" />
      <span className="liquid-button__outline" aria-hidden="true" />
      <span className="liquid-button__label liquid-button__label--rest">
        {children}
      </span>
      <span className="liquid-button__label--hover" aria-hidden="true">
        {hoverLabel}
      </span>
      {activationSequence === null ? null : (
        <CtaClickReveal
          className="liquid-button__click-window"
          key={activationSequence}
          direction="down"
          label={activationLabel}
          onComplete={completeActivation}
        />
      )}
    </a>
  );
}
