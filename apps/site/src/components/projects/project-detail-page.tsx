import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import type { FeaturedProject } from "@/content/portfolio";
import { ProjectGallery } from "./project-gallery";

type ProjectDetailPageProps = {
  project: FeaturedProject;
};

export function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  return (
    <article className="project-detail content-shell" data-project-detail>
      <Link
        className="project-detail__back"
        href="/#projects"
        scroll={false}
        data-project-reveal
      >
        <span aria-hidden="true">←</span>
        Back to Projects
      </Link>

      <div className="project-detail__info">
        <header className="project-detail__header" data-project-reveal>
          <h1>{project.title}</h1>
          <div className="project-detail__links">
            {project.liveUrl ? (
              <ProjectExternalLink
                href={project.liveUrl}
                label="View live project"
              />
            ) : null}
            {project.sourceUrl ? (
              <ProjectExternalLink
                href={project.sourceUrl}
                label="View source code"
              />
            ) : null}
          </div>
        </header>

        <dl className="project-detail__facts">
          <div data-project-reveal>
            <dt>Tech Stack</dt>
            <dd>{project.technologies.join(", ")}</dd>
          </div>
          <div data-project-reveal>
            <dt>Description</dt>
            <dd>{project.description}</dd>
          </div>
          {project.installation ? (
            <div data-project-reveal>
              <dt>Installation</dt>
              <dd>{project.installation}</dd>
            </div>
          ) : null}
          {project.usage ? (
            <div data-project-reveal>
              <dt>Usage</dt>
              <dd>{project.usage}</dd>
            </div>
          ) : null}
          <div data-project-reveal>
            <dt>Key Features</dt>
            <dd>
              <ul className="project-detail__features">
                {project.keyFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </dd>
          </div>
          {project.technicalHighlights ? (
            <div data-project-reveal>
              <dt>Technical Highlights</dt>
              <dd>
                <ul className="project-detail__features">
                  {project.technicalHighlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <ProjectGallery project={project} />
    </article>
  );
}

function ProjectExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label}
      <ArrowUpRightIcon />
      <span className="sr-only">opens in a new tab</span>
    </a>
  );
}
