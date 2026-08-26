import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/site/cn";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

const styles: Record<Variant, string> = {
  primary: "bg-[var(--site-ink)] text-white hover:bg-black border border-transparent",
  secondary: "bg-transparent text-[var(--site-ink)] border border-[var(--site-ink)]/20 hover:border-[var(--site-ink)]",
  ghost: "bg-transparent text-[var(--site-ink)] border border-transparent hover:opacity-60",
  inverse: "bg-white text-[var(--site-ink)] border border-white hover:bg-white/90",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[13px]",
  lg: "h-12 px-7 text-[13px] sm:h-14 sm:px-8",
};

function buttonClass(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-none font-medium",
    "transition-colors duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--site-bg)]",
    "disabled:opacity-40 disabled:pointer-events-none",
    styles[variant],
    sizes[size],
    className
  );
}

export function SiteButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function SiteButtonLink({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
}: Common & { to: string }) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function SiteTextLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center text-[13px] text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]",
        className
      )}
    >
      {children}
    </Link>
  );
}
