import LegalPage from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How DDS collects, uses, and protects personal information in New Zealand."
      path="/privacy"
    >
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">What we collect</h2>
        <p className="mt-3">
          When you use the booking form we collect information you provide, such as your name and email address. Phone, vehicle
          details, and notes are optional.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Why we collect it</h2>
        <p className="mt-3">
          We use your information to manage bookings, communicate with you about your appointment, and provide the requested
          detailing service.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">How we store and protect information</h2>
        <p className="mt-3">
          Booking information is stored securely and access is limited to the business administrator. We take reasonable steps to
          protect information from loss, misuse, and unauthorised access.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Sharing</h2>
        <p className="mt-3">
          We do not sell personal information. We may share information with service providers used to operate the website or
          booking system, only as required to run the service.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Your rights</h2>
        <p className="mt-3">
          You may request access to, or correction of, your personal information. If you have concerns about privacy, you can
          contact the business.
        </p>
      </section>
    </LegalPage>
  );
}
