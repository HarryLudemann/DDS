
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
        highlights: string[];
        includes: string[];
        idealFor: string[];
        whatToExpect: string[];
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
      <section className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-600/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-slate-900/5 blur-2xl" />

        <div className="relative p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 min-w-0">
              <div className="flex flex-wrap gap-2">
                <Pill>Wellington</Pill>
                <Pill>Studio drop-off</Pill>
                <Pill>Book online</Pill>
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Studio-grade detailing.
                <span className="block text-indigo-600">A cleaner car, without the guesswork.</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-prose">
                Choose a package, pick an available time, and you’re locked in. Add notes for any priority areas — Dylan confirms details after booking.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/book" className="w-full sm:w-auto">
                  <Button className="w-full rounded-2xl px-7 py-3 text-base">Check times</Button>
                </Link>
                <Link to="/services" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full rounded-2xl px-7 py-3 text-base">See prices</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase text-white/70">How it works</div>
                    <div className="mt-2 text-xl font-extrabold tracking-tight">3 steps. No overlap.</div>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/15 px-3 py-2 text-xs font-extrabold">
                    DDS
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-extrabold">1) Pick a package</div>
                    <div className="mt-1 text-sm text-white/80">Clear inclusions.</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-extrabold">2) Choose a time</div>
                    <div className="mt-1 text-sm text-white/80">Only valid starts show.</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-extrabold">3) Drop off</div>
                    <div className="mt-1 text-sm text-white/80">Notes welcome — we confirm after.</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <Link to="/book" className="w-full">
                    <Button variant="inverted" className="w-full rounded-2xl px-6 py-3 ring-1 ring-white/15">Book online</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
              desc: "A focused interior reset that lifts the overall feel of the cabin — clean, tidy and comfortable.",
              highlights: [
                "Fresh, non-greasy finish on plastics",
                "Better smell and overall feel",
                "Cleaner lines and touch points",
              ],
              includes: [
                "Thorough vacuum (seats, mats, footwells)",
                "Wipe-down of dash/console/doors",
                "Detail brushes for vents and tight areas",
                "Glass cleaned inside for clarity",
              ],
              idealFor: [
                "Daily drivers",
                "Cars with dust, crumbs, and light grime",
                "Before selling or returning a lease",
              ],
              whatToExpect: [
                "Drop-off at the studio",
                "We’ll focus on the high-impact areas first",
                "You can leave notes for any priority spots",
              ],
              src: "/images/interior.webp",
              alt: "Interior detailing result",
            },
            {
              title: "Paint gloss",
              sub: "Decon + finish",
              desc: "A careful exterior process aimed at bringing back gloss and clarity — the kind of finish you notice in the sun.",
              highlights: [
                "Smoother paint feel",
                "Deeper gloss and cleaner reflections",
                "Sharper overall appearance",
              ],
              includes: [
                "Safe wash process (minimising swirl risk)",
                "Decontamination step to remove build-up",
                "Wheel and tyre clean for a finished look",
                "Final wipe-down / finish for gloss",
              ],
              idealFor: [
                "Cars that feel rough after washing",
                "Paint that looks dull or hazy",
                "Anyone wanting a clean, crisp exterior",
              ],
              whatToExpect: [
                "We’ll assess paint condition on arrival",
                "We choose the safest process for your paint",
                "You’ll get a clear before/after result",
              ],
              src: "/images/paint.webp",
              alt: "Paint finish result",
            },
            {
              title: "Glass + trim",
              sub: "Crisp, streak-free",
              desc: "A high-contrast clean that makes the car look sharper instantly — clear glass, tidy trim, finished edges.",
              highlights: [
                "Streak-free visibility",
                "Sharper lines around trim",
                "Cleaner ‘finished’ look overall",
              ],
              includes: [
                "Interior + exterior glass cleaned",
                "Trim wipe-down and tidy finishing",
                "Final touch-up pass (missed spots fixed)",
                "Detail focus on edges and corners",
              ],
              idealFor: [
                "Cars with hazy glass or fingerprints",
                "Anyone who notices the small details",
                "Finishing touch before an event",
              ],
              whatToExpect: [
                "We’ll prioritise visibility and clean lines",
                "A final quality pass before handover",
                "Book a time that fits your schedule",
              ],
              src: "/images/glass.webp",
              alt: "Glass and trim detailing result",
            },
          ].map((x) => (
            <button
              key={x.title}
              type="button"
              onClick={() => setActiveResult(x)}
              className="rounded-3xl bg-white overflow-hidden text-left border-0 shadow-none transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/book" className="inline-block relative z-10">
              <Button className="rounded-2xl px-6 py-3">Check times</Button>
            </Link>
            <Link to="/services" className="inline-block relative z-10">
              <Button variant="secondary" className="rounded-2xl px-6 py-3">
                See what’s included
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Why DDS"
          title="Detailing that’s built to be consistent"
          desc="DDS is studio drop-off only in Wellington. The focus is simple: clear packages, careful work, and tidy finishing — without the back-and-forth."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {[ 
            {
              t: "Clear packages, clear outcomes",
              d: "Pricing and inclusions are laid out up front so you know what you’re booking before you choose a time.",
            },
            {
              t: "Careful workflow + tidy finishing",
              d: "We focus on the areas that change the look and feel most, then do a final pass to catch the small details.",
            },
            {
              t: "Studio setup",
              d: "A controlled environment and lighting helps keep results consistent and avoids rushing around the weather.",
            },
            {
              t: "Simple communication",
              d: "Add notes when you book. Dylan confirms details after booking so expectations are aligned before drop-off.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-3xl bg-white ring-1 ring-black/5 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-10 w-10 rounded-2xl bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15 grid place-items-center text-sm font-extrabold">
                  {x.t.split(" ")[0].slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900">{x.t}</div>
                  <div className="mt-2 text-sm text-slate-600">{x.d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-extrabold">Not sure what to book?</div>
              <p className="mt-2 text-sm text-white/80 max-w-prose">
                Start with the closest package — leave notes about any priority areas. Dylan will confirm details after booking.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-2">
              <Link to="/services" className="w-full md:w-auto">
                <Button variant="inverted" className="w-full md:w-auto rounded-2xl px-6 py-3 ring-1 ring-white/15">
                  See prices
                </Button>
              </Link>
              <Link to="/book" className="w-full md:w-auto">
                <Button className="w-full md:w-auto rounded-2xl px-6 py-3">Check times</Button>
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

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setActiveResult(null)}
                className="absolute right-3 top-3 z-10 rounded-xl bg-white/90 px-3 py-2 text-slate-700 ring-1 ring-black/10 hover:bg-white"
              >
                <span className="sr-only">Close</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>

              <div className="grid lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="relative h-56 sm:h-72 lg:h-full lg:min-h-[640px] bg-slate-100">
                    <img
                      src={activeResult.src}
                      alt={activeResult.alt}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                    <div className="absolute bottom-4 left-4 right-14">
                      <div className="text-white">
                        <div className="text-lg font-extrabold tracking-tight">{activeResult.title}</div>
                        <div className="mt-1 text-sm text-white/80">{activeResult.sub}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="max-h-[72vh] lg:max-h-[640px] overflow-y-auto p-5 sm:p-7">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15 px-3 py-1 text-xs font-semibold">
                        Studio drop-off
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-black/5 px-3 py-1 text-xs font-semibold">
                        Wellington
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-black/5 px-3 py-1 text-xs font-semibold">
                        Live availability
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-slate-600">{activeResult.desc}</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-5">
                        <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Highlights</div>
                        <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-slate-700 marker:text-indigo-400">
                          {activeResult.highlights.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-5">
                        <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Ideal for</div>
                        <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-slate-700 marker:text-indigo-400">
                          {activeResult.idealFor.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 ring-1 ring-black/5 p-5">
                      <div className="text-sm font-extrabold tracking-tight text-slate-900">What’s included</div>
                      <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-slate-700 marker:text-indigo-400">
                        {activeResult.includes.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 rounded-2xl bg-white ring-1 ring-black/5 p-5">
                      <div className="text-sm font-extrabold tracking-tight text-slate-900">What to expect</div>
                      <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-slate-700 marker:text-indigo-400">
                        {activeResult.whatToExpect.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </div>

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

                    <div className="mt-4 text-xs text-slate-500">
                      Tip: choose the closest package/time — you can add notes and Dylan will confirm details after booking.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

