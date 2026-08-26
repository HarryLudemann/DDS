import { useServices } from "../../hooks/useServices";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { SectionHeading } from "../../components/site/ui/SectionHeading";
import { ServiceCard } from "../../components/site/services/ServiceCard";
import { SiteButtonLink } from "../../components/site/ui/Button";

export default function Services() {
  const { services, loading, error } = useServices();

  return (
    <>
      <SiteSeo path="/services" />
      <Container className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="Packages"
          title="The work, itemised."
          body="Starting prices include GST and move with vehicle size and condition. If the car needs more, we confirm before work starts."
        />

        {error && (
          <p className="mt-10 text-sm text-[#8a2a2a]" role="alert">
            {error}
          </p>
        )}

        {loading && services.length === 0 ? (
          <div className="mt-16 grid gap-x-12 gap-y-20 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[5/4] bg-[var(--site-paper)]" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="mt-16 text-sm text-[var(--site-muted)]">No packages listed right now.</p>
        ) : (
          <div className="mt-16 grid gap-x-12 gap-y-20 lg:grid-cols-2">
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} all={services} index={i} aspect="aspect-[5/4]" />
            ))}
          </div>
        )}

        <div className="mt-24 max-w-md">
          <p className="text-[15px] leading-[1.7] text-[var(--site-muted)]">
            Not sure which package? Book the closest match and add notes. We’ll confirm the right job and the drop-off time.
          </p>
          <div className="mt-8">
            <SiteButtonLink to="/book" size="lg">
              Book a drop-off
            </SiteButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
