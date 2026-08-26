import { SITE } from "../../lib/site/constants";
import { useHours } from "../../hooks/useHours";
import { cn } from "../../lib/site/cn";

export function StudioHours({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { lines, anyOpen, loading } = useHours();
  const visible = compact ? lines.filter((line) => line.hours !== "Closed") : lines;

  if (loading && lines.length === 0) {
    return <p className={cn("text-sm text-[var(--site-muted)]", className)}>Hours loading…</p>;
  }

  if (!anyOpen) {
    return (
      <p className={cn("text-sm leading-relaxed text-[var(--site-muted)]", className)}>
        Times are on the booking page.
      </p>
    );
  }

  return (
    <ul className={cn("grid gap-1.5 text-sm text-[var(--site-muted)]", className)}>
      {visible.map((line) => (
        <li key={line.label} className="flex items-baseline justify-between gap-8">
          <span>{line.label}</span>
          <span className="tabular-nums">{line.hours}</span>
        </li>
      ))}
      {!compact && (
        <li className="pt-2 text-xs">
          {SITE.city}, NZ. Drop-off time is confirmed after booking.
        </li>
      )}
    </ul>
  );
}
