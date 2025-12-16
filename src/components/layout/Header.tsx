// components/layout/Header.tsx
import { Link, NavLink } from "react-router-dom";
import { clsx } from "clsx";

const nav = [
  { to: "/services", label: "Services" },
  { to: "/books", label: "Books" },
  { to: "/booking", label: "Book a call" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold">
          Author Name
        </Link>

        <nav className="hidden md:flex gap-8">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                clsx(
                  "text-sm transition",
                  isActive
                    ? "text-text font-medium"
                    : "text-muted hover:text-text"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/admin"
          className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-panel"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
