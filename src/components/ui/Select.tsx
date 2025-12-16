import { clsx } from "../../utils/format";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900",
        "ring-1 ring-black/10 outline-none transition",
        "focus-visible:ring-4 focus-visible:ring-indigo-200",
        className
      )}
      {...props}
    />
  );
}
