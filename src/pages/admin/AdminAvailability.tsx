
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import type { AvailabilityRule } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

type DayKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 0, label: "Sunday", short: "Sun" },
  { key: 1, label: "Monday", short: "Mon" },
  { key: 2, label: "Tuesday", short: "Tue" },
  { key: 3, label: "Wednesday", short: "Wed" },
  { key: 4, label: "Thursday", short: "Thu" },
  { key: 5, label: "Friday", short: "Fri" },
  { key: 6, label: "Saturday", short: "Sat" },
];

function todayNZDate(): string {
  // date-only string, safe for DB date column
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function timeToDb(t: string): string {
  // input type="time" returns "HH:MM" usually -> store "HH:MM:00"
  if (!t) return "00:00:00";
  return t.length === 5 ? `${t}:00` : t;
}

function timeFromDb(t: string | null | undefined): string {
  // "HH:MM:SS" -> "HH:MM"
  if (!t) return "";
  return t.slice(0, 5);
}

type DayDraft = {
  id?: string;
  enabled: boolean;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export default function AdminAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [draft, setDraft] = useState<Record<DayKey, DayDraft>>(() => {
    const base: Record<DayKey, DayDraft> = {
      0: { enabled: false, start: "08:00", end: "17:00" },
      1: { enabled: false, start: "08:00", end: "17:00" },
      2: { enabled: false, start: "08:00", end: "17:00" },
      3: { enabled: false, start: "08:00", end: "17:00" },
      4: { enabled: false, start: "08:00", end: "17:00" },
      5: { enabled: false, start: "08:00", end: "17:00" },
      6: { enabled: false, start: "08:00", end: "17:00" },
    };
    return base;
  });

  const effectiveFrom = useMemo(() => todayNZDate(), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setStatus(null);

      const { data, error } = await supabase
        .from("availability_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }

      // Pick the newest ACTIVE rule per day
      const newestByDow = new Map<number, AvailabilityRule>();
      for (const r of data ?? []) {
        if (!r.active) continue;
        if (!newestByDow.has(r.dow)) newestByDow.set(r.dow, r as AvailabilityRule);
      }

      setDraft((prev) => {
        const next = { ...prev };
        for (const d of DAYS) {
          const r = newestByDow.get(d.key);
          if (r) {
            next[d.key] = {
              id: r.id,
              enabled: true,
              start: timeFromDb(r.start_time),
              end: timeFromDb(r.end_time),
            };
          }
        }
        return next;
      });

      setLoading(false);
    })();
  }, []);

  function setAll(days: DayKey[], enabled: boolean, start?: string, end?: string) {
    setDraft((prev) => {
      const next = { ...prev };
      for (const day of days) {
        next[day] = {
          ...next[day],
          enabled,
          start: start ?? next[day].start,
          end: end ?? next[day].end,
        };
      }
      return next;
    });
  }

  function copyDay(from: DayKey, to: DayKey[]) {
    setDraft((prev) => {
      const next = { ...prev };
      for (const day of to) {
        next[day] = {
          ...next[day],
          enabled: prev[from].enabled,
          start: prev[from].start,
          end: prev[from].end,
        };
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setStatus(null);

    try {
      // Validate first
      for (const d of DAYS) {
        const row = draft[d.key];
        if (!row.enabled) continue;
        if (!row.start || !row.end) {
          throw new Error(`Please set start/end times for ${d.label}.`);
        }
        if (row.end <= row.start) {
          throw new Error(`${d.label}: end time must be after start time.`);
        }
      }

      // Save day-by-day (simple + reliable)
      for (const d of DAYS) {
        const row = draft[d.key];

        if (!row.enabled) {
          // IMPORTANT: deactivate *all* active rules for this weekday.
          // Otherwise older active rows can remain and still be used by the booking RPC.
          const { error } = await supabase
            .from("availability_rules")
            .update({ active: false })
            .eq("dow", d.key)
            .eq("active", true);
          if (error) throw error;
          continue;
        }

        const payload = {
          dow: d.key,
          start_time: timeToDb(row.start),
          end_time: timeToDb(row.end),
          effective_from: effectiveFrom,
          effective_to: null as string | null,
          active: true,
        };

        if (row.id) {
          // Update existing latest rule
          const { error } = await supabase
            .from("availability_rules")
            .update(payload)
            .eq("id", row.id);
          if (error) throw error;

          // Ensure no other active rows exist for this weekday
          const { error: deactivateOthers } = await supabase
            .from("availability_rules")
            .update({ active: false })
            .eq("dow", d.key)
            .neq("id", row.id)
            .eq("active", true);
          if (deactivateOthers) throw deactivateOthers;
        } else {
          // Ensure a clean slate: only one active rule per weekday
          const { error: deactivateExisting } = await supabase
            .from("availability_rules")
            .update({ active: false })
            .eq("dow", d.key)
            .eq("active", true);
          if (deactivateExisting) throw deactivateExisting;

          // Insert new rule
          const { data: inserted, error } = await supabase
            .from("availability_rules")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;

          setDraft((prev) => ({
            ...prev,
            [d.key]: { ...prev[d.key], id: inserted.id },
          }));
        }
      }

      setStatus("Saved. Booking availability will update automatically.");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Availability</h1>
          <p className="mt-1 text-sm text-slate-600">
            Set weekly working hours. Customers will only see times that fit the service duration.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {status && (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 px-4 py-3 text-sm text-slate-700">
          {status}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setAll([1, 2, 3, 4, 5], true, "08:00", "17:00")}>
            Weekdays 8–5
          </Button>
          <Button variant="secondary" onClick={() => setAll([6, 0], true, "08:00", "17:00")}>
            Weekend 8–5
          </Button>
          <Button variant="ghost" onClick={() => setAll([0, 1, 2, 3, 4, 5, 6], false)}>
            Close all days
          </Button>

          <div className="ml-auto">
            <Button onClick={save} disabled={saving || loading}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="divide-y divide-black/5 rounded-2xl ring-1 ring-black/5 overflow-hidden bg-white">
          {DAYS.map((d) => {
            const row = draft[d.key];
            return (
              <div key={d.key} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 shrink-0 text-sm font-extrabold text-slate-900">{d.short}</div>

                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [d.key]: { ...prev[d.key], enabled: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-black/20"
                      />
                      Open
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={row.start}
                        disabled={!row.enabled}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [d.key]: { ...prev[d.key], start: e.target.value },
                          }))
                        }
                        className="rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-black/10 disabled:opacity-40"
                      />
                      <span className="text-sm text-slate-500">to</span>
                      <input
                        type="time"
                        value={row.end}
                        disabled={!row.enabled}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [d.key]: { ...prev[d.key], end: e.target.value },
                          }))
                        }
                        className="rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-black/10 disabled:opacity-40"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      disabled={loading}
                      onClick={() => copyDay(d.key, DAYS.filter((x) => x.key !== d.key).map((x) => x.key))}
                    >
                      Copy to all
                    </Button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {row.enabled
                    ? `Customers can book within ${row.start}–${row.end} on ${d.label}.`
                    : `${d.label} is closed.`}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="text-xs text-slate-500">
        Tip: if a service is 2 hours long, only start times that fit within your hours will show.
      </div>
    </div>
  );
}

