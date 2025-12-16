import { clsx } from "../../utils/format";

export function Badge(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className, ...rest } = props;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border border-border bg-white/5",
        "px-3 py-1 text-xs text-muted",
        className
      )}
      {...rest}
    />
  );
}
