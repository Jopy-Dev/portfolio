"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import type { FeaturedProject } from "@/content/portfolio";
import { usesNativeSectionActivation } from "@/lib/section-click-navigation";

type ProjectImage = FeaturedProject["galleryImages"][number];

export function ProjectGallery({ project }: { project: FeaturedProject }) {
  const [expanded, setExpanded] = useState<ProjectImage | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!expanded || !dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [expanded]);

  return (
    <>
      <figure className="project-detail__gallery">
        <figcaption className="sr-only">Project gallery</figcaption>
        {project.galleryImages.map((image, index) => (
          <a
            href={image.src}
            aria-label={`Expand ${project.title} image ${index + 1}`}
            data-project-reveal
            key={image.src}
            onClick={(event) => {
              if (usesNativeSectionActivation(event)) return;
              event.preventDefault();
              triggerRef.current = event.currentTarget;
              setExpanded(image);
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 900px) calc(100vw - 2rem), 800px"
            />
            <span className="project-detail__image-open" aria-hidden="true">
              <ArrowUpRightIcon />
            </span>
          </a>
        ))}
      </figure>
      <dialog
        ref={dialogRef}
        className="project-image-viewer"
        aria-label="Full project image"
        data-lenis-prevent
        onCancel={() => setExpanded(null)}
        onClose={() => setExpanded(null)}
      >
        <button
          className="project-image-viewer__close"
          type="button"
          aria-label="Close full image"
          onClick={() => setExpanded(null)}
        >
          {expanded ? (
            <Image
              src={expanded.src}
              alt={expanded.alt}
              width={expanded.width}
              height={expanded.height}
              sizes="100vw"
              className="project-image-viewer__image"
            />
          ) : null}
        </button>
      </dialog>
    </>
  );
}
