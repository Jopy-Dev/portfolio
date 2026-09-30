"use client";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { HomepageSectionId } from "@/content/portfolio";
import {
  navigateToSection,
  usesNativeSectionActivation,
} from "@/lib/section-click-navigation";
import { useViewportNavigation } from "./use-viewport-navigation";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const MENU_EXIT_MS = 700;
export function useHeaderNavigation(homepage: boolean) {
  const { open, menuExiting, menuWordmarkSettling, setMenuOpen } =
    useMenuState();
  const wordmarkRef = useRef<HTMLAnchorElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const { activeSection, wordmarkVisible: pageWordmarkVisible } =
    useViewportNavigation(wordmarkRef);
  const wordmarkVisible = !homepage || open || pageWordmarkVisible;

  const close = useCallback(
    (returnFocus = true) => {
      setMenuOpen(false);
      if (returnFocus) requestAnimationFrame(() => toggleRef.current?.focus());
    },
    [setMenuOpen],
  );

  useEffect(() => {
    const body = document.body;
    const background = [
      document.querySelector<HTMLElement>(".skip-link"),
      document.querySelector<HTMLElement>("main"),
      document.querySelector<HTMLElement>(".site-footer"),
    ].filter((element): element is HTMLElement => element !== null);

    body.classList.toggle("menu-open", open);
    for (const element of background) {
      element.inert = open;
      if (open) element.setAttribute("aria-hidden", "true");
      else element.removeAttribute("aria-hidden");
    }

    if (open)
      requestAnimationFrame(() =>
        panelRef.current?.querySelector<HTMLElement>("a")?.focus(),
      );

    return () => {
      body.classList.remove("menu-open");
      for (const element of background) {
        element.inert = false;
        element.removeAttribute("aria-hidden");
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        wordmarkRef.current,
        toggleRef.current,
        ...Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
            [],
        ),
      ].filter((element): element is HTMLElement => element !== null);
      const currentIndex = focusable.indexOf(
        document.activeElement as HTMLElement,
      );
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusable.length) % focusable.length
        : (currentIndex + 1) % focusable.length;
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!wordmarkVisible && document.activeElement === wordmarkRef.current) {
      toggleRef.current?.focus();
    }
  }, [wordmarkVisible]);

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    targetId: HomepageSectionId,
  ) => {
    if (!homepage) {
      close(false);
      return;
    }
    if (usesNativeSectionActivation(event)) return;
    event.preventDefault();
    close(false);
    requestAnimationFrame(() => navigateToSection(targetId));
  };

  const handleWordmarkNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!open) return;
    handleNavigation(event, "hero");
  };

  return {
    homepage,
    open,
    menuExiting,
    menuWordmarkSettling,
    wordmarkRef,
    toggleRef,
    panelRef,
    activeSection,
    pageWordmarkVisible,
    wordmarkVisible,
    setMenuOpen,
    close,
    handleNavigation,
    handleWordmarkNavigation,
  };
}
export type HeaderState = ReturnType<typeof useHeaderNavigation>;

function useMenuState() {
  const [open, setOpen] = useState(false);
  const [menuExiting, setMenuExiting] = useState(false);
  const [menuWordmarkSettling, setMenuWordmarkSettling] = useState(false);
  const menuWordmarkFrameRef = useRef<number | null>(null);
  const menuExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setMenuOpen = useCallback((nextOpen: boolean) => {
    if (menuWordmarkFrameRef.current) {
      cancelAnimationFrame(menuWordmarkFrameRef.current);
    }
    setMenuWordmarkSettling(true);
    if (menuExitTimerRef.current) clearTimeout(menuExitTimerRef.current);
    if (nextOpen) {
      setMenuExiting(false);
    } else {
      setMenuExiting(true);
      menuExitTimerRef.current = setTimeout(() => {
        setMenuExiting(false);
        menuExitTimerRef.current = null;
      }, MENU_EXIT_MS);
    }
    setOpen(nextOpen);
    menuWordmarkFrameRef.current = requestAnimationFrame(() => {
      menuWordmarkFrameRef.current = requestAnimationFrame(() => {
        setMenuWordmarkSettling(false);
        menuWordmarkFrameRef.current = null;
      });
    });
  }, []);

  useEffect(
    () => () => {
      if (menuWordmarkFrameRef.current) {
        cancelAnimationFrame(menuWordmarkFrameRef.current);
      }
      if (menuExitTimerRef.current) clearTimeout(menuExitTimerRef.current);
    },
    [],
  );

  return { open, menuExiting, menuWordmarkSettling, setMenuOpen };
}
