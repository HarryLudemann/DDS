import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../../../lib/site/cn";

const fieldClass =
  "w-full rounded-none border border-[var(--site-line)] bg-transparent px-3.5 py-3 text-sm text-[var(--site-ink)] outline-none transition-colors placeholder:text-[var(--site-muted)]/70 focus:border-[var(--site-ink)]";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-[13px] text-[var(--site-muted)]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[#8a2a2a]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--site-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function SiteInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function SiteTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-[120px] resize-y", className)} {...props} />;
}
