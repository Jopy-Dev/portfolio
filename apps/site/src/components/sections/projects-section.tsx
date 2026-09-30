import { ProjectList } from "@/components/projects/project-list";
import { SectionHeader } from "@/components/ui/section-header";
import { FEATURED_PROJECTS } from "@/content/portfolio";

export function ProjectsSection() {
  return (
    <section
      className="projects section content-shell"
      id="projects"
      aria-labelledby="projects-title"
      data-projects-state={FEATURED_PROJECTS.length === 0 ? "empty" : "active"}
    >
      <SectionHeader id="projects-title">Projects</SectionHeader>
      {FEATURED_PROJECTS.length === 0 ? (
        <div className="projects__empty">
          <p>Selected work will appear here after review.</p>
        </div>
      ) : (
        <ProjectList projects={FEATURED_PROJECTS} />
      )}
    </section>
  );
}
