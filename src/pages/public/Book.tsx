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
import { usePackages } from "../../hooks/usePackages";
import { accentClass, isMostPopular } from "../../utils/packageUi";

type Service = {
  id: string;
  title: string;
  duration_mins: number;
  active: boolean;
  sort_order: number;
};

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
const availabilityCache = new Map<string, { at: number; times: string[] }>();

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

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toISODateNZ(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TZ }).format(d); // YYYY-MM-DD
}

function addMinutesIso(iso: string, mins: number): string | null {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return new Date(d.getTime() + mins * 60_000).toISOString();
}

function normalizeKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/**
 * Make labels from dateKey itself (not from arbitrary slot time),
 * and keep ordering stable and human-friendly.
 */
function labelForDateKeyNZ(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  // Use midday UTC so it won't roll dates due to tz conversions
  const safe = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));

  const day = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    weekday: "short",
  }).format(safe);

  const rest = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    day: "2-digit",
    month: "short",
  }).format(safe);

  // Today/Tomorrow tag
  const nowKey = toISODateNZ(new Date());
  const tomorrowKey = toISODateNZ(addDays(new Date(), 1));
  const tag = dateKey === nowKey ? "Today" : dateKey === tomorrowKey ? "Tomorrow" : "";

  return tag ? `${tag} · ${day} ${rest}` : `${day} ${rest}`;
}

