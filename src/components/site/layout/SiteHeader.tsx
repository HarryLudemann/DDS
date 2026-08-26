import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../../utils/firebase";
import { isAdminUser } from "../../../lib/firebase/store";
import { SITE } from "../../../lib/site/constants";
import { cn } from "../../../lib/site/cn";
import { Container } from "../ui/Container";

const NAV = [
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden className="block">
      {open ? (
        <>
          <path d="M5.5 5.5l11 11" stroke="currentColor" strokeWidth="1.25" />
          <path d="M16.5 5.5l-11 11" stroke="currentColor" strokeWidth="1.25" />
        </>
      ) : (
        <>
          <path d="M3.5 8h15" stroke="currentColor" strokeWidth="1.25" />
          <path d="M3.5 14h15" stroke="currentColor" strokeWidth="1.25" />
        </>
      )}
    </svg>
  );
}

export function SiteHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isHome = location.pathname === "/";
  const overHero = isHome && !scrolled && !open;

  useEffect(() => {
    setOpen(false);
    setScrolled(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("site-menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.classList.remove("site-menu-open");
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    let alive = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (alive) setIsAdmin(false);
        return;
      }
      const admin = await isAdminUser(user.uid);
      if (alive) setIsAdmin(admin);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100]",
          overHero
            ? "text-white"
            : "border-b border-[var(--site-line)] bg-[var(--site-bg)] text-[var(--site-ink)]"
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-6 sm:h-[4.5rem] lg:h-20">
            <Link to="/" className="min-w-0" aria-label={`${SITE.shortName} home`}>
              <span className="block text-[15px] font-medium tracking-[0.22em]">DDS</span>
              <span
                className={cn(
                  "mt-0.5 block text-[10px] tracking-[0.2em] uppercase",
                  overHero ? "text-white/75" : "text-[var(--site-muted)]"
                )}
              >
                {SITE.city}
              </span>
            </Link>

            <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "text-[13px] tracking-wide transition-opacity hover:opacity-100",
                      isActive ? "opacity-100" : overHero ? "opacity-90" : "opacity-70"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn("text-[13px] transition-opacity hover:opacity-100", isActive ? "opacity-100" : "opacity-70")
                  }
                >
                  Admin
                </NavLink>
              )}
              <NavLink
                to="/book"
                className={cn(
                  "inline-flex h-10 items-center px-5 text-[13px] font-medium",
                  overHero ? "bg-white text-[var(--site-ink)]" : "bg-[var(--site-ink)] text-white"
                )}
              >
                Book
              </NavLink>
            </nav>

            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuGlyph open={open} />
            </button>
          </div>
        </Container>
      </header>

      {open &&
        createPortal(
          <div
            id="site-menu"
            className="site fixed inset-0 z-[90] flex flex-col bg-[var(--site-bg)] text-[var(--site-ink)] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <nav
              className="flex flex-1 flex-col justify-center px-5 pb-16 pt-24 sm:px-8"
              aria-label="Mobile"
            >
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="py-2.5 font-display text-[2.75rem] leading-[1.05] tracking-tight sm:text-5xl"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/book"
                onClick={() => setOpen(false)}
                className="mt-10 inline-flex h-14 w-full max-w-xs items-center justify-center bg-[var(--site-ink)] text-[13px] font-medium text-white"
              >
                Book a drop-off
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className="mt-8 text-sm text-[var(--site-muted)]">
                  Admin
                </Link>
              )}
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
