import type { MetadataRoute } from "next";
import { FEATURED_PROJECTS } from "@/content/portfolio";
import { SITE_ORIGIN } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_ORIGIN}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...FEATURED_PROJECTS.map((project) => ({
      url: `${SITE_ORIGIN}/projects/${project.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
