import { Link, NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { clsx } from "../../utils/format";
import { Button } from "../../components/ui/Button";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh]">
      <header className="border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted hover:text-text">← Back to site</Link>
          <div className="text-sm font-semibold">Admin</div>
          <Button
            variant="secondary"
            onClick={() => auth && signOut(auth).then(() => (window.location.href = "/"))}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-border bg-surface p-4 h-fit">
          <div className="text-xs text-muted mb-3">Navigation</div>
          <nav className="flex lg:flex-col gap-2">
            {[
              { to: "/admin", label: "Overview" },
              { to: "/admin/availability", label: "Availability" },
              { to: "/admin/bookings", label: "Bookings" },
            ].map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  clsx(
                    "rounded-xl px-3 py-2 text-sm border border-transparent",
                    isActive
                      ? "bg-white/5 border-border text-text"
                      : "text-muted hover:text-text hover:bg-white/5"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
