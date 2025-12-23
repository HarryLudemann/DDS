import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { clsx } from "../../utils/format";
import { Button } from "../ui/Button";
import { supabase } from "../../utils/supabase";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 min-w-0 overflow-x-clip">
      {children}
    </div>
  );
}

function MenuCard({
  to,
  title,
  subtitle,
  onClick,
}: {
  to: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        "block no-underline rounded-3xl bg-white",
        "ring-1 ring-black/10 shadow-sm",
        "px-5 py-4 transition",
        "hover:bg-slate-50 hover:ring-black/15",
        "active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-extrabold tracking-tight text-slate-900 truncate">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          )}
        </div>
        <div className="shrink-0 h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-extrabold">
          →
        </div>
      </div>
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileCtaVisible, setMobileCtaVisible] = useState(false);
  const [mobileCtaEligible, setMobileCtaEligible] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const [overflowOffenders, setOverflowOffenders] = useState<
    { width: number; tag: string; id: string; className: string }[]
  >([]);

  const debugOverflow = useMemo(
    () => {
      const fromSearch = new URLSearchParams(location.search).get("debugOverflow") === "1";
      if (fromSearch) return true;

      // HashRouter URLs often look like: /#/path?debugOverflow=1
      const hash = window.location.hash || "";
      const qIndex = hash.indexOf("?");
      if (qIndex === -1) return false;
      const qs = hash.slice(qIndex + 1);
      return new URLSearchParams(qs).get("debugOverflow") === "1";
    },
    [location.search]
  );

  const nav = [
    { to: "/services", label: "Packages", sub: "Pricing and inclusions" },
    { to: "/book", label: "Booking", sub: "Pick a day + drop-off window" },
  ];

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (!open) return;
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      width: document.body.style.width,
    };

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.overflow;
      document.body.style.paddingRight = prev.paddingRight;
      document.body.style.width = prev.width;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!("ontouchstart" in window)) return;
    let startX = 0;
    let startY = 0;

    function isTextInputTarget(t: EventTarget | null) {
      const el = t as HTMLElement | null;
      if (!el) return false;

      const editable = el.closest("[contenteditable='true']");
      if (editable) return true;

      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isTextInputTarget(e.target)) return;

      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      // If user is mostly swiping horizontally, cancel to prevent sideways page panning.
      if (Math.abs(dx) > Math.abs(dy) + 6) {
        e.preventDefault();
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  useEffect(() => {
    if (!debugOverflow) return;
    const t = window.setTimeout(() => {
      const vw = document.documentElement.clientWidth;
      const docOverflow = document.documentElement.scrollWidth - vw;
      if (docOverflow <= 1) {
        setOverflowOffenders([]);
        return;
      }
      const offenders = Array.from(document.querySelectorAll("body *"))
        .map((el) => ({ el, w: (el as HTMLElement).scrollWidth }))
        .filter((x) => x.w > vw)
        .sort((a, b) => b.w - a.w)
        .slice(0, 8)
        .map((x) => {
          const el = x.el as HTMLElement;
          return {
            width: x.w,
            tag: el.tagName,
            id: el.id,
            className: el.className,
          };
        });

      if (offenders.length) {
        // eslint-disable-next-line no-console
        console.table(offenders);
      }

      setOverflowOffenders(offenders);
    }, 300);

    return () => window.clearTimeout(t);
  }, [location.pathname, location.search, open]);

  // Admin status
  useEffect(() => {
    let mounted = true;

    async function refreshAdmin(userId?: string) {
      if (!userId) {
        if (mounted) setIsAdmin(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (mounted) setIsAdmin(!!prof?.is_admin);
    }

    (async () => {
      const { data } = await supabase.auth.getSession();
      await refreshAdmin(data.session?.user?.id);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      await refreshAdmin(session?.user?.id);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const showMobileCta =
    !open && !location.pathname.startsWith("/admin") && location.pathname !== "/book";

  useEffect(() => {
    if (!showMobileCta) {
      setMobileCtaEligible(false);
      setMobileCtaVisible(false);
      return;
    }

    const mq = window.matchMedia?.("(max-width: 767px)");
    if (!mq) {
      setMobileCtaEligible(false);
      setMobileCtaVisible(false);
      return;
    }

    const threshold = 96;
    let raf = 0;

    const compute = () => {
      const isMobile = mq.matches;
      if (!isMobile) {
        setMobileCtaEligible(false);
        setMobileCtaVisible(false);
        return;
      }

      const scrollH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      const scrollable = scrollH > winH + 24;
      setMobileCtaEligible(scrollable);

      if (!scrollable) {
        setMobileCtaVisible(false);
        return;
      }

      setMobileCtaVisible(window.scrollY > threshold);
    };

    const onScroll = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(compute);
    };

    const onResize = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    mq.addEventListener?.("change", onResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener?.("change", onResize);
    };
  }, [showMobileCta, location.pathname]);

  useEffect(() => {
    if (!showMobileCta || !mobileCtaEligible) {
      setFooterInView(false);
      return;
    }

    const mq = window.matchMedia?.("(max-width: 767px)");
    if (!mq?.matches) {
      setFooterInView(false);
      return;
    }

    const el = footerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setFooterInView(!!entry?.isIntersecting);
      },
      {
        root: null,
        threshold: 0.01,
        rootMargin: "0px 0px 160px 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [showMobileCta, mobileCtaEligible]);

  return (
    <div className="min-h-[100svh] bg-[#f7f7f8] overflow-x-clip flex flex-col">
      {debugOverflow && overflowOffenders.length > 0 && (
        <div className="fixed bottom-2 left-2 right-2 z-[10000] pointer-events-none">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-black/80 text-white ring-1 ring-white/15 px-4 py-3 text-xs">
              <div className="font-extrabold">Overflow debug (top offender)</div>
              <div className="mt-1 opacity-90">width: {overflowOffenders[0].width}px</div>
              <div className="mt-1 opacity-90">tag: {overflowOffenders[0].tag}</div>
              {overflowOffenders[0].id && (
                <div className="mt-1 opacity-90">id: {overflowOffenders[0].id}</div>
              )}
              {overflowOffenders[0].className && (
                <div className="mt-1 opacity-90 break-words">class: {overflowOffenders[0].className}</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#f7f7f8]/90 backdrop-blur">
        <div className="border-b border-black/5">
          <Container>
            <div className="py-4 flex items-center justify-between gap-3 min-w-0">
              <Link to="/" className="min-w-0">
                <span className="block truncate text-[15px] sm:text-base font-extrabold tracking-tight text-slate-900">
                  Dylan’s <span className="text-indigo-600">Detailing</span> Service
                </span>
                <span className="mt-1 block h-[2px] w-10 rounded-full bg-indigo-600/70 opacity-70" />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-10">
                {nav.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    className={({ isActive }) =>
                      clsx(
                        "text-sm font-semibold transition",
                        isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                      )
                    }
                  >
                    {n.label}
                  </NavLink>
                ))}
              </nav>

              {/* Desktop actions */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/book">
                  <Button>Check availability</Button>
                </Link>

                {isAdmin && (
                  <>
                    <Link to="/admin">
                      <Button variant="secondary">Admin</Button>
                    </Link>
                    <Button variant="ghost" onClick={signOut}>
                      Sign out
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setOpen(true)}
                  className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/5 transition"
                  aria-label="Open menu"
                >
                  Menu
                </button>
              </div>
            </div>
          </Container>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">
        <Container>
          <div
            className={clsx(
              "py-7 sm:py-12 md:py-16 min-w-0",
              showMobileCta && mobileCtaEligible ? "pb-[calc(env(safe-area-inset-bottom)+112px)]" : ""
            )}
          >
            {children}
          </div>
        </Container>
      </main>

      {showMobileCta && mobileCtaEligible && (
        <div
          className={clsx(
            "fixed inset-x-0 bottom-0 z-30 md:hidden",
            "transition duration-300 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
            mobileCtaVisible && !footerInView
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0 pointer-events-none"
          )}
          aria-hidden={!(mobileCtaVisible && !footerInView)}
        >
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#f7f7f8] to-transparent" />
          <div className="bg-[#f7f7f8]/95 backdrop-blur border-t border-black/5 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] px-2 sm:px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="mx-auto max-w-6xl">
              <Link to="/book" className="block no-underline">
                <Button className="w-full py-3 text-base rounded-2xl">Check availability</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer ref={footerRef} className="mt-auto border-t border-black/5 bg-white/50">
        <Container>
          <div className="py-8 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-tight text-slate-900">
                  Dylan’s <span className="text-indigo-600">Detailing</span> Service
                </div>
                <div className="mt-1 text-sm text-slate-500">Wellington • Studio drop-off</div>
              </div>

              <div className="flex flex-col sm:items-end gap-3">
                <div className="flex flex-wrap gap-2">
                  <Link to="/services" className="rounded-xl bg-white/70 ring-1 ring-black/5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                    Packages
                  </Link>
                  <Link to="/book" className="rounded-xl bg-white/70 ring-1 ring-black/5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                    Booking
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="rounded-xl bg-white/70 ring-1 ring-black/5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                      Admin
                    </Link>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  {new Date().getFullYear()} Dylan’s Detailing Service
                </div>
              </div>
            </div>
          </div>
        </Container>
      </footer>

      {/* FULLSCREEN MOBILE MENU (only rendered when open) */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] md:hidden overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop (click to close) */}
          <button
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu backdrop"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div
            className="absolute inset-0 h-[100svh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background polish */}
            <div className="absolute inset-0 bg-[#f7f7f8]" />
            <div className="absolute -top-48 -right-40 h-[420px] w-[420px] rounded-full bg-indigo-200/70 blur-3xl" />
            <div className="absolute -bottom-56 -left-52 h-[420px] w-[420px] rounded-full bg-sky-200/60 blur-3xl" />

            <div className="relative h-full flex flex-col">
              <div className="pt-[env(safe-area-inset-top)]" />

              {/* Top bar */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
                    Dylan’s <span className="text-indigo-600">Detailing</span> Service
                  </div>
                  <div className="text-xs text-slate-500">Wellington</div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/5 transition"
                  aria-label="Close menu"
                >
                  Close
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-6 flex-1 overflow-y-auto">
                <Link to="/book" className="block no-underline">
                  <Button className="w-full py-4 text-base rounded-2xl">
                    Check availability
                  </Button>
                </Link>

                <div className="mt-5 space-y-3">
                  <MenuCard
                    to="/services"
                    title="Packages"
                    subtitle="Pricing and inclusions"
                    onClick={() => setOpen(false)}
                  />
                  <MenuCard
                    to="/book"
                    title="Booking"
                    subtitle="Pick a day + drop-off window"
                    onClick={() => setOpen(false)}
                  />
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-5 border-t border-black/5 space-y-3">
                    <MenuCard
                      to="/admin"
                      title="Admin"
                      subtitle="Manage availability and bookings"
                      onClick={() => setOpen(false)}
                    />

                    <button
                      onClick={async () => {
                        setOpen(false);
                        await signOut();
                      }}
                      className={clsx(
                        "w-full text-left rounded-3xl bg-white",
                        "ring-1 ring-black/10 shadow-sm",
                        "px-5 py-4 transition active:scale-[0.99] hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-base font-extrabold tracking-tight text-slate-900 truncate">
                            Sign out
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            End admin session
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 grid place-items-center font-extrabold text-slate-700">
                          ↩
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                <div className="mt-8 text-xs text-slate-500">
                  © {new Date().getFullYear()} Dylan’s Detailing Service
                </div>

                <div className="pb-[env(safe-area-inset-bottom)]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
