import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "../../../lib/site/cn";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { SiteCookieConsent } from "./SiteCookieConsent";

export function SiteShell() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="site flex min-h-[100svh] flex-col">
      <a href="#main" className="site-skip">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className={cn("flex-1", !isHome && "pt-16 sm:pt-[4.5rem] lg:pt-20")}>
        <Outlet />
      </main>
      <SiteFooter />
      <SiteCookieConsent />
    </div>
  );
}
