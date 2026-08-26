import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/site/cn";

export function AdminField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-[var(--admin-ink)]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[var(--admin-muted)]">{hint}</p> : null}
    </div>
  );
}

export function AdminInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("admin-field", className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("admin-field", className)} {...props} />;
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

export function AdminButton({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}

function buttonClass(variant: BtnVariant, className?: string) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-[var(--admin-ink)] text-white hover:bg-black",
    secondary: "bg-transparent text-[var(--admin-ink)] border border-[var(--admin-line)] hover:border-[var(--admin-ink)]",
    ghost: "bg-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
    danger: "bg-transparent text-[#8a2a2a] hover:bg-[#8a2a2a]/8",
  };

  return cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-[13px] font-medium tracking-[0.04em]",
    "transition-colors disabled:pointer-events-none disabled:opacity-40",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ink)] focus-visible:ring-offset-2",
    styles[variant],
    className
  );
}

export function AdminButtonLink({
  to,
  variant = "primary",
  className,
  children,
}: {
  to: string;
  variant?: BtnVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function AdminBanner({ children }: { children: ReactNode }) {
  return (
    <p className="border border-[var(--admin-line)] bg-white px-4 py-3 text-sm text-[var(--admin-ink)]" role="status">
      {children}
    </p>
  );
}

export type AdminSegOption<T extends string> = {
  id: T;
  label: string;
  count?: number;
  icon?: ReactNode;
};

export function AdminSegmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
}: {
  value: T;
  onChange: (id: T) => void;
  options: AdminSegOption<T>[];
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "grid w-full gap-1 bg-[#e7e5e0] p-1",
        size === "md" ? "grid-cols-3 rounded-xl" : "rounded-lg"
      )}
      style={size === "sm" ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex min-w-0 items-center justify-center gap-2 rounded-[10px] font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ink)] focus-visible:ring-offset-2",
              size === "md" ? "h-12 px-3 text-sm" : "h-9 px-2 text-[13px]",
              selected
                ? "bg-white text-[var(--admin-ink)] shadow-[0_1px_2px_rgba(22,22,22,0.08)]"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
            )}
          >
            {option.icon && (
              <span className={cn("hidden shrink-0 sm:inline-flex", selected ? "opacity-100" : "opacity-70")} aria-hidden>
                {option.icon}
              </span>
            )}
            <span className="truncate">{option.label}</span>
            {typeof option.count === "number" && (
              <span className={cn("tabular-nums", selected ? "text-[var(--admin-ink)]" : "opacity-60")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
