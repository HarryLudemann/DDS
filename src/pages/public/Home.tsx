import { Link } from "react-router-dom";
import { useHours } from "../../hooks/useHours";
import { useServices } from "../../hooks/useServices";
import { SITE } from "../../lib/site/constants";
import { HERO_IMAGE, GALLERY } from "../../lib/site/media";
import { SitePhoto } from "../../components/site/ui/SitePhoto";
import { localBusinessJsonLd, websiteJsonLd } from "../../lib/site/jsonld";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { SiteButtonLink, SiteTextLink } from "../../components/site/ui/Button";
import { SectionHeading } from "../../components/site/ui/SectionHeading";
import { Reveal } from "../../components/site/ui/Reveal";
import { ServiceCard } from "../../components/site/services/ServiceCard";

const WHY = [
  {
    title: "Specified work",
    body: "Each package lists inclusions and a starting price before you book. You know the job, not a vague “detail”.",
  },
  {
    title: "Studio conditions",
    body: "Drop-off only. Controlled light and process — not a driveway, not the weather, not a rushed mobile stop.",
  },
  {
    title: "A confirmed slot",
    body: "Pick a day and a window. We confirm the exact drop-off time after the request. No payment is taken online.",
  },
  {
    title: "Finish that holds",
    body: "The work is aimed at how the car looks and feels on handover — paint, cabin, glass — then a final pass.",
  },
];

export default function Home() {
  const { services, loading } = useServices();
  const { openingHours } = useHours();
  const featured = services.slice(0, 3);

  return (
    <>
      <SiteSeo path="/" jsonLd={[localBusinessJsonLd(openingHours), websiteJsonLd()]} />

      <section className="relative min-h-[100svh] overflow-hidden bg-[#111] text-white">
        <img
          src={HERO_IMAGE.src}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="site-photo-img absolute inset-0"
          style={{ objectPosition: HERO_IMAGE.objectPosition }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/55" />
        <Container className="site-hero-copy relative flex min-h-[100svh] flex-col justify-start pt-[18svh] pb-24 sm:pt-[20svh] lg:pt-[22vh]">
          <p className="site-chip site-chip-on-dark">
            {SITE.city} · {SITE.format}
          </p>
          <h1 className="mt-5 max-w-[12ch] font-display text-[3.25rem] leading-[0.94] sm:text-6xl lg:text-[4.85rem]">
            The finish, specified.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-white/80 sm:text-base">
            Studio detailing in Wellington. Choose a package, book a drop-off window, and we confirm the slot. Starting prices listed. No checkout online.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <SiteButtonLink to="/book" variant="inverse" size="lg">
              Book a drop-off
            </SiteButtonLink>
            <SiteTextLink to="/services" className="text-white/85 hover:text-white">
              View packages
            </SiteTextLink>
          </div>
        </Container>
      </section>

      <section className="py-28 sm:py-36">
        <Container>
          <SectionHeading
            eyebrow="Packages"
            title="Book the work, not a quote chase."
            body="Starting prices include GST and vary by vehicle size and condition. If the car needs more, we confirm before work starts."
          />

          <div className="mt-16 grid gap-x-10 gap-y-20 lg:grid-cols-3">
            {loading && featured.length === 0
              ? [0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] bg-[var(--site-paper)]" />)
              : featured.map((s, i) => (
                  <ServiceCard key={s.id} service={s} all={services} index={i} compact />
                ))}
          </div>

          {!loading && services.length === 0 && (
            <p className="mt-10 text-sm text-[var(--site-muted)]">Packages will appear here shortly.</p>
          )}

          {services.length > 0 && (
            <div className="mt-14">
              <SiteTextLink to="/services">All packages</SiteTextLink>
            </div>
          )}
        </Container>
      </section>

      <section className="py-28 sm:py-36">
        <Container>
          <SectionHeading
            eyebrow="Why the studio"
            title="Consistent work, on the books."
            body="A controlled setup, listed inclusions, and a confirmed drop-off — built to convert a booking, not a conversation."
          />
          <div className="mt-20 grid gap-x-16 gap-y-14 sm:grid-cols-2">
            {WHY.map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="max-w-sm">
                  <div className="site-chip">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-5 font-display text-[1.65rem] leading-tight">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-[1.7] text-[var(--site-muted)]">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-28 sm:py-36">
        <Container>
          <SectionHeading
            eyebrow="Work"
            title="What leaves the studio."
            body="Paint, interior, glass and trim — the parts of the car people actually notice."
          />
          <div className="mt-16 grid gap-5 md:grid-cols-3 md:gap-8">
            {GALLERY.map((img, i) => (
              <Reveal key={img.src} delay={i * 70}>
                <Link to="/gallery" className="group block">
                  <SitePhoto
                    image={img}
                    aspect="aspect-[4/5]"
                    loading={i === 0 ? "eager" : "lazy"}
                    imgClassName="transition-[filter] duration-700 group-hover:brightness-[1.04]"
                  />
                  <div className="mt-3 text-[13px] text-[var(--site-muted)]">{img.caption}</div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-12">
            <SiteTextLink to="/gallery">Gallery</SiteTextLink>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--site-ink)] text-white">
        <Container className="py-24 sm:py-32">
          <Reveal>
            <p className="site-chip site-chip-on-dark">Book</p>
            <h2 className="mt-5 max-w-[14ch] font-display text-4xl leading-[1.05] sm:text-6xl">
              Put it in the diary.
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-white/70">
              Choose a package and a drop-off window. We confirm the exact time. No payment is taken on this site.
            </p>
            <div className="mt-10">
              <SiteButtonLink to="/book" variant="inverse" size="lg">
                Book a drop-off
              </SiteButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