export default function Book() {
  const [searchParams] = useSearchParams();
  const debug = searchParams.get("debug") === "1";

  const { packages, getByCode } = usePackages();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [times, setTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timesNonce, setTimesNonce] = useState(0);

  const lastServiceIdRef = useRef<string>("");

  // Booking selections
  const [packageCode, setPackageCode] = useState<string>("");
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

  const selectedPackage = useMemo(() => getByCode(packageCode), [getByCode, packageCode]);

  // Preselect package
  useEffect(() => {
    const preselect = searchParams.get("package");
    const p = getByCode(preselect);
    if (!p) return;
    setPackageCode(p.code);
  }, [searchParams, getByCode]);

  // When a package is chosen on step 1, move forward automatically.
  useEffect(() => {
    if (!selectedPackage) return;
    setStep((s) => (s === 1 ? 2 : s));
  }, [selectedPackage]);

  const serviceId = useMemo(() => {
    if (!selectedPackage) return "";
    if (selectedPackage.serviceId) return selectedPackage.serviceId;

    const want = normalizeKey(selectedPackage.title);
    return services.find((s) => normalizeKey(s.title) === want)?.id ?? "";
  }, [services, selectedPackage]);

  // Prefetch services list in the background so serviceId mapping is fast.
  useEffect(() => {
    if (services.length > 0) return;
    if (loadingServices) return;

    let alive = true;

    (async () => {
      setLoadingServices(true);
      const svc = await supabase
        .from("services")
        .select("id,title,duration_mins,active,sort_order")
        .eq("active", true)
        .order("sort_order");

      if (!alive) return;
      setServices((svc.data ?? []) as Service[]);
      setLoadingServices(false);
    })();

    return () => {
      alive = false;
    };
  }, [services.length, loadingServices]);

  // Fetch availability
  useEffect(() => {
    if (!serviceId) {
      setTimes([]);
      setSelectedDay("");
      setWindowKey("");
      setStartAt("");
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
    }

    const cached = availabilityCache.get(serviceId);
    const cacheFresh = cached && Date.now() - cached.at < AVAILABILITY_CACHE_TTL_MS;
    if (cacheFresh && cached.times.length > 0) {
      setTimes(cached.times);
    }

    let cancelled = false;

    (async () => {
      // Only show a blocking spinner if we don't already have something to show.
      if (!(cacheFresh && cached?.times?.length)) setLoadingTimes(true);

      const from = new Date();
      const to = addDays(from, 22);
      const fromNZ = toISODateNZ(from);
      const toNZ = toISODateNZ(to);

      const { data, error } = await supabase.rpc("get_available_starts", {
        p_service_id: serviceId,
        p_from: fromNZ,
        p_to: toNZ,
        p_step_mins: 15,
      });

      if (cancelled) return;

      if (error) {
        setStatusTone("error");
        setStatus(error.message);
        setTimes([]);
      } else {
        const nextTimes = (data ?? []).map((r: any) => r.start_at);
        availabilityCache.set(serviceId, { at: Date.now(), times: nextTimes });
        setTimes(nextTimes);
      }

      setLoadingTimes(false);
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
    if (!selectedDay && grouped.length > 0) {
      setSelectedDay(grouped[0].dateKey);
    }
  }, [grouped, selectedDay]);

  // If selection becomes invalid after an auto-refresh, snap to the earliest available.
  useEffect(() => {
    if (!selectedDay) return;
    if (grouped.length === 0) return;
    if (grouped.some((g) => g.dateKey === selectedDay)) return;
    setSelectedDay(grouped[0].dateKey);
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
    setStartAt((prev) => (prev && timesForSelectedWindow.includes(prev) ? prev : timesForSelectedWindow[0]));
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
    if (step === 1) return !!selectedPackage;
    if (step === 2) return !!serviceId && !!startAt;
    if (step === 3) return name.trim().length >= 2 && emailOk && !!vehicleSize;
    return false;
  }, [step, selectedPackage, serviceId, startAt, name, emailOk, vehicleSize]);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Choose a package";
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
        return "Pick what level of detail you want — you can change it later.";
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
      if (!selectedPackage) return setStatus("Choose a package first.");
      if (!startAt) return setStatus("Choose a day and drop-off window.");
      if (!name.trim()) return setStatus("Please enter your name.");
      if (!email.trim()) return setStatus("Please enter your email.");
      if (!emailOk) return setStatus("That email doesn’t look right — please check it.");
      if (!vehicleSize) return setStatus("Please select your vehicle size.");
      return setStatus("Please complete the required fields.");
    }

    const svc = services.find((s) => s.id === serviceId) ?? null;
    let durationMins = svc?.duration_mins ?? null;
    if (durationMins == null) {
      const { data, error } = await supabase
        .from("services")
        .select("duration_mins")
        .eq("id", serviceId)
        .maybeSingle();

      if (error || !data?.duration_mins) {
        setStatusTone("error");
        setStatus("Please select a service.");
        return;
      }
      durationMins = data.duration_mins;
    }

    if (durationMins == null) {
      setStatusTone("error");
      setStatus("Please select a service.");
      return;
    }

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
    <div className="pb-[calc(env(safe-area-inset-bottom)+112px)] md:pb-0 space-y-6">
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
          <p className="mt-2 text-slate-600 max-w-2xl">Pick a package → choose a day + drop-off window → enter details. Done.</p>
        </div>
      </div>

      <Card className="rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { n: 1, label: "Package" },
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
                  <div className="text-sm font-extrabold text-slate-900">Package</div>
                  <Link to="/services" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                    View packages
                  </Link>
                </div>

                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-black/5 px-3 py-1 text-[11px] font-extrabold">
                    No payment required
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-black/5 px-3 py-1 text-[11px] font-extrabold">
                    Drop-off only
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-black/5 px-3 py-1 text-[11px] font-extrabold">
                    Wellington
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {packages.map((p) => {
                    const selected = p.code === packageCode;
                    return (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => {
                          setPackageCode(p.code);
                          setSelectedDay("");
                          setWindowKey("");
                          setStartAt("");
                        }}
                        className={cn(
                          "group relative overflow-hidden rounded-3xl text-left transition",
                          "bg-gradient-to-br from-white via-white to-slate-50",
                          "ring-1 shadow-sm",
                          "hover:-translate-y-[1px] hover:shadow-md",
                          "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200",
                          selected
                            ? "ring-2 ring-indigo-600/50 shadow-md"
                            : "ring-black/10 hover:ring-black/15"
                        )}
                        aria-pressed={selected}
                      >
                        <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-indigo-600/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />

                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-full bg-gradient-to-r shrink-0",
                                      accentClass(p.code)
                                    )}
                                  />
                                  <div className="min-w-0 flex-1 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-normal break-words leading-tight">
                                    {p.title}
                                  </div>
                                </div>
                                {isMostPopular(p.code) && (
                                  <span className="inline-flex items-center rounded-full bg-indigo-600 text-white px-2.5 py-1 text-[11px] font-extrabold">
                                    Most popular
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{p.subtitle}</div>
                            </div>

                            <div className="shrink-0 text-right flex flex-col items-end">
                              {selected && (
                                <div className="mb-2">
                                  <div className="h-9 w-9 rounded-2xl bg-indigo-600 text-white ring-1 ring-indigo-500/30 grid place-items-center shadow-sm">
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              <div className="text-sm font-extrabold text-slate-900">From {fmtMoney(p.fromPriceCents)}</div>
                              <div className="mt-1 flex justify-end">
                                <Pill className="bg-black/5">Time varies</Pill>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-sm text-slate-700">{p.summary}</div>

                          <div className="mt-4 grid gap-2">
                            {p.includes.slice(0, 2).map((x) => (
                              <div key={x} className="flex items-start gap-2 text-sm text-slate-700">
                                <span
                                  className={cn(
                                    "mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r",
                                    accentClass(p.code)
                                  )}
                                />
                                <span className="min-w-0">{x}</span>
                              </div>
                            ))}
                          </div>

                          {selected && (
                            <div className="mt-4 rounded-2xl bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15 px-3 py-2 text-xs font-extrabold">
                              Selected
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
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

                {selectedPackage && (
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 px-4 py-3">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Selected package</div>
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      <div className="min-w-0 text-sm font-semibold text-slate-900 truncate">{selectedPackage.title}</div>
                      <div className="shrink-0 text-sm font-extrabold text-slate-900">From {fmtMoney(selectedPackage.fromPriceCents)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Pick a day + drop-off window. We’ll reserve the earliest slot that fits.</div>
                  </div>
                )}

                {!selectedPackage ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    Choose a package to see availability.
                  </div>
                ) : !serviceId ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    Loading availability…
                  </div>
                ) : loadingTimes ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    Loading availability…
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                    <div>No available times in the next 3 weeks.</div>
                    <div className="mt-3">
                      <Link to="/services" className="w-full sm:w-auto">
                        <Button variant="ghost" className="w-full sm:w-auto">
                          View packages
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-3">
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
                                "shrink-0 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
                                selected
                                  ? "bg-indigo-600 text-white ring-0"
                                  : "bg-white text-slate-700 ring-black/10 hover:bg-slate-50"
                              )}
                            >
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-3">
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
                                "rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
                                selected
                                  ? "bg-indigo-600 text-white ring-0"
                                  : "bg-white text-slate-700 ring-black/10 hover:bg-slate-50",
                                disabled && "opacity-40 cursor-not-allowed hover:bg-white"
                              )}
                            >
                              {w.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white ring-1 ring-black/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold text-slate-700">Time</div>
                        <button
                          type="button"
                          onClick={() => setShowExactTimes((v) => !v)}
                          className={cn(
                            "rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
                            showExactTimes
                              ? "bg-indigo-600 text-white ring-0"
                              : "bg-white text-slate-700 ring-black/10 hover:bg-slate-50"
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
                                    "rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition",
                                    selected
                                      ? "bg-indigo-600 text-white ring-0"
                                      : "bg-slate-50 text-slate-800 ring-black/10 hover:bg-slate-100"
                                  )}
                                >
                                  {fmtTimeNZ(t)}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl bg-slate-50 ring-1 ring-black/5 px-3 py-2 text-sm text-slate-700">
                            <div className="font-semibold">We’ll take the earliest available time in this window.</div>
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

              <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Package</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                      {selectedPackage ? selectedPackage.title : "—"}
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

              <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-4">
                <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Package</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedPackage ? selectedPackage.title : "Choose a package"}
                </div>
                {selectedPackage && (
                  <div className="mt-1 text-sm text-slate-700">From {fmtMoney(selectedPackage.fromPriceCents)}</div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-4">
                <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">When</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{whenSummary}</div>
              </div>

              <div className="flex gap-2">
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
              </div>

              <div className="text-xs text-slate-500">
                You’ll receive a message to confirm the exact drop-off time.
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#f7f7f8] to-transparent" />
        <div className="bg-[#f7f7f8]/95 backdrop-blur border-t border-black/5 px-2 sm:px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="mx-auto max-w-6xl pointer-events-auto">
            <div className="rounded-3xl bg-white ring-1 ring-black/10 shadow-sm">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Selected</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                    {selectedPackage ? selectedPackage.title : "Choose a package"}
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
