import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "../utils/firebase";
import { listAvailabilityRules } from "../lib/firebase/store";
import type { AvailabilityRule } from "../types/db";
import { AVAILABILITY_UPDATED_AT_KEY, AVAILABILITY_UPDATED_EVENT } from "../lib/site/live";
import { groupHourLines, schemaOpeningHours, weekFromRules } from "../lib/site/hours";

let cachedRules: AvailabilityRule[] | null = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 60_000;

export function invalidateHoursCache() {
  cachedRules = null;
  cachedAtMs = 0;
}

export function useHours() {
  const [rules, setRules] = useState<AvailabilityRule[]>(() => cachedRules ?? []);
  const [loading, setLoading] = useState(() => isFirebaseConfigured && cachedRules == null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isFirebaseConfigured) {
        setRules([]);
        setLoading(false);
        return;
      }

      const fresh = cachedRules && Date.now() - cachedAtMs < CACHE_TTL_MS;
      if (!fresh && cachedRules == null) setLoading(true);

      try {
        const next = await listAvailabilityRules();
        if (!alive) return;
        cachedRules = next;
        cachedAtMs = Date.now();
        setRules(next);
      } catch {
        if (alive && cachedRules == null) setRules([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    const onUpdated = () => {
      cachedAtMs = 0;
      cachedRules = null;
      load();
    };
    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === AVAILABILITY_UPDATED_AT_KEY) onUpdated();
    };

    window.addEventListener(AVAILABILITY_UPDATED_EVENT, onUpdated);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      window.removeEventListener(AVAILABILITY_UPDATED_EVENT, onUpdated);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const week = useMemo(() => weekFromRules(rules), [rules]);
  const lines = useMemo(() => groupHourLines(week), [week]);
  const openingHours = useMemo(() => schemaOpeningHours(week), [week]);
  const anyOpen = week.some((d) => d.open);

  return { week, lines, openingHours, anyOpen, loading };
}
