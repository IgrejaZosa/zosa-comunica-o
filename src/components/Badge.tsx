export function Badge({
  label,
  fg,
  bg,
  className = "",
}: {
  label: string;
  fg: string;
  bg: string;
  className?: string;
}) {
  return (
    <span className={`badge ${className}`} style={{ color: fg, backgroundColor: bg }}>
      {label}
    </span>
  );
}
