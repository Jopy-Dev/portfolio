import Image from "next/image";
import { SectionHeader } from "@/components/ui/section-header";
import { SKILL_GROUPS } from "@/content/portfolio";

export function SkillsSection() {
  return (
    <section
      className="skills section content-shell"
      id="skills"
      aria-labelledby="skills-title"
    >
      <SectionHeader id="skills-title">Skills</SectionHeader>
      <div className="skill-groups">
        {SKILL_GROUPS.map((group) => (
          // biome-ignore lint/a11y/useSemanticElements: fieldset is reserved for form controls; this labels a skill content group
          <div
            className="skill-group"
            role="group"
            aria-labelledby={`${group.id}-title`}
            key={group.id}
          >
            <h3 id={`${group.id}-title`}>{group.title}</h3>
            <div className="skill-list">
              {group.skills.map((skill) => (
                <span
                  className={`skill${skill.icon ? "" : " skill--text"}`}
                  key={skill.label}
                >
                  {skill.icon ? (
                    <Image
                      src={skill.icon}
                      alt=""
                      width={28}
                      height={28}
                      unoptimized
                    />
                  ) : null}
                  {skill.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
