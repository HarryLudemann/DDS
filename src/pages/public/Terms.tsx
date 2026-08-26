import LegalPage from "./LegalLayout";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      description="Booking terms, pricing, cancellation, and liability for DDS in New Zealand."
      path="/terms"
    >
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Bookings</h2>
        <p className="mt-3">
          Submitting a booking request does not take payment. The business may contact you to confirm the exact drop-off time,
          details, and final price (if inspection-based).
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Pricing</h2>
        <p className="mt-3">
          Displayed prices are starting prices. Final pricing may vary based on vehicle size and condition. Any quoted price will be
          confirmed with you before work begins.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Cancellations</h2>
        <p className="mt-3">If you need to cancel or reschedule, please contact the business as early as possible.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Liability</h2>
        <p className="mt-3">
          Services are provided with reasonable care and skill. Where permitted, liability is limited to the extent allowed under New
          Zealand consumer law.
        </p>
      </section>
    </LegalPage>
  );
}
