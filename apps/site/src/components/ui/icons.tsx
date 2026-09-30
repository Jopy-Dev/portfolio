type IconProps = {
  className?: string;
};

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function SectionMarkIcon({ className }: IconProps) {
  const petal =
    "M12.5 14.464C11.57 10.705 9.94 6.33 10.88 2.33 11.3.74 12.04 0 12.5 0s1.2.74 1.62 2.33c.94 4-0.69 8.375-1.62 12.134Z";
  return (
    <svg className={className} viewBox="0 0 25 28.929" aria-hidden="true">
      <path d={petal} />
      <path d={petal} transform="rotate(60 12.5 14.464)" />
      <path d={petal} transform="rotate(120 12.5 14.464)" />
      <path d={petal} transform="rotate(180 12.5 14.464)" />
      <path d={petal} transform="rotate(240 12.5 14.464)" />
      <path d={petal} transform="rotate(300 12.5 14.464)" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 18 24 30 36 18" />
    </svg>
  );
}
