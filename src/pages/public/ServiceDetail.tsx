import { Link, Navigate, useParams } from "react-router-dom";
import { useServices } from "../../hooks/useServices";
import { findServiceBySlug } from "../../lib/site/slug";
import { imageForService } from "../../lib/site/media";
import { SITE } from "../../lib/site/constants";
import { ogImageUrl } from "../../lib/site/seo";
import { fmtDuration, fmtMoney } from "../../utils/format";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { SiteButtonLink } from "../../components/site/ui/Button";
import { SitePhoto } from "../../components/site/ui/SitePhoto";

export default function ServiceDetail() {
  const { slug = "" } = useParams();
  const { services, loading } = useServices();
  const service = findServiceBySlug(services, slug);
  const image = service
    ? imageForService(service.title, service.subtitle, service.summary, service.includes)
    : null;

  if (!loading && services.length > 0 && !service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <>
      {service && (
        <SiteSeo
          title={service.title}
          description={service.summary || service.description || `${service.title} in Wellington. Studio drop-off detailing.`}
          path={`/services/${slug}`}
          image={ogImageUrl()}
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.summary || service.description || service.title,
            provider: {
              "@type": "LocalBusiness",
              name: SITE.name,
              address: {
                "@type": "PostalAddress",
                addressLocality: SITE.city,
                addressCountry: SITE.country,
              },
            },
            areaServed: SITE.city,
            offers: {
              "@type": "Offer",
              priceCurrency: "NZD",
              price: (service.price_cents / 100).toFixed(2),
              url: `${SITE.baseUrl}/book?service=${encodeURIComponent(service.id)}`,
            },
          }}
        />
      )}

      <Container className="py-12 sm:py-20">
        {loading && !service ? (
          <div className="h-[60vh] bg-[var(--site-paper)]" />
        ) : service ? (
          <article>
            <Link to="/services" className="text-[13px] text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]">
              Services
            </Link>

            <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-20 lg:items-end">
              <div className="lg:col-span-7">
                {image && <SitePhoto image={image} aspect="aspect-[4/5]" loading="eager" />}
              </div>
              <div className="lg:col-span-5 lg:pb-4">
                <h1 className="font-display text-[2.75rem] leading-[1.02] sm:text-5xl">{service.title}</h1>
                {service.subtitle && <p className="mt-4 text-[15px] text-[var(--site-muted)]">{service.subtitle}</p>}
                <p className="mt-8 text-[15px]">
                  From {fmtMoney(service.price_cents)} GST incl.
                  <span className="mx-2 text-[var(--site-muted)]">·</span>
                  <span className="text-[var(--site-muted)]">{fmtDuration(service.duration_mins)}</span>
                </p>
                {(service.description || service.summary) && (
                  <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-[var(--site-muted)]">
                    {service.description || service.summary}
                  </p>
                )}
                <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[var(--site-muted)]">
                  Starting price. Final figure is confirmed if size or condition needs more work. No payment is taken online.
                </p>
                <div className="mt-10">
                  <SiteButtonLink to={`/book?service=${encodeURIComponent(service.id)}`} size="lg">
                    Book this package
                  </SiteButtonLink>
                </div>
              </div>
            </div>

            {(service.includes.length > 0 || service.ideal_for.length > 0) && (
              <div className="mt-20 grid gap-16 md:grid-cols-2">
                {service.includes.length > 0 && (
                  <div>
                    <h2 className="site-chip">What’s included</h2>
                    <ul className="mt-6">
                      {service.includes.map((item) => (
                        <li key={item} className="border-t border-[var(--site-line)] py-3.5 text-[15px]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.ideal_for.length > 0 && (
                  <div>
                    <h2 className="site-chip">Ideal for</h2>
                    <ul className="mt-6">
                      {service.ideal_for.map((item) => (
                        <li key={item} className="border-t border-[var(--site-line)] py-3.5 text-[15px]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>
        ) : null}
      </Container>
    </>
  );
}
