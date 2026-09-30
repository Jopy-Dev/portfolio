import { ArrowUpRightIcon } from "@/components/ui/icons";

export function SiteFooter() {
  return (
    <footer className="site-footer content-shell" id="site-footer">
      <div className="site-footer__identity">
        <strong>Jopy-Dev</strong>
        <span>Full-stack engineer</span>
      </div>
      <div className="site-footer__credit">
        <FooterRepositoryLink />
        <span>Design &amp; built by Mark Jommer</span>
      </div>
    </footer>
  );
}

function FooterRepositoryLink() {
  return (
    <a
      className="site-footer__github"
      href="https://github.com/Jopy-Dev/portfolio"
      target="_blank"
      rel="noopener noreferrer"
    >
      GitHub
      <ArrowUpRightIcon />
      <span className="sr-only">opens in a new tab</span>
    </a>
  );
}
