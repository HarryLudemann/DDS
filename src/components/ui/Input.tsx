import { clsx } from "../../utils/format";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900",
        "ring-1 ring-black/10 outline-none transition",
        "placeholder:text-slate-400",
        "focus-visible:ring-4 focus-visible:ring-indigo-200 focus-visible:ring-offset-0",
        className
      )}
      {...props}
    />
  );
}
