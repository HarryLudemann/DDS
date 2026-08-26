import { Link } from "react-router-dom";
import type { Service } from "../../../types/db";
import { fmtDuration, fmtMoney } from "../../../utils/format";
import { imageForService } from "../../../lib/site/media";
import { serviceSlug } from "../../../lib/site/slug";
import { Reveal } from "../ui/Reveal";
import { SitePhoto } from "../ui/SitePhoto";
import { SiteButtonLink, SiteTextLink } from "../ui/Button";

export function ServiceCard({
  service,
  all,
  index = 0,
  aspect = "aspect-[4/5]",
  compact = false,
}: {
  service: Service;
  all: Service[];
  index?: number;
  aspect?: string;
  compact?: boolean;
}) {
  const slug = serviceSlug(service, all);
  const href = `/services/${slug}`;
  const image = imageForService(service.title, service.subtitle, service.summary, service.includes);
  const points = service.includes.slice(0, compact ? 3 : 6);
  const extra = service.includes.length - points.length;

  return (
    <Reveal delay={Math.min(index * 70, 200)}>
      <article>
        <Link to={href} className="group block">
          <SitePhoto
            image={image}
            aspect={aspect}
            loading={index < 2 ? "eager" : "lazy"}
            imgClassName="transition-[filter] duration-700 ease-out group-hover:brightness-[1.04]"
          />
          <h3 className="mt-5 font-display text-[1.45rem] leading-tight">{service.title}</h3>
        </Link>
        {service.subtitle && (
          <p className="mt-1.5 text-[13px] text-[var(--site-muted)]">{service.subtitle}</p>
        )}
        <p className="mt-2 text-sm text-[var(--site-muted)]">
          From {fmtMoney(service.price_cents)}
          <span className="mx-2">·</span>
          {fmtDuration(service.duration_mins)}
        </p>
        {!compact && service.summary && (
          <p className="mt-3 max-w-md text-[15px] leading-[1.65] text-[var(--site-muted)]">{service.summary}</p>
        )}
        {points.length > 0 && (
          <ul className="mt-4 border-t border-[var(--site-line)]">
            {points.map((item) => (
              <li key={item} className="border-b border-[var(--site-line)] py-2.5 text-[13px] leading-snug sm:text-sm">
                {item}
              </li>
            ))}
            {extra > 0 && (
              <li className="pt-2.5 text-[13px] text-[var(--site-muted)]">+{extra} more</li>
            )}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <SiteButtonLink to={`/book?service=${encodeURIComponent(service.id)}`}>Book</SiteButtonLink>
          <SiteTextLink to={href}>Full details</SiteTextLink>
        </div>
      </article>
    </Reveal>
  );
}
