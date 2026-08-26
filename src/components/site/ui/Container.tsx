import type { ReactNode } from "react";
import { cn } from "../../../lib/site/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-[1280px] px-5 sm:px-8 lg:px-12", className)}>
      {children}
    </div>
  );
}
