import { SITE } from "../../lib/site/constants";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { SectionHeading } from "../../components/site/ui/SectionHeading";
import { SiteButtonLink } from "../../components/site/ui/Button";
import { StudioHours } from "../../components/site/HoursList";

const FAQ = [
  {
    q: "Do you offer mobile detailing?",
    a: "No. This is studio drop-off only. A controlled setup keeps results consistent and avoids weather interruptions.",
  },
  {
    q: "How does booking work?",
    a: "Choose a package, pick a day and a preferred drop-off window, and send your details. No payment is taken online. We confirm the exact drop-off time afterwards.",
  },
  {
    q: "How long does it take?",
    a: "Times vary by package, vehicle size, and condition. After booking you get a confirmed drop-off time and a realistic window for pickup.",
  },
  {
    q: "What’s included in the price?",
    a: "Each package lists key inclusions and a starting price (GST included). Final pricing can change for larger vehicles or heavy soiling — if it needs an inspection-based quote, you’re contacted first.",
  },
];

const PROCESS = [
  {
    n: "01",
    title: "Choose a package",
    body: "Inclusions and starting prices are listed. Leave notes for stains, pet hair, or anything you want treated first.",
  },
  {
    n: "02",
    title: "Book a window",
    body: "Pick a day and a preferred drop-off window. We confirm the exact time after the request.",
  },
  {
    n: "03",
    title: "Studio drop-off",
    body: "Drop the car at the studio. Lighting, process, and finishing stay consistent — then you collect when it’s ready.",
  },
];

export default function About() {
  return (
    <>
      <SiteSeo path="/about" />
      <Container className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="The studio"
          title="A studio, not a driveway"
          body={`${SITE.shortName} is drop-off detailing in ${SITE.city}. Packages, prices, and a confirmed time are listed before you book.`}
        />

        <div className="mt-16 max-w-xl space-y-6 text-[15px] leading-[1.75] text-[var(--site-muted)]">
          <p>
            What’s included is listed before you book: the work, how long it typically takes, and a starting price. Final pricing can change for larger vehicles or heavy soiling. If anything needs a look at the car first, you’re contacted before work starts.
          </p>
          <p>
            There is no mobile service. Drop-off keeps lighting, process, and finishing consistent, and keeps the weather out of the job.
          </p>
          <p>
            You don’t pay on this site. After a booking request, we confirm the drop-off time and the details of the work.
          </p>
        </div>

        <div className="mt-24 max-w-xs">
          <h2 className="site-chip">Hours</h2>
          <div className="mt-5">
            <StudioHours />
          </div>
        </div>

        <div className="mt-24 grid gap-14 md:grid-cols-3">
          {PROCESS.map((step) => (
            <div key={step.n}>
              <div className="site-chip">{step.n}</div>
              <h2 className="mt-5 font-display text-[1.65rem] leading-tight">{step.title}</h2>
              <p className="mt-3 text-[15px] leading-[1.7] text-[var(--site-muted)]">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-28 max-w-2xl">
          <h2 className="font-display text-4xl">Before you book</h2>
          <dl className="mt-10 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
            {FAQ.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-[15px]">{item.q}</dt>
                <dd className="mt-2 text-[15px] leading-[1.7] text-[var(--site-muted)]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-28">
          <SiteButtonLink to="/book" size="lg">
            Book a drop-off
          </SiteButtonLink>
        </div>
      </Container>
    </>
  );
}
