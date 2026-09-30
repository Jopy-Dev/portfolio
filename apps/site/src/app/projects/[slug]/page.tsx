import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ParticleBackground } from "@/components/motion/particle-background";
import { ProjectDetailMotion } from "@/components/motion/project-detail-motion";
import { ViewportEffects } from "@/components/motion/viewport-effects";
import { ProjectDetailPage } from "@/components/projects/project-detail-page";
import {
  getFeaturedProject,
  getProjectStaticParams,
} from "@/content/portfolio";

type ProjectRouteProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectStaticParams();
}

export async function generateMetadata({
  params,
}: ProjectRouteProps): Promise<Metadata> {
  const project = getFeaturedProject((await params).slug);
  if (!project) notFound();
  const title = `${project.title} | Jopy Dev`;
  const url = `/projects/${project.slug}/`;
  return {
    title,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description: project.description,
      url,
      images: [{ url: project.previewImage, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.description,
      images: [project.previewImage],
    },
  };
}

export default async function ProjectRoute({ params }: ProjectRouteProps) {
  const project = getFeaturedProject((await params).slug);
  if (!project) notFound();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <ParticleBackground />
      <ViewportEffects />
      <ProjectDetailMotion />
      <SiteHeader homepage={false} />
      <main id="main-content">
        <ProjectDetailPage project={project} />
      </main>
      <SiteFooter />
    </>
  );
}
