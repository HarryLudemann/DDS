import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { clsx } from "../../utils/format";
import { Button } from "../ui/Button";
import { supabase } from "../../utils/supabase";
import type { Session } from "@supabase/supabase-js";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4">{children}</div>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [_session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const nav = [
    { to: "/services", label: "Services" },
    { to: "/book", label: "Book" },
  ];

  // Prevent background scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);

      if (data.session?.user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.session.user.id)
          .maybeSingle();
        if (!mounted) return;
        setIsAdmin(!!prof?.is_admin);
      } else {
        setIsAdmin(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      if (!mounted) return;
      setSession(s ?? null);

      if (s?.user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", s.user.id)
          .maybeSingle();
        if (!mounted) return;
        setIsAdmin(!!prof?.is_admin);
      } else {
        setIsAdmin(false);
      }
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
    <div className="min-h-dvh bg-[#f7f7f8]">
      <header className="sticky top-0 z-40 bg-[#f7f7f8]/90 backdrop-blur">
        <div className="shadow-sm">
          <Container>
            <div className="py-4 flex items-center justify-between gap-4">
              {/* Brand */}
              <Link to="/" className="group relative">
                <span className="block text-[15px] sm:text-base font-extrabold tracking-tight text-slate-900">
                  Dylan’s <span className="text-indigo-600">Detailing</span> Service
                </span>
                <span className="mt-1 block h-[2px] w-10 rounded-full bg-indigo-600/70 opacity-70 transition group-hover:w-16" />
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

              {/* Mobile: NO Book button here */}
              <div className="md:hidden">
                <button
                  onClick={() => setOpen(true)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/5 transition"
                  aria-label="Open menu"
                >
                  Menu
                </button>
              </div>
            </div>
          </Container>

          {/* Mobile menu overlay */}
          {open && (
            <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
              <div
                className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-soft ring-1 ring-black/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900">
                    Menu
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/5"
                    aria-label="Close menu"
                  >
                    Close
                  </button>
                </div>

                <div className="px-4 pb-4 space-y-3">
                  {/* Primary CTA */}
                  <Link to="/book" onClick={() => setOpen(false)} className="block">
                    <Button className="w-full py-3 text-base">Book Online</Button>
                  </Link>

                  {/* Links */}
                  <div className="space-y-2">
                    {nav.map((n) => (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setOpen(false)}
                        className="block rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5 text-sm font-semibold text-slate-900"
                      >
                        {n.label}
                      </Link>
                    ))}
                  </div>

                  {/* Admin-only */}
                  {isAdmin && (
                    <div className="pt-2 space-y-2">
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="block rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 text-sm font-semibold text-slate-900"
                      >
                        Admin
                      </Link>
                      <button
                        onClick={() => {
                          setOpen(false);
                          signOut();
                        }}
                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-black/5"
                      >
                        Sign out
                      </button>
                    </div>
                  )}

                  <div className="pt-3 text-xs text-slate-500">
                    Wellington · Studio detailing
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <Container>
          <div className="py-10 sm:py-12 md:py-16">{children}</div>
        </Container>
      </main>

      <footer className="py-10 text-sm text-slate-500">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>© {new Date().getFullYear()} Dylan’s Detailing Service</div>
            <div>Wellington · Online booking</div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
