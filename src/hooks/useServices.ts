import { PACKAGES } from "../catalog/packages";
import { isFirebaseConfigured } from "../utils/firebase";
import { listActiveServices } from "../lib/firebase/store";
import type { Service } from "../types/db";
import { SERVICES_UPDATED_AT_KEY, SERVICES_UPDATED_EVENT } from "../lib/site/live";
import { useEffect, useMemo, useState } from "react";

const CATALOG_DURATION_MINS: Record<string, number> = {
  exterior_refresh: 60,
  interior_refresh: 120,
  full_detail: 240,
  full_interior: 390,
  paint_enhancement: 330,
};

const catalogServices: Service[] = PACKAGES.map((pkg, index) => ({
  id: pkg.code,
  title: pkg.title,
  subtitle: pkg.subtitle,
  summary: pkg.summary,
  description: null,
  includes: pkg.includes,
  ideal_for: pkg.idealFor,
  duration_mins: CATALOG_DURATION_MINS[pkg.code] ?? 90,
  price_cents: pkg.fromPriceCents,
  active: true,
  sort_order: index,
  created_at: new Date(0).toISOString(),
}));

let cachedServices: Service[] | null = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 60_000;

export function invalidateServicesCache() {
  cachedServices = null;
  cachedAtMs = 0;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>(
    () => cachedServices ?? (isFirebaseConfigured ? [] : catalogServices)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isFirebaseConfigured) {
        setServices(catalogServices);
        setLoading(false);
        setError(null);
        return;
      }
      const cacheFresh = cachedServices && Date.now() - cachedAtMs < CACHE_TTL_MS;
      if (!cacheFresh && (cachedServices == null || cachedServices.length === 0)) setLoading(true);
      setError(null);

      try {
        const rows = await listActiveServices();
        if (!alive) return;
        cachedServices = rows;
        cachedAtMs = Date.now();
        setServices(rows);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load services.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SERVICES_UPDATED_AT_KEY) {
        invalidateServicesCache();
        load();
      }
    };
    const onUpdated = () => {
      invalidateServicesCache();
      load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener(SERVICES_UPDATED_EVENT, onUpdated);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SERVICES_UPDATED_EVENT, onUpdated);
    };
  }, []);

  const byId = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  return {
    services,
    loading,
    error,
    getById: (id: string | null | undefined) => {
      if (!id) return null;
      return byId.get(id) ?? null;
    },
  };
}
