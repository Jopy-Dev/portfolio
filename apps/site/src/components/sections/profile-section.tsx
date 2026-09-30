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
            Full-stack engineer building production-grade web applications,
            secure backend systems, and AI-driven automation.
          </p>
          <p>
            Experienced in developing production-ready applications,
            architecting backend services, implementing secure authentication
            and authorization, designing reusable frontend systems, and
            delivering reliable, cloud-ready solutions. Adept at translating
            complex business requirements into scalable, user-focused software
            while following industry best practices and Agile methodologies.
          </p>
          <nav className="social-links" aria-label="Professional profiles">
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
