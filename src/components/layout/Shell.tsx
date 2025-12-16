import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { clsx } from "../../utils/format";
import { Button } from "../ui/Button";
import { supabase } from "../../utils/supabase";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4">{children}</div>;
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
        "block rounded-3xl bg-white",
        "ring-1 ring-black/10 shadow-sm",
        "px-5 py-4 transition",
        "active:scale-[0.99] hover:bg-slate-50"
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
  const location = useLocation();

  const nav = [
    { to: "/services", label: "Services", sub: "Packages, duration and pricing" },
    { to: "/book", label: "Book", sub: "Choose a service and pick a time" },
  ];

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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

  return (
    <div className="min-h-dvh bg-[#f7f7f8] overflow-x-hidden">
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
                  <Button>Book Online</Button>
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
      <main>
        <Container>
          <div className="py-10 sm:py-12 md:py-16 min-w-0">{children}</div>
        </Container>
      </main>

      {/* FOOTER */}
      <footer className="py-10 text-sm text-slate-500">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>© {new Date().getFullYear()} Dylan’s Detailing Service</div>
            <div>Wellington · Online booking</div>
          </div>
        </Container>
      </footer>

      {/* ✅ FULLSCREEN MOBILE MENU (only rendered when open) */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] md:hidden"
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
            className="absolute inset-0 h-[100dvh] w-full"
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
                  <div className="text-xs text-slate-500">Wellington · Studio detailing</div>
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
                <Link to="/book" className="block">
                  <Button className="w-full py-4 text-base rounded-2xl">
                    Book Online
                  </Button>
                </Link>

                <div className="mt-5 space-y-3">
                  <MenuCard
                    to="/services"
                    title="Services"
                    subtitle="Packages, duration and pricing"
                    onClick={() => setOpen(false)}
                  />
                  <MenuCard
                    to="/book"
                    title="Booking"
                    subtitle="Pick a service and select an available time"
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
