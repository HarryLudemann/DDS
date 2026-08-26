import type { ReactNode } from "react";
import { cn } from "../../../lib/site/cn";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn("site-reveal", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
