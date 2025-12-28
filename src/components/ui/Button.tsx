import { clsx } from "../../utils/format";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "inverted";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 " +
    "text-sm font-semibold transition-all duration-200 active:scale-[0.98] " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
      : variant === "secondary"
      ? "bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow"
      : variant === "inverted"
      ? "bg-white text-slate-900 border border-white/20 hover:bg-slate-50 shadow-sm hover:shadow"
      : "bg-transparent text-slate-700 hover:bg-slate-100/50 border border-transparent hover:border-slate-200";

  return <button className={clsx(base, styles, className)} {...props} />;
}
