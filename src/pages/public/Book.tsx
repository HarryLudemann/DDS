import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { fmtMoney, fmtTimeNZ, NZ_TZ } from "../../utils/format";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Pill } from "../../components/ui/Pill";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { useServices } from "../../hooks/useServices";
import { amountsForCustomerPrice, GST_RATE, TAX_MODE, taxLabelShort } from "../../utils/tax";

const WINDOWS = [
  { key: "early", label: "Early (8–10am)", startMins: 8 * 60, endMins: 10 * 60 },
  { key: "mid", label: "Mid (10am–12pm)", startMins: 10 * 60, endMins: 12 * 60 },
  { key: "arvo", label: "Afternoon (12–3pm)", startMins: 12 * 60, endMins: 15 * 60 },
  { key: "late", label: "Late (3–5pm)", startMins: 15 * 60, endMins: 17 * 60 },
  { key: "any", label: "Any time", startMins: 0, endMins: 24 * 60 },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

type Step = 1 | 2 | 3 | 4;

const AVAILABILITY_CACHE_TTL_MS = 60_000;
const AVAILABILITY_REQUEST_TIMEOUT_MS = 15_000;
const availabilityCache = new Map<string, { at: number; times: string[] }>();
const availabilityInFlight = new Map<
  string,
  Promise<{ times: string[]; error: { message: string } | null }>
>();

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isoToNZDateKey(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TZ }).format(d); // YYYY-MM-DD
}

function isoToNZMinutesSinceMidnight(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function toISODateNZ(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TZ }).format(d); // YYYY-MM-DD
}

/**
 * Get the current date in NZ timezone as a date key (YYYY-MM-DD)
 */
function todayNZDateKey(): string {
  return toISODateNZ(new Date());
}

/**
 * Get tomorrow's date in NZ timezone as a date key (YYYY-MM-DD)
 * This properly handles timezone conversions by working entirely in NZ timezone
 * by manually adding 1 day to avoid timezone conversion issues
 */
function tomorrowNZDateKey(): string {
  // Get today's date in NZ timezone as YYYY-MM-DD
  const todayStr = todayNZDateKey();
  const [y, m, d] = todayStr.split("-").map(Number);
  
  // Manually add 1 day, handling month/year boundaries
  // This avoids timezone conversion issues entirely
  const daysInMonth = new Date(y, m, 0).getDate(); // Get days in current month
  let nextYear = y;
  let nextMonth = m;
  let nextDay = d + 1;
  
  if (nextDay > daysInMonth) {
    nextDay = 1;
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
  }
  
  // Format as YYYY-MM-DD (zero-padded)
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

function addMinutesIso(iso: string, mins: number): string | null {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return new Date(d.getTime() + mins * 60_000).toISOString();
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/**
 * Make labels from dateKey itself (not from arbitrary slot time),
 * and keep ordering stable and human-friendly.
 * 
 * The dateKey is a YYYY-MM-DD string representing a date in NZ timezone.
 * We create a Date at midnight UTC for the date components, which represents
 * noon/early afternoon on that same date in NZ (UTC+12/13), ensuring the
 * weekday calculation is correct.
 */
function labelForDateKeyNZ(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  
  // Create date at midnight UTC for the date components
  // This represents 12:00-13:00 on that same date in NZ (UTC+12/13)
  // Using midnight UTC avoids DST edge cases and ensures correct weekday
  const dateForFormatting = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0));
  
  // Format in NZ timezone to get the correct weekday and date display
  const day = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    weekday: "short",
  }).format(dateForFormatting);

  const rest = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    day: "2-digit",
    month: "short",
  }).format(dateForFormatting);

  // Today/Tomorrow tag - use NZ timezone functions to ensure correct calculation
  const nowKey = todayNZDateKey();
  const tomorrowKey = tomorrowNZDateKey();
  const tag = dateKey === nowKey ? "Today" : dateKey === tomorrowKey ? "Tomorrow" : "";

  return tag ? `${tag} · ${day} ${rest}` : `${day} ${rest}`;
}

