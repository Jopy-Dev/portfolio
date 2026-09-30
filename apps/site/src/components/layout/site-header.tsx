"use client";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { HOMEPAGE_NAV_ITEMS } from "@/content/portfolio";
import { SectionNavigator } from "./section-navigator";
import { type HeaderState, useHeaderNavigation } from "./use-header-navigation";
export function SiteHeader({ homepage = true }: { homepage?: boolean }) {
  const state = useHeaderNavigation(homepage);
  return (
    <>
      <HeaderControls {...state} />
      <MenuPanel {...state} />
      {homepage ? (
        <SectionNavigator activeSection={state.activeSection} />
      ) : null}
    </>
  );
}
function HeaderControls(state: HeaderState) {
  const { menuExiting, toggleRef, open, setMenuOpen } = state;
  return (
    <header className="site-header" data-menu-exiting={menuExiting}>
      <HeaderWordmark {...state} />
      <button
        ref={toggleRef}
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setMenuOpen(!open)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}

function MenuPanel({
  open,
  homepage,
  panelRef,
  close: onClose,
  handleNavigation: onNavigate,
}: HeaderState) {
  return (
    <div
      className={`menu-layer${open ? " is-open" : ""}`}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        className="menu-backdrop"
        type="button"
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
        onClick={() => onClose()}
      />
      <nav
        ref={panelRef}
        className="menu-panel"
        id="site-menu"
        aria-label="Primary navigation"
      >
        <ul>
          {HOMEPAGE_NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                href={homepage ? item.href : `/${item.href}`}
                scroll={homepage}
                onClick={(event) => onNavigate(event, item.id)}
              >
                <span>{item.label}</span>
                <ArrowUpRightIcon />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function HeaderWordmark({
  wordmarkRef,
  homepage,
  wordmarkVisible,
  pageWordmarkVisible,
  open,
  menuWordmarkSettling,
  handleWordmarkNavigation,
}: HeaderState) {
  return (
    <Link
      ref={wordmarkRef}
      className="wordmark"
      href={homepage ? "#hero" : "/#hero"}
      scroll={homepage}
      aria-label="Jopy Dev"
      data-wordmark-visible={wordmarkVisible}
      data-page-wordmark-visible={pageWordmarkVisible}
      data-menu-open={open}
      data-menu-settling={menuWordmarkSettling}
      inert={!wordmarkVisible}
      tabIndex={wordmarkVisible ? undefined : -1}
      onClick={handleWordmarkNavigation}
    >
      <span className="wordmark__punctuation" aria-hidden="true">
        &lt;
      </span>
      <span className="wordmark__name">Jopy Dev</span>
      <span className="wordmark__punctuation" aria-hidden="true">
        /&gt;
      </span>
    </Link>
  );
}
