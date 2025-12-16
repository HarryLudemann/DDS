import { clsx } from "../../utils/format";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white shadow-soft",
        "ring-1 ring-black/5",
        "p-6",
        className
      )}
      {...props}
    />
  );
}
