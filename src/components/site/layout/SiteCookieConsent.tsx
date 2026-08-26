import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SiteButton } from "../ui/Button";
import { Container } from "../ui/Container";

const KEY = "dds_cookie_consent";

function readConsent() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return "accepted";
  }
}

export function SiteCookieConsent() {
  const location = useLocation();
  const [choice, setChoice] = useState<string | null>(() => readConsent());
  const visible = choice !== "accepted" && choice !== "declined" && location.pathname !== "/book";

  useEffect(() => {
    document.documentElement.classList.toggle("site-cookie-open", visible);
    return () => document.documentElement.classList.remove("site-cookie-open");
  }, [visible]);

  if (!visible) return null;

  function save() {
    try {
      window.localStorage.setItem(KEY, "accepted");
    } catch {
      /* ignore */
    }
    setChoice("accepted");
  }

  return (
    <div
      className="site-cookie fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:px-8"
      role="region"
      aria-label="Site notice"
    >
      <Container>
        <div className="border border-[var(--site-line)] bg-[var(--site-bg)] px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <p className="max-w-xl text-[13px] leading-relaxed text-[var(--site-muted)]">
              No ads, no tracking. We only keep what’s needed to run the site.{" "}
              <Link to="/cookies" className="text-[var(--site-ink)] underline underline-offset-4">
                Details
              </Link>
            </p>
            <SiteButton onClick={save}>OK</SiteButton>
          </div>
        </div>
      </Container>
    </div>
  );
}
