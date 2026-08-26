import type { ReactNode } from "react";
import { cn } from "../../../lib/site/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("site-chip", className)}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  invert?: boolean;
}) {
  return (
    <div className="max-w-xl">
      {eyebrow && <Eyebrow className={invert ? "site-chip-on-dark" : undefined}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "mt-5 font-display text-[2rem] leading-[1.12] sm:text-[2.75rem]",
          invert ? "text-white" : "text-[var(--site-ink)]"
        )}
      >
        {title}
      </h2>
      {body && (
        <p
          className={cn(
            "mt-5 max-w-md text-[15px] leading-[1.7]",
            invert ? "text-white/65" : "text-[var(--site-muted)]"
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
