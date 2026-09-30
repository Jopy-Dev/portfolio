import { ContactForm } from "@/components/contact/contact-form";
import { SectionHeader } from "@/components/ui/section-header";
import { readContactConfig } from "@/lib/env";

export function ContactSection() {
  // Static export: evaluated once at build time on the server.
  const config = readContactConfig();
  return (
    <section
      className="contact section content-shell"
      id="contact"
      aria-labelledby="contact-title"
    >
      <SectionHeader id="contact-title">Contact</SectionHeader>
      <div className="contact__grid">
        <div className="contact__intro">
          <p>Have a role, project, or engineering challenge in mind?</p>
          <span>Send a message through the protected form.</span>
        </div>
        <ContactForm config={config} />
      </div>
    </section>
  );
}
