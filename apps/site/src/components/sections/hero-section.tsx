import { HeroArrow } from "@/components/motion/hero-arrow";
import { LiquidLink } from "@/components/ui/liquid-link";
import { HERO_PROOF } from "@/content/portfolio";

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
      <span>AI Automation Engineer</span>
      <span>Passionate about AI-Assisted Development,</span>
      <span>leveraging AI-powered tools and large language models (LLMs)</span>
    </div>
  );
}

function HeroAction() {
  return (
    <div className="hero__action">
      <LiquidLink href="#contact" hoverLabel="Contact me">
        Contact
      </LiquidLink>
      <p className="availability">
        <span aria-hidden="true" />
        Available for full-time opportunities
      </p>
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
