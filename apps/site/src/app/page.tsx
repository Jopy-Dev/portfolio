import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ParticleBackground } from "@/components/motion/particle-background";
import { SectionScrollMotion } from "@/components/motion/section-scroll-motion";
import { ViewportEffects } from "@/components/motion/viewport-effects";
import { ContactSection } from "@/components/sections/contact-section";
import { HeroSection } from "@/components/sections/hero-section";
import { ProfileSection } from "@/components/sections/profile-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { HOMEPAGE_SECTION_ORDER } from "@/content/portfolio";
import { SITE_ORIGIN } from "@/lib/site";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mark Jommer",
  url: SITE_ORIGIN,
  jobTitle: "Full-stack Developer",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Metro Manila",
    addressCountry: "PH",
  },
  sameAs: [
    "https://github.com/Jopy-Dev",
    "https://www.linkedin.com/in/markjommer",
  ],
};

const safeJsonLd = JSON.stringify(personJsonLd).replaceAll("<", "\\u003c");

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <ParticleBackground />
      <ViewportEffects />
      <SectionScrollMotion />
      <SiteHeader />
      <main
        id="main-content"
        data-section-order-contract={HOMEPAGE_SECTION_ORDER.join(",")}
      >
        <HeroSection />
        <ProfileSection />
        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <PortfolioStructuredData />
    </>
  );
}

function PortfolioStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd }}
    />
  );
}
