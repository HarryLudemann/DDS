import { useEffect, useMemo, useState } from "react";
import { deactivateRulesForDow, listAvailabilityRules, saveAvailabilityRule } from "../../lib/firebase/store";
import { DAY_META, WEEKDAY_ORDER, newestActiveByDow } from "../../lib/site/hours";
import { notifyAvailabilityUpdated } from "../../lib/site/live";
import { todayNZDateKey } from "../../lib/site/bookingTime";
import { AdminBanner, AdminButton, AdminInput } from "./ui";

type DayKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type DayDraft = {
  id?: string;
  enabled: boolean;
  start: string;
  end: string;
};

function timeToDb(t: string) {
  if (!t) return "00:00:00";
  return t.length === 5 ? `${t}:00` : t;
}

function timeFromDb(t: string | null | undefined) {
  if (!t) return "08:00";
  return t.slice(0, 5);
}

const emptyWeek = (): Record<DayKey, DayDraft> => {
  const next = {} as Record<DayKey, DayDraft>;
  for (const dow of WEEKDAY_ORDER) {
    next[dow as DayKey] = { enabled: false, start: "08:00", end: "17:00" };
  }
  return next;
};

export default function HoursPanel() {
  const [draft, setDraft] = useState<Record<DayKey, DayDraft>>(emptyWeek);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const effectiveFrom = useMemo(() => todayNZDateKey(), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rules = await listAvailabilityRules();
        const newest = newestActiveByDow(rules);
        setDraft(() => {
          const next = emptyWeek();
          for (const dow of WEEKDAY_ORDER) {
            const rule = newest.get(dow);
            if (rule) {
              next[dow as DayKey] = {
                id: rule.id,
                enabled: true,
                start: timeFromDb(rule.start_time),
                end: timeFromDb(rule.end_time),
              };
            }
          }
          return next;
        });
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Failed to load hours.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function patchDay(day: DayKey, patch: Partial<DayDraft>) {
    setDraft((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      for (const dow of WEEKDAY_ORDER) {
        const row = draft[dow as DayKey];
        if (row.enabled && row.end <= row.start) {
          throw new Error(`${DAY_META[dow].label}: finish needs to be after start.`);
        }
      }

      for (const dow of WEEKDAY_ORDER) {
        const row = draft[dow as DayKey];
        await deactivateRulesForDow(dow);
        if (!row.enabled) continue;
        const id = await saveAvailabilityRule(row.id, {
          dow,
          start_time: timeToDb(row.start),
          end_time: timeToDb(row.end),
          effective_from: effectiveFrom,
          effective_to: null,
          active: true,
        });
        setDraft((prev) => ({ ...prev, [dow]: { ...prev[dow as DayKey], id } }));
      }

      notifyAvailabilityUpdated();
      setStatus("Saved. Booking, Contact, and the footer now use these hours.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save hours.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {status && <AdminBanner>{status}</AdminBanner>}

      <div className="divide-y divide-[var(--admin-line)] border border-[var(--admin-line)] bg-white">
        {WEEKDAY_ORDER.map((dow) => {
          const row = draft[dow as DayKey];
          const meta = DAY_META[dow];
          return (
            <div key={dow} className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[7.5rem_5.5rem_1fr]">
              <div className="font-medium">{meta.label}</div>
              <button
                type="button"
                onClick={() => patchDay(dow as DayKey, { enabled: !row.enabled })}
                className="h-9 justify-self-start rounded-sm px-3 text-[13px] font-medium text-[var(--admin-muted)] hover:bg-[#f7f6f3] hover:text-[var(--admin-ink)]"
              >
                {row.enabled ? "Open" : "Closed"}
              </button>
              {row.enabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <AdminInput
                    type="time"
                    className="w-[8.5rem]"
                    value={row.start}
                    disabled={loading}
                    onChange={(e) => patchDay(dow as DayKey, { start: e.target.value })}
                    aria-label={`${meta.label} start`}
                  />
                  <span className="text-sm text-[var(--admin-muted)]">to</span>
                  <AdminInput
                    type="time"
                    className="w-[8.5rem]"
                    value={row.end}
                    disabled={loading}
                    onChange={(e) => patchDay(dow as DayKey, { end: e.target.value })}
                    aria-label={`${meta.label} end`}
                  />
                </div>
              ) : (
                <div className="text-sm text-[var(--admin-muted)]">No bookings this day</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <AdminButton onClick={save} disabled={saving || loading}>
          {saving ? "Saving…" : "Save hours"}
        </AdminButton>
      </div>
    </div>
  );
}
