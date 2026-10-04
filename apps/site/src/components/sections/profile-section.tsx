import Image from "next/image";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { EXPERIENCE } from "@/content/portfolio";

export function ProfileSection() {
  return (
    <section
      className="profile section content-shell"
      id="profile"
      aria-labelledby="profile-title"
    >
      <SectionHeader id="profile-title">Profile</SectionHeader>
      <div className="profile__grid">
        <div className="profile__copy">
          <p className="profile__statement">
            Full-stack engineer who ships TypeScript web apps to production —
            and keeps them secure.
          </p>
          <p>
            I've been building software professionally for 7+ years, including
            6+ years focused on web development with TypeScript, React, Next.js,
            and Node.js. I've built and shipped production applications end to
            end, from database design and APIs to authentication, authorization,
            and the frontend users interact with.
          </p>
          <p>
            Recent work includes TopSpin, a competitive tennis platform with
            Glicko-2 rankings, verified match results, and moderated
            tournaments, and a bilingual (EN/FR) training platform for Durable
            Impact Academy.
          </p>
          <p>
            I care about the parts users never see: role-based access control,
            authentication, input validation, and deploys that don't break. I
            build with maintainability and production reliability in mind rather
            than treating the framework as the product.
          </p>
          <p>
            Today I build AI automation at Randstad Digital. I use AI coding
            tools daily, with tests and code review as the guardrail, not the
            replacement.
          </p>
          <p>
            <span className="profile__label">Looking for:</span> A mid-level
            full-stack role on a product team shipping TypeScript.
          </p>
          <nav className="social-links" aria-label="Professional profiles">
            <ExternalProfile href="https://jopy.dev">Website</ExternalProfile>
            <ExternalProfile href="https://github.com/Jopy-Dev">
              GitHub
            </ExternalProfile>
            <ExternalProfile href="https://www.linkedin.com/in/markjommer">
              LinkedIn
            </ExternalProfile>
          </nav>
        </div>
        <figure className="profile__visual">
          <span className="profile__plate" aria-hidden="true" />
          <Image
            src="/assets/profile/profile-vector.svg"
            alt=""
            fill
            loading="eager"
            sizes="(max-width: 900px) 100vw, 50vw"
            className="profile__image"
          />
        </figure>

        {/* biome-ignore lint/a11y/useSemanticElements: fieldset is reserved for form controls; this labels a content group */}
        <div
          className="experience"
          role="group"
          aria-labelledby="experience-title"
        >
          <h3 id="experience-title">Experience</h3>
          {EXPERIENCE.map((item) => (
            <article className="experience__item" key={item.role}>
              <div>
                <span>{item.period}</span>
                <span>{item.location}</span>
              </div>
              <div>
                <h4>{item.role}</h4>
                <p className="experience__org">{item.organization}</p>
                <p>{item.summary}</p>
                <p className="experience__tech">{item.technologies}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExternalProfile({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRightIcon />
      <span className="sr-only">opens in a new tab</span>
    </a>
  );
}
