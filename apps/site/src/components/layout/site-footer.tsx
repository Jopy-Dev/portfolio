import { ArrowUpRightIcon } from "@/components/ui/icons";

export function SiteFooter() {
  return (
    <footer className="site-footer content-shell" id="site-footer">
      <div className="site-footer__identity">
        <FooterExternalLink
          className="site-footer__home"
          href="https://jopy.dev"
        >
          Jopy-Dev
        </FooterExternalLink>
        <span>Full-stack developer</span>
      </div>
      <div className="site-footer__credit">
        <FooterExternalLink
          className="site-footer__github"
          href="https://github.com/Jopy-Dev/portfolio"
        >
          GitHub
        </FooterExternalLink>
        <span>Design &amp; built by Mark Jommer</span>
      </div>
    </footer>
  );
}

function FooterExternalLink({
  className,
  href,
  children,
}: {
  className: string;
  href: string;
  children: string;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRightIcon />
      <span className="sr-only">opens in a new tab</span>
    </a>
  );
}
