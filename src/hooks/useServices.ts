import { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase";
import type { Service } from "../types/db";

let cachedServices: Service[] | null = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 60_000;
const SERVICES_UPDATED_AT_KEY = "dds_services_updated_at";
const SERVICES_UPDATED_EVENT = "dds_services_updated";

export function useServices() {
  const [services, setServices] = useState<Service[]>(() => cachedServices ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const cacheFresh = cachedServices && Date.now() - cachedAtMs < CACHE_TTL_MS;
      if (!cacheFresh && (cachedServices == null || cachedServices.length === 0)) setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });

      if (!alive) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as Service[];
      cachedServices = rows;
      cachedAtMs = Date.now();
      setServices(rows);
      setLoading(false);
    }

    load();

    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SERVICES_UPDATED_AT_KEY) {
        cachedAtMs = 0;
        cachedServices = null;
        load();
      }
    };

    const onUpdated = () => {
      cachedAtMs = 0;
      cachedServices = null;
      load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener(SERVICES_UPDATED_EVENT, onUpdated as EventListener);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SERVICES_UPDATED_EVENT, onUpdated as EventListener);
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

