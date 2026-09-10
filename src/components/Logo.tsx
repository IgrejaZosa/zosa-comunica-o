export function Logo({
  className = "",
  heightClassName = "h-8",
  textClassName = "text-xl",
  showText = true,
}: {
  className?: string;
  heightClassName?: string;
  textClassName?: string;
  showText?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png" alt="" className={`${heightClassName} w-auto shrink-0`} />
      {showText && (
        <span className={`whitespace-nowrap text-zosa-dark ${textClassName}`}>
          <span className="font-light tracking-wide">IGREJA</span>
          <span className="font-extrabold">ZŌSA</span>
        </span>
      )}
    </span>
  );
}
