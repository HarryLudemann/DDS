
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import type { Service } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { fmtMoney, fmtDuration } from "../../utils/format";

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h2>
      {desc && <p className="mt-2 text-sm sm:text-base text-slate-600">{desc}</p>}
    </div>
  );
}

function Feature({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-10 w-10 rounded-2xl bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15 grid place-items-center font-extrabold">
          ✓
        </div>
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/70 ring-1 ring-black/5 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeResult, setActiveResult] = useState<
    | null
    | {
        title: string;
        sub: string;
        desc: string;
        src: string;
        alt: string;
      }
  >(null);

  const topServices = useMemo(() => services.slice(0, 3), [services]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .limit(6);

      setServices((data ?? []) as Service[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Pill>Wellington</Pill>
            <Pill>Online booking</Pill>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Professional car detailing.
            <span className="block text-indigo-600">Book online in minutes.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-prose">
            Choose a service, pick a time that fits, and you’re done. Studio detailing for consistent results.
          </p>

          <div className="mt-6 hidden sm:flex flex-col sm:flex-row gap-3">
            <Link to="/book" className="w-full sm:w-auto">
              <Button className="w-full rounded-2xl px-7 py-3 text-base">Book Online</Button>
            </Link>
            <Link to="/services" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full rounded-2xl px-7 py-3 text-base">
                View packages
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 text-white ring-1 ring-white/10 p-6 sm:p-8 overflow-hidden">
          <div className="text-sm font-extrabold">How it works</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
              <div className="text-sm font-extrabold">1) Choose a service</div>
              <div className="text-sm text-white/75 mt-1">Clear pricing and duration.</div>
            </div>
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
              <div className="text-sm font-extrabold">2) Pick a time</div>
              <div className="text-sm text-white/75 mt-1">Only valid start times are shown.</div>
            </div>
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
              <div className="text-sm font-extrabold">3) Confirm details</div>
              <div className="text-sm text-white/75 mt-1">You’re locked in — no overlaps.</div>
            </div>
          </div>

          <div className="mt-6">
            <Link to="/book">
              <Button variant="inverted" className="w-full py-3 text-base rounded-2xl ring-1 ring-white/15">
                Book now
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 mt-2 grid gap-3 sm:grid-cols-3">
          <Feature title="Studio detailing" desc="No mobile service — consistent results in a controlled setup." />
          <Feature title="Real-time availability" desc="Bookings automatically remove conflicting times." />
          <Feature title="Clear packages" desc="Know the price and duration before you book." />
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Results"
          title="Details you can see"
          desc="A proper detail is about the small things: clean lines, clear glass, and a fresh interior feel."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Interior refresh",
              sub: "Seats, mats, plastics",
              desc: "Deep vacuum, wipe-down, and tidy finishing work to make the cabin feel fresh — without the greasy shine.",
              src: "/images/interior.webp",
              alt: "Interior detailing result",
            },
            {
              title: "Paint gloss",
              sub: "Decon + finish",
              desc: "A careful wash and decontamination step to remove build-up, followed by a finish that boosts gloss and clarity.",
              src: "/images/paint.webp",
              alt: "Paint finish result",
            },
            {
              title: "Glass + trim",
              sub: "Crisp, streak-free",
              desc: "Streak-free glass and clean trim details that sharpen the whole look — it’s the difference you notice immediately.",
              src: "/images/glass.webp",
              alt: "Glass and trim detailing result",
            },
          ].map((x) => (
            <button
              key={x.title}
              type="button"
              onClick={() => setActiveResult(x)}
              className="rounded-3xl bg-white overflow-hidden text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <img
                  src={x.src}
                  alt={x.alt}
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
                />
              </div>
              <div className="p-5">
                <div className="text-sm font-extrabold tracking-tight text-slate-900">{x.title}</div>
                <div className="mt-1 text-sm text-slate-600">{x.sub}</div>
                <div className="mt-3 text-xs font-semibold text-indigo-700">Tap to learn more</div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 relative z-10">
          <Link to="/services" className="inline-block relative z-10">
            <Button variant="secondary" className="rounded-2xl px-6 py-3">
              See what’s included
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Standards"
          title="Built to be reliable"
          desc="DDS is a new business — the goal is to earn trust through clear communication and consistent results."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Clear expectations",
              d: "Straightforward packages with clear duration and pricing up front.",
            },
            {
              t: "Careful, studio-only workflow",
              d: "A controlled setup for consistent quality, lighting and product application.",
            },
            {
              t: "Quality check before handover",
              d: "A simple checklist to make sure the essentials are done properly every time.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-3xl bg-white ring-1 ring-black/5 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-10 w-10 rounded-2xl bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15 grid place-items-center font-extrabold">
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900">{x.t}</div>
                  <div className="mt-2 text-sm text-slate-600">{x.d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-black/5 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-slate-900">Not sure what to book?</div>
              <p className="mt-2 text-sm text-slate-600 max-w-prose">
                Start with a package that matches your car’s condition — you can add notes and Dylan will confirm details.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-2">
              <Link to="/services" className="w-full md:w-auto">
                <Button variant="secondary" className="w-full md:w-auto rounded-2xl px-6 py-3">
                  See packages
                </Button>
              </Link>
              <Link to="/book" className="w-full md:w-auto">
                <Button className="w-full md:w-auto rounded-2xl px-6 py-3">Check availability</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Booking"
          title="A simple process"
          desc="Pick a package, choose a time that fits, and you’re locked in."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "Choose a service", d: "Clear pricing and duration." },
            { t: "Pick an available time", d: "Only valid start times shown." },
            { t: "Drop off at the studio", d: "You’ll receive details after booking." },
          ].map((x) => (
            <div key={x.t} className="rounded-3xl bg-white ring-1 ring-black/5 p-6">
              <div className="text-sm font-extrabold tracking-tight text-slate-900">{x.t}</div>
              <div className="mt-2 text-sm text-slate-600">{x.d}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-slate-900 text-white ring-1 ring-white/10 p-6 sm:p-8 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0">
              <div className="text-sm font-extrabold">Ready to book?</div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Secure a time that fits — no back-and-forth.
              </div>
              <p className="mt-3 text-sm text-white/80 max-w-prose">
                Choose a package first and the booking system will only show start times that can actually fit the job.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Link to="/book" className="block">
                <Button variant="inverted" className="w-full md:w-auto rounded-2xl px-7 py-3 text-base ring-1 ring-white/15">
                  Book online
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Services"
          title="Popular options"
          desc="Choose a package that fits your car and your time. Book online in minutes."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {(loading ? Array.from({ length: 3 }) : topServices).map((s: any, idx: number) => (
            <Card key={s?.id ?? idx} className="p-6 min-w-0">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-5 w-2/3 rounded bg-slate-100" />
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-10 w-full rounded-2xl bg-slate-100" />
                </div>
              ) : (
                <div className="flex flex-col h-full min-w-0">
                  <div className="text-base font-extrabold tracking-tight text-slate-900 truncate">
                    {s.title}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {fmtMoney(s.price_cents)} · {fmtDuration(s.duration_mins)}
                  </div>
                  {s.description && (
                    <p className="mt-3 text-sm text-slate-700 break-words">
                      {s.description}
                    </p>
                  )}

                  <div className="mt-auto pt-5 flex flex-col gap-2">
                    <Link to={`/book?service=${encodeURIComponent(String(s.id))}`} className="w-full">
                      <Button className="w-full rounded-2xl py-3">Book this service</Button>
                    </Link>
                    <Link to="/services" className="w-full">
                      <Button variant="secondary" className="w-full rounded-2xl py-3">
                        View all services
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="FAQ"
          title="Quick answers"
          desc="Everything you need to know before booking."
        />

        <div className="grid gap-3">
          {[
            {
              q: "Do you offer mobile detailing?",
              a: "No — DDS is studio drop-off only in Wellington. This helps keep results consistent and high-quality.",
            },
            {
              q: "How do booking times work for longer services?",
              a: "You choose a service first. The system only shows start times where the full duration fits inside working hours and doesn’t overlap other bookings.",
            },
            {
              q: "What info do I need to provide?",
              a: "Name and email are required. Phone, vehicle and notes are optional but helpful.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="rounded-2xl bg-white ring-1 ring-black/5 p-5"
            >
              <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
                {item.q}
              </summary>
              <div className="mt-3 text-sm text-slate-600">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {activeResult && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={activeResult.title}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActiveResult(null)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="relative aspect-[16/10] bg-slate-100">
                <img
                  src={activeResult.src}
                  alt={activeResult.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xl font-extrabold tracking-tight text-slate-900">
                      {activeResult.title}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">{activeResult.sub}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveResult(null)}
                    className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-black/5 hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>

                <p className="mt-4 text-sm text-slate-600">{activeResult.desc}</p>

                <div className="mt-6 flex flex-col sm:flex-row gap-2">
                  <Link to="/services" className="w-full sm:w-auto" onClick={() => setActiveResult(null)}>
                    <Button variant="secondary" className="w-full sm:w-auto rounded-2xl px-6 py-3">
                      View packages
                    </Button>
                  </Link>
                  <Link to="/book" className="w-full sm:w-auto" onClick={() => setActiveResult(null)}>
                    <Button className="w-full sm:w-auto rounded-2xl px-6 py-3">Book online</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

