import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "../utils/format";
import { Button } from "./ui/Button";

const KEY = "dds_cookie_consent";

export function CookieConsent({ offsetBottomPx = 0 }: { offsetBottomPx?: number }) {
  const location = useLocation();
  const [choice, setChoice] = useState<string | null>(null);

  const isAdminRoute = useMemo(() => location.pathname.startsWith("/admin"), [location.pathname]);

  useEffect(() => {
    try {
      setChoice(window.localStorage.getItem(KEY));
    } catch {
      setChoice("accepted");
    }
  }, []);

  if (isAdminRoute) return null;
  if (choice === "accepted" || choice === "declined") return null;

  function save(v: "accepted" | "declined") {
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
    }
    setChoice(v);
  }

  return (
    <div
      className={clsx(
        "fixed inset-x-0 z-[60]",
        "px-2 sm:px-4",
        "transition-opacity"
      )}
      style={{ bottom: `calc(env(safe-area-inset-bottom) + ${offsetBottomPx}px + 12px)` }}
      role="region"
      aria-label="Cookie consent"
    >
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] ring-1 ring-black/10 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900">Cookies</div>
              <div className="mt-1 text-sm text-slate-600">
                We use essential cookies/storage to run this site and remember your preferences. See our{" "}
                <Link to="/cookies" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
                  Cookie Policy
                </Link>
                .
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
              <Button variant="secondary" onClick={() => save("declined")} className="rounded-2xl px-5 py-2.5">
                Decline
              </Button>
              <Button onClick={() => save("accepted")} className="rounded-2xl px-5 py-2.5">
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
