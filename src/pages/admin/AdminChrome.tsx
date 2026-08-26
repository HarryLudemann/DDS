import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../utils/firebase";

export function AdminChrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/admin" className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-muted)]">DDS</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Studio admin</h1>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link to="/" className="text-[var(--admin-muted)] hover:text-[var(--admin-ink)]">
            View site
          </Link>
          <button
            type="button"
            className="text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
            onClick={() => auth && signOut(auth).then(() => (window.location.href = "/"))}
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
