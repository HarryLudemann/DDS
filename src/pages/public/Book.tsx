import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { isFirebaseConfigured } from "../../utils/firebase";
import { createBooking } from "../../lib/firebase/store";
import { fmtDuration, fmtMoney, fmtTimeNZ } from "../../utils/format";
import { amountsForCustomerPrice, GST_RATE, TAX_MODE, taxLabelShort } from "../../utils/tax";
import { useServices } from "../../hooks/useServices";
import { AVAILABILITY_UPDATED_EVENT, SERVICES_UPDATED_EVENT } from "../../lib/site/live";
import { cn } from "../../lib/site/cn";
import { fetchAvailableStarts } from "../../lib/site/availability";
import {
  BOOKING_WINDOWS,
  addMinutesIso,
  groupStartsByDay,
  isPlausiblePlate,
  isValidEmail,
  isoToNZDateKey,
  isoToNZMinutesSinceMidnight,
  labelForDateKeyNZ,
  normalizePlate,
  type WindowKey,
} from "../../lib/site/bookingTime";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { Field, SiteInput, SiteTextarea } from "../../components/site/ui/Field";

type Step = 1 | 2 | 3 | 4;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Package" },
  { n: 2, label: "When" },
  { n: 3, label: "Details" },
  { n: 4, label: "Review" },
];

function parseStep(raw: string | null, hasService: boolean): Step {
  if (raw === "1" || raw === "2" || raw === "3" || raw === "4") return Number(raw) as Step;
  return hasService ? 2 : 1;
}

function Choice({
  selected,
  disabled,
  onClick,
  children,
  dataDay,
  className,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  dataDay?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-day={dataDay}
      aria-pressed={selected}
      className={cn(
        "w-full min-w-0 border px-4 py-3.5 text-left text-sm transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-ink)]",
        selected
          ? "border-[var(--site-ink)] bg-transparent"
          : "border-[var(--site-line)] bg-transparent hover:border-[var(--site-ink)]/35",
        disabled && "cursor-not-allowed opacity-40 hover:border-[var(--site-line)]",
        className
      )}
    >
      {children}
    </button>
  );
}

function TextAction({
  onClick,
  disabled,
  children,
  hint,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group mt-12 block w-full max-w-xl text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-ink)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--site-bg)]",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span className="font-display text-3xl leading-none transition-opacity group-hover:opacity-55 sm:text-4xl">
        {children}
      </span>
      {hint ? <span className="mt-3 block text-sm text-[var(--site-muted)]">{hint}</span> : null}
    </button>
  );
}

