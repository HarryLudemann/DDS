import { Link } from "react-router-dom";
import { SITE } from "../../../lib/site/constants";
import { Container } from "../ui/Container";
import { StudioHours } from "../HoursList";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--site-line)] bg-[var(--site-bg)]">
      <Container>
        <div className="grid gap-14 py-16 md:grid-cols-12 md:gap-8 md:py-20">
          <div className="md:col-span-5">
            <div className="font-display text-[2.25rem] leading-none tracking-[0.08em]">DDS</div>
            <p className="mt-3 text-sm text-[var(--site-muted)]">
              {SITE.city} · {SITE.format}
            </p>
            <Link
              to="/book"
              className="mt-8 inline-flex h-11 items-center bg-[var(--site-ink)] px-5 text-[13px] font-medium text-white"
            >
              Book a drop-off
            </Link>
          </div>

          <div className="md:col-span-3">
            <p className="site-chip">Hours</p>
            <div className="mt-4">
              <StudioHours compact />
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm md:col-span-4" aria-label="Footer">
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/services">
              Services
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/contact">
              Contact
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/gallery">
              Gallery
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/privacy">
              Privacy
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/about">
              About
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/cookies">
              Cookies
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/book">
              Book
            </Link>
            <Link className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]" to="/terms">
              Terms
            </Link>
          </nav>
        </div>

        <div className="border-t border-[var(--site-line)] py-6 text-xs text-[var(--site-muted)]">
          © {new Date().getFullYear()} {SITE.shortName}
        </div>
      </Container>
    </footer>
  );
}
