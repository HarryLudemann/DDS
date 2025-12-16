import { clsx } from "../../utils/format";

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        "bg-black/5 text-muted",
        className
      )}
      {...props}
    />
  );
}