export default function Book() {
  const [searchParams] = useSearchParams();
  const debug = searchParams.get("debug") === "1";

  const { services, getById, loading: loadingServices } = useServices();

  const [times, setTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timesNonce, setTimesNonce] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);

  const lastServiceIdRef = useRef<string>("");

  // Booking selections
  const [serviceId, setServiceId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState("");
  const [windowKey, setWindowKey] = useState<WindowKey | "">("");
  const [startAt, setStartAt] = useState("");

  // Wizard steps
  const [step, setStep] = useState<Step>(1);

  // Details (required + optional)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleSize, setVehicleSize] = useState("");
  const [notes, setNotes] = useState("");

  // UI feedback
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showExactTimes, setShowExactTimes] = useState(false);

  const dateRailRef = useRef<HTMLDivElement | null>(null);

  const selectedService = useMemo(() => getById(serviceId), [getById, serviceId]);

  // Preselect service
  useEffect(() => {
    const preselect = searchParams.get("service");
    if (preselect) {
      setServiceId(preselect);
    }
  }, [searchParams]);

  // When a service is chosen on step 1, move forward automatically.
  useEffect(() => {
    if (!selectedService) return;
    setStep((s) => (s === 1 ? 2 : s));
  }, [selectedService]);

  // Fetch availability
  useEffect(() => {
    if (!serviceId) {
      setTimes([]);
      setSelectedDay("");
      setWindowKey("");
      setStartAt("");
      setLoadingTimes(false);
      setAvailabilityStatus(null);
      return;
    }

    // When service changes, reset dependent selections once.
    if (lastServiceIdRef.current !== serviceId) {
      lastServiceIdRef.current = serviceId;
      setTimes([]);
      setSelectedDay("");
      setWindowKey("");
      setStartAt("");
      setStatus(null);
      setStatusTone(null);
      setAvailabilityStatus(null);
      setLoadingTimes(false);
    }

    const cached = availabilityCache.get(serviceId);
    const cacheFresh = cached && Date.now() - cached.at < AVAILABILITY_CACHE_TTL_MS;
    const cachedTimes = cached?.times ?? [];
    const hasCached = cachedTimes.length > 0;
    if (hasCached) setTimes(cachedTimes);

    // If we already have fresh cached availability and we're not explicitly refreshing,
    // don't refetch (keeps the UI snappy when navigating back/forth).
    if (cacheFresh && hasCached && timesNonce === 0 && !debug) {
      setLoadingTimes(false);
      return;
    }

    let cancelled = false;

    (async () => {
      // Only show a blocking spinner if we don't already have something to show.
      if (!hasCached) setLoadingTimes(true);
      setAvailabilityStatus(null);

      // Use NZ timezone for date calculations to ensure consistency
      const fromNZ = todayNZDateKey();
      // Calculate "to" date by manually adding 22 days to today's date in NZ timezone
      // This avoids timezone conversion issues
      const [y, m, d] = fromNZ.split("-").map(Number);
      let toYear = y;
      let toMonth = m;
      let toDay = d + 22;
      
      // Handle month/year rollover
      while (toDay > new Date(toYear, toMonth, 0).getDate()) {
        toDay -= new Date(toYear, toMonth, 0).getDate();
        toMonth += 1;
        if (toMonth > 12) {
          toMonth = 1;
          toYear += 1;
        }
      }
      
      const toNZ = `${toYear}-${String(toMonth).padStart(2, "0")}-${String(toDay).padStart(2, "0")}`;

      try {
        let promise = availabilityInFlight.get(serviceId);
        if (!promise) {
          promise = (async () => {
            const rpcPromise = (async () => {
              const { data, error } = await supabase.rpc("get_available_starts", {
                p_service_id: serviceId,
                p_from: fromNZ,
                p_to: toNZ,
                p_step_mins: 15,
              });

              if (error) return { times: [], error: { message: error.message } };
              const nextTimes = (data ?? []).map((r: any) => r.start_at);
              return { times: nextTimes, error: null };
            })();

            const timeoutPromise = new Promise<{ times: string[]; error: { message: string } }>((resolve) => {
              window.setTimeout(() => {
                resolve({
                  times: [],
                  error: { message: "Availability is taking too long to load. Please try again." },
                });
              }, AVAILABILITY_REQUEST_TIMEOUT_MS);
            });

            return await Promise.race([rpcPromise, timeoutPromise]);
          })().finally(() => {
            availabilityInFlight.delete(serviceId);
          });

          availabilityInFlight.set(serviceId, promise);
        }

        const { times: nextTimes, error } = await promise;
        if (cancelled) return;

        if (error) {
          setAvailabilityStatus(error.message);
          if (!hasCached) setTimes([]);
          return;
        }

        availabilityCache.set(serviceId, { at: Date.now(), times: nextTimes });
        setTimes(nextTimes);
      } catch (e: any) {
        if (cancelled) return;
        setAvailabilityStatus(e?.message ?? "Availability failed to load. Please try again.");
        if (!hasCached) setTimes([]);
      } finally {
        if (!cancelled) setLoadingTimes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serviceId, timesNonce, debug]);

  // Auto-refresh availability without requiring buttons.
  useEffect(() => {
    if (!serviceId) return;

    const onFocus = () => setTimesNonce((x) => x + 1);
    const onVisibility = () => {
      if (document.visibilityState === "visible") setTimesNonce((x) => x + 1);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const t = window.setInterval(() => setTimesNonce((x) => x + 1), 120_000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(t);
    };
  }, [serviceId]);

  // Group + label from dateKey (stable ordering)
  const grouped = useMemo(() => {
    const map = new Map<string, { dateKey: string; times: string[] }>();

    for (const t of times) {
      const dateKey = isoToNZDateKey(t);
      if (!dateKey) continue;

      const g = map.get(dateKey) ?? { dateKey, times: [] };
      g.times.push(t);
      map.set(dateKey, g);
    }

    const arr = [...map.values()]
      .map((g) => ({
        dateKey: g.dateKey,
        label: labelForDateKeyNZ(g.dateKey),
        times: g.times,
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return arr;
  }, [times]);

  // Auto-select the earliest day when availability loads (reduces clicks)
  useEffect(() => {
    if (!selectedDay && grouped.length > 0 && grouped[0]) {
      setSelectedDay(grouped[0].dateKey);
    }
  }, [grouped, selectedDay]);

  // If selection becomes invalid after an auto-refresh, snap to the earliest available.
  useEffect(() => {
    if (!selectedDay) return;
    if (grouped.length === 0) return;
    if (grouped.some((g) => g.dateKey === selectedDay)) return;
    const firstDay = grouped[0];
    if (firstDay) {
      setSelectedDay(firstDay.dateKey);
    }
  }, [grouped, selectedDay]);

  const activeDay = useMemo(() => {
    if (!selectedDay) return null;
    return grouped.find((g) => g.dateKey === selectedDay) ?? null;
  }, [grouped, selectedDay]);

  const windowsForActiveDay = useMemo(() => {
    if (!activeDay) return [];
    return WINDOWS.map((w) => {
      const hasAny = activeDay.times.some((t) => {
        const mins = isoToNZMinutesSinceMidnight(t);
        if (mins == null) return false;
        return mins >= w.startMins && mins < w.endMins;
      });
      return { ...w, hasAny };
    });
  }, [activeDay]);

  const timesForSelectedWindow = useMemo(() => {
    if (!activeDay || !windowKey) return [];
    const w = WINDOWS.find((x) => x.key === windowKey);
    if (!w) return [];

    return activeDay.times
      .filter((t) => {
        const mins = isoToNZMinutesSinceMidnight(t);
        if (mins == null) return false;
        return mins >= w.startMins && mins < w.endMins;
      })
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [activeDay, windowKey]);

  // When a day is selected, default to first window that has times (reduces scroll/clicks)
  useEffect(() => {
    if (!activeDay) return;
    if (windowKey) return;

    const first = windowsForActiveDay.find((w) => w.hasAny && w.key !== "any");
    if (first) setWindowKey(first.key);
    else {
      const any = windowsForActiveDay.find((w) => w.hasAny && w.key === "any");
      if (any) setWindowKey(any.key);
    }
  }, [activeDay, windowsForActiveDay, windowKey]);

  // Hide the exact-time picker when changing day/window (keeps the default flow simple)
  useEffect(() => {
    setShowExactTimes(false);
  }, [selectedDay, windowKey]);

  // When window changes, preselect the earliest time in that window
  useEffect(() => {
    if (!windowKey) return;
    if (timesForSelectedWindow.length === 0) {
      setStartAt("");
      return;
    }
    const firstTime = timesForSelectedWindow[0];
    if (!firstTime) {
      setStartAt("");
      return;
    }
    setStartAt((prev) => (prev && timesForSelectedWindow.includes(prev) ? prev : firstTime));
  }, [windowKey, timesForSelectedWindow]);

  const emailOk = email.trim() ? isValidEmail(email) : false;

  const selectedWindowLabel = useMemo(() => {
    if (!windowKey) return "";
    return (WINDOWS.find((w) => w.key === windowKey)?.label ?? "").trim();
  }, [windowKey]);

  const whenSummary = useMemo(() => {
    if (!startAt) return "Choose a day + window";
    const dateKey = isoToNZDateKey(startAt);
    if (!dateKey) return "Choose a day + window";
    return `${labelForDateKeyNZ(dateKey)} · ${
      selectedWindowLabel ? selectedWindowLabel : "Any time"
    }${showExactTimes ? ` · ${fmtTimeNZ(startAt)}` : " · Earliest available"}`;
  }, [startAt, selectedWindowLabel, showExactTimes]);

  const canSubmit =
    !!serviceId &&
    !!startAt &&
    name.trim().length >= 2 &&
    emailOk &&
    !!vehicleSize &&
    statusTone !== "success" &&
    !submitting;

  const canGoNext = useMemo(() => {
    if (step === 1) return !!selectedService;
    if (step === 2) return !!serviceId && !!startAt;
    if (step === 3) return name.trim().length >= 2 && emailOk && !!vehicleSize;
    return false;
  }, [step, selectedService, serviceId, startAt, name, emailOk, vehicleSize]);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Choose a service";
      case 2:
        return "Choose a day + window";
      case 3:
        return "Your details";
      case 4:
        return "Review";
    }
  }, [step]);

  const stepHint = useMemo(() => {
    switch (step) {
      case 1:
        return "Pick the service you want — you can change it later.";
      case 2:
        return "Choose a day and a drop-off window. We’ll reserve the earliest slot that fits.";
      case 3:
        return "Just the essentials so Dylan can confirm your booking.";
      case 4:
        return "Double-check everything, then send your request.";
    }
  }, [step]);

  function goNext() {
    if (!canGoNext) return;
    setStatus(null);
    setStatusTone(null);
    setStep((s) => (s === 4 ? 4 : ((s + 1) as Step)));
  }

  function goBack() {
    setStatus(null);
    setStatusTone(null);
    setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));
  }

  function goTo(nextStep: Step) {
    setStatus(null);
    setStatusTone(null);
    setStep(nextStep);
  }

  useEffect(() => {
    if (!dateRailRef.current) return;
    if (!selectedDay) return;
    const btn = dateRailRef.current.querySelector<HTMLButtonElement>(`button[data-day='${selectedDay}']`);
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selectedDay]);

  useEffect(() => {
    const isMobile = window.matchMedia?.("(max-width: 767px)")?.matches;
    if (!isMobile) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  async function submit() {
    setStatus(null);
    setStatusTone(null);

    if (!canSubmit) {
      setStatusTone("error");
      if (!selectedService) return setStatus("Choose a service first.");
      if (!startAt) return setStatus("Choose a day and drop-off window.");
      if (!name.trim()) return setStatus("Please enter your name.");
      if (!email.trim()) return setStatus("Please enter your email.");
      if (!emailOk) return setStatus("That email doesn't look right — please check it.");
      if (!vehicleSize) return setStatus("Please select your vehicle size.");
      return setStatus("Please complete the required fields.");
    }

    if (!selectedService) {
      setStatusTone("error");
      setStatus("Please select a service.");
      return;
    }

    const durationMins = selectedService.duration_mins;

    const endAt = addMinutesIso(startAt, durationMins);
    if (!endAt) {
      setStatusTone("error");
      setStatus("Selected time is invalid. Please choose another time.");
      return;
    }

    const windowLabel = (WINDOWS.find((w) => w.key === windowKey)?.label ?? "").trim();
    const vehicleSummary = vehicleSize.trim() || null;
    const meta = windowLabel && windowKey !== "any" ? `Preferred drop-off window: ${windowLabel}` : "";
    const combinedNotes = [meta, notes.trim()].filter(Boolean).join("\n").trim() || null;

    const bookingMeta = {
      service_title: selectedService.title ?? null,
      service_price_cents: selectedService.price_cents ?? null,
      tax_mode: TAX_MODE,
      gst_rate: GST_RATE,
      service_price_net_cents:
        typeof selectedService.price_cents === "number"
          ? amountsForCustomerPrice(selectedService.price_cents, TAX_MODE, GST_RATE).netCents
          : null,
      service_price_gst_cents:
        typeof selectedService.price_cents === "number"
          ? amountsForCustomerPrice(selectedService.price_cents, TAX_MODE, GST_RATE).gstCents
          : null,
      service_price_gross_cents:
        typeof selectedService.price_cents === "number"
          ? amountsForCustomerPrice(selectedService.price_cents, TAX_MODE, GST_RATE).grossCents
          : null,
      vehicle_size: vehicleSummary,
      preferred_window_key: windowKey || null,
      preferred_window_label: windowLabel || null,
      wants_specific_time: !!showExactTimes,
      quoted_price_cents: null as number | null,
    };

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      service_id: serviceId,
      start_at: startAt,
      end_at: endAt,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim() || null,
      vehicle: vehicleSummary,
      notes: combinedNotes,
      meta: bookingMeta,
      status: "confirmed",
    });
    setSubmitting(false);

    if (error) {
      setStatusTone("error");
      setStatus(error.message);
      return;
    }

    setStatusTone("success");
    setStatus("Request received — Dylan will message you to confirm the exact drop-off time and details.");

    // Refresh availability so the slot disappears
    setTimesNonce((x) => x + 1);
  }

  const visibleDays = grouped;

  return (
    <div className="pb-[calc(env(safe-area-inset-bottom)+140px)] md:pb-0 space-y-6 min-h-screen">
      <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-600/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-2xl" />

        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center rounded-full bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15 px-3 py-1 text-xs font-extrabold">
            Live availability (NZ time)
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Book a detail
          </h1>
          <p className="mt-2 text-slate-600 max-w-2xl">Pick a service → choose a day + drop-off window → enter details. Done.</p>
        </div>
      </div>

      <Card className="rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
            {([
            { n: 1, label: "Service" },
            { n: 2, label: "Schedule" },
            { n: 3, label: "Details" },
            { n: 4, label: "Review" },
          ] as const).map((s) => {
            const active = step === s.n;
            const done = step > s.n;
            const clickable = s.n < step;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => (clickable ? goTo(s.n) : null)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 transition",
                  active
                    ? "bg-indigo-600 text-white ring-0"
                    : done
                      ? "bg-indigo-50 text-indigo-800 ring-indigo-200 hover:bg-indigo-100"
                      : "bg-white text-slate-600 ring-black/10",
                  !clickable && !active && "cursor-default"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-extrabold text-slate-900">{stepTitle}</div>
          <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Step {step} of 4</div>
        </div>
        <div className="mt-1 text-sm text-slate-600 max-w-3xl">{stepHint}</div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {step === 1 && (
            <Card className="rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-extrabold text-slate-900">Service</div>
                  <Link to="/services" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                    View all services
                  </Link>
                </div>

                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 text-[11px] font-extrabold">
                    No payment required
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 text-[11px] font-extrabold">
                    Drop-off only
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 text-[11px] font-extrabold">
                    Wellington
                  </span>
                </div>

                {loadingServices ? (
                  <div className="text-sm text-slate-600">Loading services…</div>
                ) : services.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-black/5">
                    <div className="text-sm font-semibold text-slate-900">No services available</div>
                    <div className="mt-2 text-sm text-slate-600">Please check back later or contact us for more information.</div>
                  </div>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-2">
                    {services.map((s) => {
                      const selected = s.id === serviceId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setServiceId(s.id);
                            setSelectedDay("");
                            setWindowKey("");
                            setStartAt("");
                          }}
                          className={cn(
                            "group relative overflow-hidden rounded-3xl text-left transition-all duration-200",
                            "bg-white",
                            "ring-1 shadow-sm",
                            "hover:-translate-y-0.5 hover:shadow-md hover:ring-black/15",
                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200",
                            selected
                              ? "ring-2 ring-indigo-600/50 shadow-md bg-indigo-50/30"
                              : "ring-slate-200/60"
                          )}
                          aria-pressed={selected}
                        >
                          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-600/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />

                          <div className="relative p-5 sm:p-6">
                            {/* Header Section */}
                            <div className="mb-3">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight break-words flex-1 min-w-0">
                                  {s.title}
                                </h3>
                                {selected && (
                                  <div className="shrink-0">
                                    <div className="h-7 w-7 rounded-xl bg-indigo-600 text-white ring-2 ring-indigo-500/30 grid place-items-center shadow-sm">
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M20 6L9 17l-5-5" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {s.subtitle && (
                                <div className="text-sm text-slate-600 break-words leading-relaxed">
                                  {s.subtitle}
                                </div>
                              )}
                            </div>

                            {/* Price and Duration */}
                            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-200/80 mb-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-base sm:text-lg font-extrabold text-slate-900">
                                  From {fmtMoney(s.price_cents)}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">{taxLabelShort()}</span>
                              </div>
                              <Pill className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5">
                                {s.duration_mins} mins
                              </Pill>
                            </div>

                            {/* Summary */}
                            {s.summary && (
                              <div className="mb-3 text-sm text-slate-700 leading-relaxed">{s.summary}</div>
                            )}

                            {/* Includes */}
                            {s.includes && s.includes.length > 0 && (
                              <div className="mb-3 space-y-2">
                                {s.includes.slice(0, 4).map((x, i) => (
                                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                                    <span className="min-w-0 leading-relaxed">{x}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Selected Badge */}
                            {selected && (
                              <div className="mt-3 rounded-xl bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/20 px-3 py-1.5 text-xs font-extrabold tracking-wide uppercase">
                                Selected
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="hidden md:flex justify-end pt-2">
                <Button disabled={!canGoNext} onClick={goNext}>
                  Next
                </Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-extrabold text-slate-900">Schedule</div>
                </div>

                {selectedService && (
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 px-4 py-3">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Selected service</div>
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      <div className="min-w-0 text-sm font-semibold text-slate-900 truncate">{selectedService.title}</div>
                      <div className="shrink-0 text-sm font-extrabold text-slate-900">
                        From {fmtMoney(selectedService.price_cents)}
                        <span className="ml-2 text-[11px] font-extrabold text-slate-500">{taxLabelShort()}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Pick a day + drop-off window. We'll reserve the earliest slot that fits.</div>
                  </div>
                )}

                {!selectedService ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    Choose a service to see availability.
                  </div>
                ) : !serviceId ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    Loading availability…
                  </div>
                ) : loadingTimes ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    Loading availability…
                  </div>
                ) : availabilityStatus ? (
                  <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
                    <div>{availabilityStatus}</div>
                    <div className="mt-3">
                      <Button variant="secondary" onClick={() => setTimesNonce((x) => x + 1)}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    <div>No available times in the next 3 weeks.</div>
                    <div className="mt-3">
                      <Link to="/services" className="w-full sm:w-auto">
                        <Button variant="ghost" className="w-full sm:w-auto">
                          View services
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold text-slate-700">Day</div>
                      </div>

                      <div
                        ref={dateRailRef}
                        className="mt-2 flex gap-2 overflow-x-auto md:overflow-x-hidden md:flex-wrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {visibleDays.map((g) => {
                          const selected = g.dateKey === selectedDay;
                          return (
                            <button
                              key={g.dateKey}
                              data-day={g.dateKey}
                              type="button"
                              onClick={() => {
                                setSelectedDay(g.dateKey);
                                setWindowKey("");
                                setStartAt("");
                              }}
                              className={cn(
                                "shrink-0 rounded-full px-3 py-2 text-xs font-semibold border transition-all duration-200",
                                selected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                              )}
                            >
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                      <div className="text-xs font-extrabold text-slate-700">Drop-off window</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {windowsForActiveDay.map((w) => {
                          const selected = w.key === windowKey;
                          const disabled = !w.hasAny;
                          return (
                            <button
                              key={w.key}
                              type="button"
                              disabled={disabled}
                              onClick={() => setWindowKey(w.key)}
                              className={cn(
                                "rounded-full px-3 py-2 text-xs font-semibold border transition-all duration-200",
                                selected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                                disabled && "opacity-40 cursor-not-allowed hover:bg-white hover:border-slate-200"
                              )}
                            >
                              {w.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold text-slate-700">Time</div>
                        <button
                          type="button"
                          onClick={() => setShowExactTimes((v) => !v)}
                          className={cn(
                            "rounded-full px-3 py-2 text-xs font-semibold border transition-all duration-200",
                            showExactTimes
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          {showExactTimes ? "Use earliest" : "I need a specific time"}
                        </button>
                      </div>

                      {windowKey && timesForSelectedWindow.length > 0 ? (
                        showExactTimes ? (
                          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {timesForSelectedWindow.map((t) => {
                              const selected = t === startAt;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setStartAt(t)}
                                  className={cn(
                                    "rounded-xl px-3 py-2 text-sm font-semibold border transition-all duration-200",
                                    selected
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                      : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                  )}
                                >
                                  {fmtTimeNZ(t)}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            <div className="font-semibold">We'll take the earliest available time in this window.</div>
                            {startAt && (
                              <div className="mt-1 text-xs text-slate-600">Auto-selected: {fmtTimeNZ(startAt)} (NZ time)</div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="mt-3 text-sm text-slate-600">
                          {windowKey ? "No times in this window. Try another window." : "Choose a window to see availability."}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="hidden md:flex items-center justify-between pt-2">
                  <Button variant="secondary" onClick={goBack}>
                    Back
                  </Button>
                  <Button disabled={!canGoNext} onClick={goNext}>
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}

        {step === 3 && (
          <Card className="rounded-3xl p-5 sm:p-6 space-y-4">
            {status && (
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm ring-1",
                  statusTone === "success"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-rose-50 text-rose-800 ring-rose-200"
                )}
              >
                {status}
              </div>
            )}

            <div className="text-sm font-extrabold text-slate-900">Your details</div>

            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Name *</label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="rounded-2xl bg-slate-50"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Email *</label>
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={cn("rounded-2xl bg-slate-50", email.trim() && !emailOk && "ring-2 ring-rose-300")}
                />
                {email.trim() && !emailOk && <div className="text-xs text-rose-700">Please enter a valid email.</div>}
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="021 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="rounded-2xl bg-slate-50"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Vehicle size *</label>
                <Select
                  className="rounded-2xl bg-slate-50"
                  value={vehicleSize}
                  onChange={(e) => setVehicleSize(e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="XL (SUV / Ute / Van)">XL (SUV / Ute / Van)</option>
                </Select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Notes (optional)</label>
                <Textarea
                  placeholder="Any priority areas or helpful notes."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  autoComplete="off"
                  className="rounded-2xl bg-slate-50"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">By booking you agree to be contacted about your appointment.</div>

            <div className="hidden md:flex items-center justify-between pt-2">
              <Button variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button disabled={!canGoNext} onClick={goNext}>
                Next
              </Button>
            </div>
          </Card>
        )}

          {step === 4 && (
            <Card className="rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="text-sm font-extrabold text-slate-900">Review</div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Service</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                      {selectedService ? selectedService.title : "—"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 shrink-0"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">When</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                      {startAt ? whenSummary : "—"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(2)}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 shrink-0"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Details</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 truncate">{name || "—"}</div>
                    <div className="mt-1 text-sm text-slate-700 truncate">{email || "—"}</div>
                    <div className="mt-1 text-sm text-slate-700 truncate">{vehicleSize || "—"}</div>
                    {notes.trim() && (
                      <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{notes.trim()}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(3)}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 shrink-0"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {status && (
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm ring-1",
                    statusTone === "success"
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                      : "bg-rose-50 text-rose-800 ring-rose-200"
                  )}
                >
                  {status}
                </div>
              )}

              <div className="hidden md:flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={goBack}>
                  Back
                </Button>
                <Button disabled={!canSubmit} onClick={submit}>
                  {statusTone === "success" ? "Request sent" : submitting ? "Sending…" : "Send booking request"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-24">
            <Card className="rounded-3xl p-5 space-y-4">
              <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Your booking</div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Service</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {selectedService ? selectedService.title : "Choose a service"}
                </div>
                {selectedService && (
                  <div className="mt-1 text-sm text-slate-700">
                    From {fmtMoney(selectedService.price_cents)}
                    <span className="ml-2 text-xs font-extrabold text-slate-500">{taxLabelShort()}</span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">When</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{whenSummary}</div>
              </div>

              {/* <div className="flex gap-2">
                <Button variant="secondary" disabled={step === 1} onClick={goBack} className="flex-1">
                  Back
                </Button>

                {step < 4 ? (
                  <Button disabled={!canGoNext} onClick={goNext} className="flex-1">
                    Next
                  </Button>
                ) : (
                  <Button disabled={!canSubmit} onClick={submit} className="flex-1">
                    {statusTone === "success" ? "Sent" : submitting ? "Sending…" : "Send"}
                  </Button>
                )}
              </div> */}

              <div className="text-xs text-slate-500">
                You’ll receive a message to confirm the exact drop-off time.
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#f7f7f8] to-transparent" />
        <div className="bg-[#f7f7f8]/95 backdrop-blur border-t border-black/5 px-4 sm:px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="mx-auto max-w-6xl pointer-events-auto">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Selected</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                    {selectedService ? selectedService.title : "Choose a service"}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {whenSummary}
                  </div>
                </div>

                <div className="flex gap-2">
                  {step > 1 && (
                    <Button variant="secondary" onClick={goBack}>
                      Back
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button disabled={!canGoNext} onClick={goNext}>
                      Next
                    </Button>
                  ) : (
                    <Button disabled={!canSubmit} onClick={submit}>
                      {statusTone === "success" ? "Request sent" : submitting ? "Sending…" : "Send request"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
