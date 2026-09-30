"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import type { FeaturedProject } from "@/content/portfolio";
import { useProjectPreview } from "./use-project-preview";

type ProjectListProps = {
  projects: readonly FeaturedProject[];
};

export function ProjectList({ projects }: ProjectListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  useProjectPreview(listRef, previewRef);
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug ?? null);
  const [engagedSlug, setEngagedSlug] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const activateProject = (slug: string, showPreview = true) => {
    setActiveSlug(slug);
    setEngagedSlug(slug);
    setPreviewVisible(showPreview);
  };

  return (
    <div
      ref={listRef}
      className="projects__list"
      data-engaged={engagedSlug !== null}
      data-project-count={projects.length}
      onPointerLeave={() => {
        setEngagedSlug(null);
        setPreviewVisible(false);
      }}
    >
      <div className="projects__rows">
        {projects.map((project, index) => (
          <Link
            className="project-row"
            data-active={engagedSlug === project.slug}
            data-motion-project-row
            href={`/projects/${project.slug}/`}
            scroll={false}
            aria-label={`View ${project.title} project details`}
            key={project.slug}
            onPointerEnter={() => {
              const finePointer = window.matchMedia(
                "(hover: hover) and (pointer: fine)",
              ).matches;
              activateProject(project.slug, finePointer);
            }}
            onFocus={() => activateProject(project.slug)}
            onBlur={() => {
              setEngagedSlug(null);
              setPreviewVisible(false);
            }}
          >
            <Image
              className="project-row__image"
              src={project.previewImage}
              alt=""
              width={720}
              height={480}
            />
            <span className="project-row__index">
              _{String(index + 1).padStart(2, "0")}.
            </span>
            <span className="project-row__content">
              <strong>
                <span className="project-row__title">{project.title}</span>
                <ArrowUpRightIcon />
              </strong>
              <span>{project.technologies.slice(0, 3).join(" · ")}</span>
            </span>
          </Link>
        ))}
      </div>

      <div
        ref={previewRef}
        className="projects__preview"
        data-visible={previewVisible}
        aria-hidden="true"
      >
        {projects.map((project) => (
          <Image
            src={project.previewImage}
            alt=""
            width={400}
            height={520}
            data-active={activeSlug === project.slug}
            key={project.slug}
          />
        ))}
      </div>
    </div>
  );
}
