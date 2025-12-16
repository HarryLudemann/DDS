import { clsx } from "../../utils/format";

export function Textarea(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-border bg-panel",
        "px-3 py-2 text-sm text-text placeholder:text-muted",
        "outline-none transition focus:ring-2 focus:ring-brand/25",
        className
      )}
      {...rest}
    />
  );
}
