import { HeroArrow } from "@/components/motion/hero-arrow";
import { LiquidLink } from "@/components/ui/liquid-link";
import { HERO_PROOF, HERO_STATUS } from "@/content/portfolio";

export function HeroSection() {
  return (
    <section className="hero section" id="hero" aria-labelledby="hero-title">
      <HeroArrow />
      <div className="hero__content">
        <h1 className="hero__title" id="hero-title">
          <span>Full-stack</span>
          <span>Engineer</span>
        </h1>
        <HeroIdentity />
        <HeroAction />
      </div>
      <HeroProof />
    </section>
  );
}

function HeroIdentity() {
  return (
    <div className="hero__identity">
      <strong>Mark Jommer</strong>
      <span>TypeScript · React / Next.js · Node.js · PostgreSQL</span>
      <span className="hero__tagline">
        <span>I build and ship web apps end to end — database,</span>{" "}
        <span>auth, API, and the UI people actually use.</span>
      </span>
      <span>Based in Metro Manila, PH (GMT+8)</span>
    </div>
  );
}

function HeroAction() {
  return (
    <div className="hero__action">
      <p className="availability">
        <span aria-hidden="true" />
        <span className="availability__text">
          {HERO_STATUS.map((status) => (
            <span key={status}>{status}</span>
          ))}
        </span>
      </p>
      <LiquidLink href="#contact" hoverLabel="Contact me">
        Contact
      </LiquidLink>
    </div>
  );
}

function HeroProof() {
  return (
    <dl className="hero__proof" aria-label="Career highlights">
      {HERO_PROOF.map((item) => (
        <div key={item.label}>
          <dt>{item.value}</dt>
          <dd>{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}
