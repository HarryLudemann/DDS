import { clsx } from "../../utils/format";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "inverted";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 " +
    "text-sm font-semibold transition active:scale-[0.99] " +
    "disabled:opacity-50 disabled:pointer-events-none " +
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200";

  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
      : variant === "secondary"
      ? "bg-white text-slate-900 ring-1 ring-black/10 hover:bg-slate-50"
      : variant === "inverted"
      ? "bg-white text-slate-900 hover:bg-slate-100"
      : "bg-transparent text-slate-700 hover:bg-black/5";

  return <button className={clsx(base, styles, className)} {...props} />;
}
