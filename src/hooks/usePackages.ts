import { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase";
import { PACKAGES as DEFAULT_PACKAGES } from "../catalog/packages";

let cachedPackages: PackageDefinition[] | null = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 60_000;
const PACKAGES_UPDATED_AT_KEY = "dds_packages_updated_at";
const PACKAGES_UPDATED_EVENT = "dds_packages_updated";

export type PackageDefinition = {
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  includes: string[];
  idealFor: string[];
  fromPriceCents: number;
  active: boolean;
  serviceId?: string | null;
};

type PackageRow = {
  code: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  includes: unknown;
  ideal_for: unknown;
  from_price_cents: number | null;
  active: boolean | null;
  service_id: string | null;
};

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }
  return [];
}

export function usePackages() {
  const defaultPackages = useMemo(
    () =>
      DEFAULT_PACKAGES.map((p) => ({
        code: p.code,
        title: p.title,
        subtitle: p.subtitle,
        summary: p.summary,
        includes: [...p.includes],
        idealFor: [...p.idealFor],
        fromPriceCents: p.fromPriceCents,
        active: true,
        serviceId: null,
      })) satisfies PackageDefinition[],
    []
  );

  const [packages, setPackages] = useState<PackageDefinition[]>(() => cachedPackages ?? defaultPackages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const cacheFresh = cachedPackages && Date.now() - cachedAtMs < CACHE_TTL_MS;
      if (!cacheFresh && (cachedPackages == null || cachedPackages.length === 0)) setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("packages")
        .select("code,title,subtitle,summary,includes,ideal_for,from_price_cents,active,service_id")
        .order("code", { ascending: true });

      if (!alive) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as PackageRow[];
      const byCode = new Map(rows.map((r) => [r.code, r]));

      const merged = DEFAULT_PACKAGES.map((p) => {
        const row = byCode.get(p.code);
        if (!row) {
          return {
            code: p.code,
            title: p.title,
            subtitle: p.subtitle,
            summary: p.summary,
            includes: [...p.includes],
            idealFor: [...p.idealFor],
            fromPriceCents: p.fromPriceCents,
            active: true,
            serviceId: null,
          } satisfies PackageDefinition;
        }

        return {
          code: p.code,
          title: (row.title ?? p.title).trim(),
          subtitle: (row.subtitle ?? p.subtitle).trim(),
          summary: (row.summary ?? p.summary).trim(),
          includes: toStringArray(row.includes).length ? toStringArray(row.includes) : [...p.includes],
          idealFor: toStringArray(row.ideal_for).length ? toStringArray(row.ideal_for) : [...p.idealFor],
          fromPriceCents:
            typeof row.from_price_cents === "number" && Number.isFinite(row.from_price_cents)
              ? row.from_price_cents
              : p.fromPriceCents,
          active: row.active ?? true,
          serviceId: row.service_id,
        } satisfies PackageDefinition;
      }).filter((x) => x.active);

      cachedPackages = merged;
      cachedAtMs = Date.now();
      setPackages(merged);
      setLoading(false);
    }

    load();

    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PACKAGES_UPDATED_AT_KEY) {
        cachedAtMs = 0;
        cachedPackages = null;
        load();
      }
    };

    const onUpdated = () => {
      cachedAtMs = 0;
      cachedPackages = null;
      load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener(PACKAGES_UPDATED_EVENT, onUpdated as EventListener);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PACKAGES_UPDATED_EVENT, onUpdated as EventListener);
    };
  }, []);

  const byCode = useMemo(() => new Map(packages.map((p) => [p.code, p])), [packages]);

  return {
    packages,
    loading,
    error,
    getByCode: (code: string | null | undefined) => {
      if (!code) return null;
      return byCode.get(code) ?? null;
    },
  };
}
