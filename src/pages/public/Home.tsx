import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { fmtMoney } from "../../utils/format";
import { usePackages } from "../../hooks/usePackages";
import { accentClass, isMostPopular } from "../../utils/packageUi";

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
  const { packages } = usePackages();
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

  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  const topPackages = useMemo(() => packages, [packages]);

  useEffect(() => {
    if (!activeResult) return;

    // Robust scroll lock: prevent background scroll WITHOUT jumping the page.
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    // Ensure modal content starts at the top.
    window.requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });

    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [activeResult]);

  useEffect(() => {
    if (!activeResult) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveResult(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeResult]);

  return (
    <div className="space-y-16 sm:space-y-20 overflow-x-clip">
      <section className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        <div className="hidden sm:block absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-600/10 blur-2xl" />
        <div className="hidden sm:block absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-slate-900/5 blur-2xl" />

        <div className="relative p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 min-w-0">
              <div className="flex flex-wrap gap-2">
                <Pill>Wellington</Pill>
                <Pill>Studio drop-off</Pill>
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Studio-grade detailing.
                <span className="block text-indigo-600">A cleaner car, without the guesswork.</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-prose">
                Choose a package, pick a day + drop-off window, and you’re in. Add notes for any priority areas — Dylan confirms the exact time after booking.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/book" className="w-full sm:w-auto">
                  <Button className="w-full rounded-2xl px-7 py-3 text-base">Check availability</Button>
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
                    <div className="mt-2 text-xl font-extrabold tracking-tight">3 simple steps</div>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/15 px-3 py-2 text-xs font-extrabold">
                    DDS
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-extrabold">Pick a package</div>
                    <div className="mt-1 text-sm text-white/80">Clear inclusions.</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-extrabold">Choose a day + window</div>
                    <div className="mt-1 text-sm text-white/80">We’ll confirm the exact drop-off time.</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-extrabold">Drop off</div>
                    <div className="mt-1 text-sm text-white/80">Notes welcome — we confirm after.</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <Link to="/book" className="w-full">
                    <Button variant="inverted" className="w-full rounded-2xl px-6 py-3 ring-1 ring-white/15">Check availability</Button>
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
                "Drop-off",
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
                "Choose a day + drop-off window that fits your schedule",
              ],
              src: "/images/glass.webp",
              alt: "Glass and trim detailing result",
            },
          ].map((x) => (
            <button
              key={x.title}
              type="button"
              onClick={() => setActiveResult(x)}
              className="w-full rounded-3xl bg-white overflow-hidden text-left border-0 shadow-none transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
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
              <Button className="rounded-2xl px-6 py-3">Check availability</Button>
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
          desc="The focus is simple: clear packages, careful work, and tidy finishing — without the back-and-forth."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {[ 
            {
              t: "Clear packages, clear outcomes",
              d: "Pricing and inclusions are laid out up front so you know what you’re booking before you choose a day + drop-off window.",
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
              <div className="relative pl-5">
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-indigo-500/60 via-indigo-400/30 to-sky-400/60" />
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
                <Button className="w-full md:w-auto rounded-2xl px-6 py-3">Check availability</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Packages"
          title="Packages"
          desc="Clear inclusions and starting prices. Check availability in minutes."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {topPackages.map((p) => (
            <Card
              key={p.code}
              className={
                "relative flex flex-col gap-5 overflow-hidden " +
                (isMostPopular(p.code) ? "ring-2 ring-indigo-600/35" : "")
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={"h-2.5 w-2.5 rounded-full bg-gradient-to-r shrink-0 " + accentClass(p.code)} />
                      <div className="text-lg font-extrabold tracking-tight whitespace-normal break-normal hyphens-auto leading-tight">{p.title}</div>
                    </div>
                    {isMostPopular(p.code) && (
                      <span className="inline-flex items-center rounded-full bg-indigo-600 text-white px-2.5 py-1 text-xs font-extrabold">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{p.subtitle}</div>
                </div>

                <div className="shrink-0 sm:text-right">
                  <div className="text-lg font-extrabold">From {fmtMoney(p.fromPriceCents)}</div>
                  <div className="mt-1 sm:mt-2 text-xs text-slate-500">Time varies</div>
                </div>
              </div>

              <div className="text-sm text-slate-700">{p.summary}</div>

              <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-4">
                <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Top inclusions</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {p.includes.slice(0, 4).map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className={"mt-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r " + accentClass(p.code)} />
                      <span className="min-w-0">{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <Link to={`/book?package=${encodeURIComponent(String(p.code))}`} className="w-full">
                  <Button className="w-full rounded-2xl py-3">Check availability</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="pt-2">
          <Link to="/services">
            <Button variant="secondary" className="rounded-2xl px-6 py-3">
              See packages + inclusions
            </Button>
          </Link>
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
              a: "No — drop-off only. This helps keep results consistent and high-quality.",
            },
            {
              q: "How do bookings work for longer packages?",
              a: "You choose a package first, then pick a day + window and select an available time inside it. Behind the scenes, the system only offers options that fit inside working hours and don’t overlap other bookings.",
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
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label={activeResult.title}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActiveResult(null)}
            className="fixed inset-0 bg-black/40"
          />

          <div className="relative flex min-h-[100svh] items-start justify-center p-3 sm:items-center sm:p-6">
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
                  <div ref={modalScrollRef} className="max-h-[72svh] lg:max-h-[640px] overflow-y-auto p-5 sm:p-7">
                    <div className="flex flex-wrap gap-2">
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
                        <Button className="w-full sm:w-auto rounded-2xl px-6 py-3">Check availability</Button>
                      </Link>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                      Tip: choose the closest package — you can add notes and Dylan will confirm details after booking.
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