function earliestInWindow(times: string[], startMins: number, endMins: number) {
  return times
    .filter((t) => {
      const mins = isoToNZMinutesSinceMidnight(t);
      return mins != null && mins >= startMins && mins < endMins;
    })
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

function windowForTime(iso: string): WindowKey | "" {
  const mins = isoToNZMinutesSinceMidnight(iso);
  if (mins == null) return "";
  const match = BOOKING_WINDOWS.find((w) => w.key !== "any" && mins >= w.startMins && mins < w.endMins);
  return match?.key ?? "any";
}

export default function Book() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { services, getById, loading: loadingServices } = useServices();

  const serviceId = searchParams.get("service") || "";
  const step = parseStep(searchParams.get("step"), !!serviceId);

  const [selectedDay, setSelectedDay] = useState("");
  const [windowKey, setWindowKey] = useState<WindowKey | "">("");
  const [startAt, setStartAt] = useState("");
  const [showExactTimes, setShowExactTimes] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [notes, setNotes] = useState("");

  const [times, setTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timesNonce, setTimesNonce] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);

  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dateRailRef = useRef<HTMLDivElement | null>(null);
  const selectedService = useMemo(() => getById(serviceId), [getById, serviceId]);
  const plateValue = normalizePlate(plate);
  const plateOk = isPlausiblePlate(plate);

  function goTo(next: Step, replace = false) {
    const params = new URLSearchParams();
    if (serviceId) params.set("service", serviceId);
    if (next === 1) {
      if (serviceId) params.set("step", "1");
    } else {
      params.set("step", String(next));
    }
    setStatus(null);
    setStatusTone(null);
    setSearchParams(params, { replace, state: { ddsBook: true }, preventScrollReset: true });
  }

  function goBack() {
    if (step <= 1) return;
    const fromFlow = (location.state as { ddsBook?: boolean } | null)?.ddsBook;
    if (fromFlow) {
      navigate(-1);
      return;
    }
    goTo((step - 1) as Step, true);
  }

  useEffect(() => {
    if (!serviceId) return;

    let cancelled = false;
    (async () => {
      setLoadingTimes(true);
      setAvailabilityStatus(null);
      const { times: nextTimes, error } = await fetchAvailableStarts(serviceId, timesNonce > 0);
      if (cancelled) return;
      if (error) {
        setAvailabilityStatus(error);
        setTimes([]);
      } else {
        setTimes(nextTimes);
      }
      setLoadingTimes(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [serviceId, timesNonce]);

  useEffect(() => {
    if (loadingServices) return;
    if (serviceId && !selectedService) {
      setSearchParams({}, { replace: true, preventScrollReset: true });
    }
  }, [loadingServices, serviceId, selectedService, setSearchParams]);

  useEffect(() => {
    const refresh = () => setTimesNonce((x) => x + 1);
    window.addEventListener(AVAILABILITY_UPDATED_EVENT, refresh);
    window.addEventListener(SERVICES_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(AVAILABILITY_UPDATED_EVENT, refresh);
      window.removeEventListener(SERVICES_UPDATED_EVENT, refresh);
    };
  }, []);

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

  const grouped = useMemo(() => groupStartsByDay(times), [times]);
  const effectiveDay =
    selectedDay && grouped.some((g) => g.dateKey === selectedDay) ? selectedDay : (grouped[0]?.dateKey ?? "");

  const activeDay = useMemo(
    () => grouped.find((g) => g.dateKey === effectiveDay) ?? null,
    [grouped, effectiveDay]
  );

  const windowsForActiveDay = useMemo(() => {
    if (!activeDay) return [];
    return BOOKING_WINDOWS.map((w) => {
      const earliest = earliestInWindow(activeDay.times, w.startMins, w.endMins);
      return { ...w, earliest, hasAny: !!earliest };
    });
  }, [activeDay]);

  const timesForSelectedWindow = useMemo(() => {
    if (!activeDay || !windowKey) return [];
    const w = BOOKING_WINDOWS.find((x) => x.key === windowKey);
    if (!w) return [];
    return activeDay.times
      .filter((t) => {
        const mins = isoToNZMinutesSinceMidnight(t);
        return mins != null && mins >= w.startMins && mins < w.endMins;
      })
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [activeDay, windowKey]);

  const exactTimes = useMemo(() => {
    if (!activeDay) return [];
    return [...activeDay.times].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [activeDay]);

  const effectiveStart = showExactTimes
    ? startAt && exactTimes.includes(startAt)
      ? startAt
      : ""
    : startAt && timesForSelectedWindow.includes(startAt)
      ? startAt
      : (timesForSelectedWindow[0] ?? "");

  useEffect(() => {
    if (!dateRailRef.current || !effectiveDay) return;
    const btn = dateRailRef.current.querySelector<HTMLButtonElement>(`button[data-day='${effectiveDay}']`);
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [effectiveDay]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const emailOk = email.trim() ? isValidEmail(email) : false;
  const selectedWindowLabel = BOOKING_WINDOWS.find((w) => w.key === windowKey)?.label ?? "";

  const whenSummary = useMemo(() => {
    if (!effectiveStart) return "Pick a day and a window";
    const dateKey = isoToNZDateKey(effectiveStart);
    if (!dateKey) return "Pick a day and a window";
    return `${labelForDateKeyNZ(dateKey)} · ${selectedWindowLabel || "Any time"}${
      showExactTimes ? ` · ${fmtTimeNZ(effectiveStart)}` : " · Earliest available"
    }`;
  }, [effectiveStart, selectedWindowLabel, showExactTimes]);

  const canSubmit =
    !!serviceId &&
    !!effectiveStart &&
    name.trim().length >= 2 &&
    emailOk &&
    plateOk &&
    statusTone !== "success" &&
    !submitting;

  const detailsReady = name.trim().length >= 2 && emailOk && plateOk;

  function pickPackage(id: string) {
    setSelectedDay("");
    setWindowKey("");
    setStartAt("");
    setShowExactTimes(false);
    setTimes([]);
    setStatus(null);
    setStatusTone(null);
    setSearchParams(
      { service: id, step: "2" },
      { state: { ddsBook: true }, preventScrollReset: true }
    );
  }

  function pickDay(dateKey: string) {
    setSelectedDay(dateKey);
    setWindowKey("");
    setStartAt("");
    setShowExactTimes(false);
  }

  function pickWindow(key: WindowKey, earliest?: string) {
    setWindowKey(key);
    setShowExactTimes(false);
    setStartAt(earliest ?? "");
    goTo(3);
  }

  function pickExactTime(iso: string) {
    setStartAt(iso);
    setWindowKey(windowForTime(iso));
    setShowExactTimes(true);
    goTo(3);
  }

  async function submit() {
    setStatus(null);
    setStatusTone(null);
    if (!canSubmit || !selectedService) {
      setStatusTone("error");
      setStatus("Please complete the required fields.");
      return;
    }

    const endAt = addMinutesIso(effectiveStart, selectedService.duration_mins);
    if (!endAt) {
      setStatusTone("error");
      setStatus("Selected time is invalid. Please choose another time.");
      return;
    }

    const windowLabel = (BOOKING_WINDOWS.find((w) => w.key === windowKey)?.label ?? "").trim();
    const metaNote = windowLabel && windowKey !== "any" ? `Preferred drop-off window: ${windowLabel}` : "";
    const combinedNotes = [metaNote, notes.trim()].filter(Boolean).join("\n").trim() || null;
    const breakdown = amountsForCustomerPrice(selectedService.price_cents, TAX_MODE, GST_RATE);

    setSubmitting(true);
    try {
      await createBooking({
        service_id: serviceId,
        start_at: effectiveStart,
        end_at: endAt,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim() || null,
        vehicle: plateValue || null,
        notes: combinedNotes,
        meta: {
          service_title: selectedService.title ?? null,
          service_price_cents: selectedService.price_cents ?? null,
          tax_mode: TAX_MODE,
          gst_rate: GST_RATE,
          service_price_net_cents: breakdown.netCents,
          service_price_gst_cents: breakdown.gstCents,
          service_price_gross_cents: breakdown.grossCents,
          plate: plateValue || null,
          preferred_window_key: windowKey || null,
          preferred_window_label: windowLabel || null,
          wants_specific_time: !!showExactTimes,
          quoted_price_cents: null,
        },
        status: "confirmed",
      });
    } catch (e) {
      setSubmitting(false);
      setStatusTone("error");
      setStatus(e instanceof Error ? e.message : "Could not send booking.");
      return;
    }
    setSubmitting(false);

    setStatusTone("success");
    setStatus("Request received. We’ll confirm the exact drop-off time and details shortly.");
    setTimesNonce((x) => x + 1);
  }

  return (
    <>
      <SiteSeo path="/book" />

      <Container className="overflow-x-hidden pb-20 pt-10 sm:pt-14 md:pb-24">
        <p className="site-chip">Booking</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl">Reserve a drop-off</h1>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-[var(--site-muted)] sm:text-base">
          Four short steps. No payment online — we confirm the time after the request.
        </p>

        {!isFirebaseConfigured && (
          <p className="mt-6 max-w-xl text-pretty border border-[var(--site-line)] px-4 py-3 text-sm leading-relaxed text-[var(--site-muted)]">
            Live availability needs Firebase keys in a <span className="font-semibold">.env</span> file and a restart of the
            dev server.
          </p>
        )}

        <BookingSteps step={step} onBackTo={(n) => n < step && goTo(n)} onBack={step > 1 ? goBack : undefined} />

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            {step === 1 && (
              <section aria-labelledby="step-service">
                <h2 id="step-service" className="font-display text-2xl">
                  Choose a package
                </h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">Tap one to continue.</p>
                {loadingServices ? (
                  <p className="mt-6 text-sm text-[var(--site-muted)]">Loading packages…</p>
                ) : services.length === 0 ? (
                  <p className="mt-6 text-sm text-[var(--site-muted)]">No packages available right now.</p>
                ) : (
                  <div className="mt-6 grid min-w-0 gap-3">
                    {services.map((s) => (
                      <Choice key={s.id} selected={s.id === serviceId} onClick={() => pickPackage(s.id)}>
                        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-3">
                          <span className="font-medium">{s.title}</span>
                          <span className="text-sm text-[var(--site-muted)]">
                            From {fmtMoney(s.price_cents)} · {fmtDuration(s.duration_mins)}
                          </span>
                        </div>
                        {s.summary && <p className="mt-2 text-sm text-[var(--site-muted)]">{s.summary}</p>}
                      </Choice>
                    ))}
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="step-when">
                <h2 id="step-when" className="font-display text-2xl">
                  When can you drop off?
                </h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Pick a day, then a window. We’ll hold the earliest slot unless you choose a time.
                </p>
                {!selectedService ? (
                  <p className="mt-6 text-sm text-[var(--site-muted)]">Choose a package first.</p>
                ) : loadingTimes ? (
                  <p className="mt-6 text-sm text-[var(--site-muted)]">Loading availability…</p>
                ) : availabilityStatus ? (
                  <div className="mt-6">
                    <p className="text-sm text-[#8a2a2a]">{availabilityStatus}</p>
                    <button
                      type="button"
                      className="mt-4 text-sm text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]"
                      onClick={() => setTimesNonce((x) => x + 1)}
                    >
                      Retry
                    </button>
                  </div>
                ) : grouped.length === 0 ? (
                  <p className="mt-6 text-sm text-[var(--site-muted)]">No available times in the next three weeks.</p>
                ) : (
                  <>
                    <div
                      ref={dateRailRef}
                      className="mt-6 flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible"
                    >
                      {grouped.map((g) => (
                        <Choice
                          key={g.dateKey}
                          selected={g.dateKey === effectiveDay}
                          dataDay={g.dateKey}
                          className="w-auto min-w-[8.75rem] shrink-0"
                          onClick={() => pickDay(g.dateKey)}
                        >
                          {g.label}
                        </Choice>
                      ))}
                    </div>

                    {showExactTimes ? (
                      <div className="mt-8">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-medium">Exact time</h3>
                          <button
                            type="button"
                            className="text-sm text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]"
                            onClick={() => {
                              setShowExactTimes(false);
                              setStartAt("");
                              setWindowKey("");
                            }}
                          >
                            Use a window instead
                          </button>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {exactTimes.map((t) => (
                            <Choice
                              key={t}
                              selected={t === startAt}
                              className="text-center"
                              onClick={() => pickExactTime(t)}
                            >
                              {fmtTimeNZ(t)}
                            </Choice>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8">
                        <h3 className="text-sm font-medium">Drop-off window</h3>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {windowsForActiveDay
                            .filter((w) => w.key !== "any")
                            .map((w) => (
                              <Choice
                                key={w.key}
                                selected={w.key === windowKey}
                                disabled={!w.hasAny}
                                onClick={() => w.earliest && pickWindow(w.key, w.earliest)}
                              >
                                <span className="font-medium">{w.label}</span>
                                <span className="mt-1 block text-sm text-[var(--site-muted)]">
                                  {w.earliest ? `From ${fmtTimeNZ(w.earliest)}` : "No times"}
                                </span>
                              </Choice>
                            ))}
                        </div>
                        {windowsForActiveDay.some((w) => w.key === "any" && w.hasAny) && (
                          <button
                            type="button"
                            className="mt-5 text-sm text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]"
                            onClick={() => {
                              const any = windowsForActiveDay.find((w) => w.key === "any");
                              if (any?.earliest) pickWindow("any", any.earliest);
                            }}
                          >
                            Any time is fine
                          </button>
                        )}
                        <button
                          type="button"
                          className="mt-4 block text-sm text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]"
                          onClick={() => {
                            setShowExactTimes(true);
                            setWindowKey("");
                            setStartAt("");
                          }}
                        >
                          I need a specific time
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="step-details" className="space-y-5">
                <h2 id="step-details" className="font-display text-2xl">
                  Your details
                </h2>
                <p className="text-sm text-[var(--site-muted)]">We’ll use these to confirm the drop-off.</p>
                <Field label="Name *" htmlFor="book-name">
                  <SiteInput
                    id="book-name"
                    autoComplete="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field
                  label="Email *"
                  htmlFor="book-email"
                  error={email.trim() && !emailOk ? "Please enter a valid email." : undefined}
                >
                  <SiteInput
                    id="book-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Phone" htmlFor="book-phone" hint="Useful if we need to confirm the same day.">
                  <SiteInput
                    id="book-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>
                <Field
                  label="Number plate"
                  htmlFor="book-plate"
                  hint="Optional. Helps us identify the car."
                  error={plate.trim() && !plateOk ? "Use a New Zealand plate, letters and numbers only." : undefined}
                >
                  <SiteInput
                    id="book-plate"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={plate}
                    onChange={(e) => setPlate(normalizePlate(e.target.value))}
                    className="uppercase tracking-[0.12em]"
                  />
                </Field>
                <Field label="Notes" htmlFor="book-notes" hint="Stains, pet hair, child seats — anything useful.">
                  <SiteTextarea id="book-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
                <p className="text-xs text-[var(--site-muted)]">By booking you agree to be contacted about your appointment.</p>
                <TextAction
                  onClick={() => detailsReady && goTo(4)}
                  disabled={!detailsReady}
                  hint={detailsReady ? "Check everything, then send. No payment online." : "Name and email are required."}
                >
                  Continue to review
                </TextAction>
              </section>
            )}

            {step === 4 && (
              <section aria-labelledby="step-review">
                <h2 id="step-review" className="font-display text-2xl">
                  {statusTone === "success" ? "Request sent" : "Check and send"}
                </h2>
                <dl className="mt-6 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
                  <ReviewRow label="Package" value={selectedService?.title ?? "—"} onEdit={() => goTo(1)} />
                  <ReviewRow
                    label="From"
                    value={
                      selectedService
                        ? `${fmtMoney(selectedService.price_cents)} ${taxLabelShort()} · ${fmtDuration(selectedService.duration_mins)}`
                        : "—"
                    }
                  />
                  <ReviewRow label="When" value={whenSummary} onEdit={() => goTo(2)} />
                  <ReviewRow label="Name" value={name || "—"} onEdit={() => goTo(3)} />
                  <ReviewRow label="Email" value={email || "—"} onEdit={() => goTo(3)} />
                  {phone.trim() ? <ReviewRow label="Phone" value={phone} onEdit={() => goTo(3)} /> : null}
                  {plateValue ? <ReviewRow label="Plate" value={plateValue} onEdit={() => goTo(3)} /> : null}
                  {notes.trim() ? <ReviewRow label="Notes" value={notes.trim()} onEdit={() => goTo(3)} /> : null}
                </dl>
                {status && (
                  <p
                    className={cn("mt-6 text-sm", statusTone === "success" ? "text-[var(--site-ink)]" : "text-[#8a2a2a]")}
                    role="status"
                  >
                    {status}
                  </p>
                )}
                {statusTone === "success" ? (
                  <Link
                    to="/"
                    className="mt-12 inline-block font-display text-3xl leading-none hover:opacity-55 sm:text-4xl"
                  >
                    Back to home
                  </Link>
                ) : (
                  <TextAction
                    onClick={submit}
                    disabled={!canSubmit}
                    hint={submitting ? "Sending your request…" : "We’ll confirm the drop-off time by email."}
                  >
                    {submitting ? "Sending…" : "Send booking request"}
                  </TextAction>
                )}
              </section>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28 border border-[var(--site-line)] p-6">
              <div className="text-sm text-[var(--site-muted)]">Your booking</div>
              <div className="mt-4 font-display text-2xl leading-tight">
                {selectedService ? selectedService.title : "No package yet"}
              </div>
              {selectedService && (
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  From {fmtMoney(selectedService.price_cents)} {taxLabelShort()}
                </p>
              )}
              <div className="mt-5 space-y-2 border-t border-[var(--site-line)] pt-5 text-sm text-[var(--site-muted)]">
                <p>{whenSummary}</p>
                {plateValue ? <p className="tracking-[0.08em]">{plateValue}</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}

function BookingSteps({
  step,
  onBackTo,
  onBack,
}: {
  step: Step;
  onBackTo: (n: Step) => void;
  onBack?: () => void;
}) {
  const pct = (step / STEPS.length) * 100;
  const current = STEPS.find((s) => s.n === step);

  return (
    <div className="mt-8 sm:mt-10">
      <div className="flex items-baseline justify-between gap-4 sm:hidden">
        <p className="text-sm text-[var(--site-muted)]">
          {current?.label}
          <span className="text-[var(--site-line)]"> · </span>
          {step} of {STEPS.length}
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[var(--site-muted)] underline-offset-4 hover:text-[var(--site-ink)] hover:underline"
          >
            Back
          </button>
        )}
      </div>

      <ol className="hidden w-full min-w-0 sm:flex sm:items-baseline sm:justify-between sm:gap-2" aria-label="Booking steps">
        {STEPS.map((s) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <li key={s.n}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onBackTo(s.n)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "appearance-none border-0 bg-transparent p-0 text-sm disabled:cursor-default",
                  active ? "text-[var(--site-ink)]" : "text-[var(--site-muted)]",
                  done && "hover:text-[var(--site-ink)]"
                )}
              >
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 h-px bg-[var(--site-line)]" aria-hidden="true">
        <div className="h-px bg-[var(--site-ink)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <dt className="text-xs text-[var(--site-muted)]">{label}</dt>
        <dd className="mt-1 text-sm whitespace-pre-wrap">{value}</dd>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-sm text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]"
        >
          Edit
        </button>
      )}
    </div>
  );
}
