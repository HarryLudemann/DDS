import { clsx } from "../../utils/format";

export function Section({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx("space-y-6", className)}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-600 max-w-2xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
