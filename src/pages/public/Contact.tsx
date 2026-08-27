import { SITE } from "../../lib/site/constants";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { SectionHeading } from "../../components/site/ui/SectionHeading";
import { SiteButtonLink } from "../../components/site/ui/Button";
import { StudioHours } from "../../components/site/HoursList";

export default function Contact() {
  return (
    <>
      <SiteSeo path="/contact" />
      <Container className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="Contact"
          title="Not sure which package?"
          body="The booking form is how we hear from you. If you’re not sure which package, how long it will take, or what the car needs — send a request. We’ll get back to you to confirm the work, the time, and the details."
        />

        <div className="mt-10 max-w-lg space-y-4 text-[15px] leading-[1.7] text-[var(--site-muted)]">
          <p>
            Name and email are required so we can get back to you. Add a note with anything useful — stains, pet hair, a full interior, or “not sure, please advise.”
          </p>
          <p>No payment is taken online. The studio address is sent with the confirmation.</p>
        </div>

        <div className="mt-12">
          <SiteButtonLink to="/book" size="lg">
            Book a drop-off
          </SiteButtonLink>
        </div>

        <div className="mt-20 grid gap-16 border-t border-[var(--site-line)] pt-16 md:grid-cols-2">
          <div>
            <h2 className="site-chip">Studio</h2>
            <p className="mt-5 font-display text-4xl">{SITE.city}</p>
            <p className="mt-4 max-w-sm text-[15px] leading-[1.7] text-[var(--site-muted)]">
              {SITE.format}. Address is confirmed with your booking.
            </p>
          </div>
          <div>
            <h2 className="site-chip">Hours</h2>
            <div className="mt-5 max-w-xs">
              <StudioHours />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
