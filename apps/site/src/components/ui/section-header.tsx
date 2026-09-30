import { SectionMarkIcon } from "@/components/ui/icons";

type SectionHeaderProps = {
  id: string;
  children: string;
};

export function SectionHeader({ id, children }: SectionHeaderProps) {
  return (
    <header className="section-heading">
      <span className="section-mark" aria-hidden="true">
        <SectionMarkIcon />
      </span>
      <h2 id={id}>{children}</h2>
    </header>
  );
}
