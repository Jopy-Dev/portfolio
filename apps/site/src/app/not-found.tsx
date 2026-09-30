import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { LiquidLink } from "@/components/ui/liquid-link";

export const metadata: Metadata = {
  title: "Page not found | Jopy Dev",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <NotFoundHeader />
      <NotFoundContent />
      <SiteFooter />
    </>
  );
}

function NotFoundHeader() {
  return (
    <header className="not-found__header">
      <a className="wordmark" href="/" aria-label="Jopy Dev home">
        <span className="wordmark__punctuation" aria-hidden="true">
          &lt;
        </span>
        <span className="wordmark__name">Jopy Dev</span>
        <span className="wordmark__punctuation" aria-hidden="true">
          /&gt;
        </span>
      </a>
    </header>
  );
}

function NotFoundContent() {
  return (
    <main className="not-found">
      <p className="not-found__code">404</p>
      <h1>Page not found</h1>
      <p>
        The page you requested is unavailable. Return home or continue to
        Contact.
      </p>
      <RecoveryActions />
    </main>
  );
}

function RecoveryActions() {
  return (
    <div className="not-found__actions">
      <LiquidLink href="/">Home</LiquidLink>
      <LiquidLink href="/#contact">Contact</LiquidLink>
    </div>
  );
}
