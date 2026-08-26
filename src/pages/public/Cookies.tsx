import { Link } from "react-router-dom";
import LegalPage from "./LegalLayout";

export default function Cookies() {
  return (
    <LegalPage
      title="Cookies"
      description="How DDS uses on-device storage — no ads, no analytics, only what’s needed to run the site."
      path="/cookies"
    >
      <section>
        <p>
          This site does not run ads or analytics. We don’t sell data, and we don’t drop marketing cookies.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">What stays on your device</h2>
        <p className="mt-3">A small amount of local storage is used so the site can work:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Remembering that you’ve seen this notice.</li>
          <li>Keeping an admin signed in, if they use the studio login.</li>
        </ul>
        <p className="mt-4">That’s it. Nothing here follows you around the web.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--site-ink)]">Your browser</h2>
        <p className="mt-3">
          You can clear stored data anytime in your browser settings. That will show the notice again on the next visit.
          Personal information from bookings is covered in the <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
