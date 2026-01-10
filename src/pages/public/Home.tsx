import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { fmtMoney } from "../../utils/format";
import { useServices } from "../../hooks/useServices";
import { taxLabelShort } from "../../utils/tax";
import { SEO } from "../../components/SEO";

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

export default function Home() {
  const { services } = useServices();
  const topServices = useMemo(() => services.slice(0, 3), [services]);

  return (
    <>
      <SEO
        title="Dylan's Detailing Service | Professional Car Detailing in Wellington"
        description="Professional car detailing in Wellington. Choose a service, pick an available time, and book online. Interior refresh, paint gloss, and glass + trim services."
        canonical="https://dds.harryludemann.com/"
      />
      <div className="space-y-10 sm:space-y-14 md:space-y-16 lg:space-y-20 overflow-x-clip">
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5">
        <div className="hidden sm:block absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-600/10 blur-2xl" />
        <div className="hidden sm:block absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-slate-900/5 blur-2xl" />

        <div className="relative p-5 sm:p-8 md:p-10">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Studio-grade detailing.
                <span className="block text-indigo-600">A cleaner car, without the guesswork.</span>
              </h1>

              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-prose leading-relaxed">
                Choose a service, pick a day + drop-off window, and you're in. Add notes for any priority areas — Dylan confirms the exact time after booking.
              </p>

              <div className="mt-6 sm:mt-8">
                <Link to="/book" className="inline-block group">
                  <Button className="rounded-2xl px-8 py-3.5 text-base font-semibold shadow-sm hover:shadow-md transition-shadow">Check availability</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 mt-6 lg:mt-0">
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 md:p-7 ring-1 ring-black/10">
                <div className="mb-6">
                  <div className="text-xs font-semibold tracking-wider uppercase text-white/60">How it works</div>
                  <div className="mt-2 text-xl font-extrabold tracking-tight">3 simple steps</div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <div>
                      <div className="text-sm font-extrabold">Pick a service</div>
                      <div className="mt-1 text-sm text-white/70">Clear inclusions, upfront pricing.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <div>
                      <div className="text-sm font-extrabold">Choose a day + window</div>
                      <div className="mt-1 text-sm text-white/70">We'll confirm the exact drop-off time.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <div>
                      <div className="text-sm font-extrabold">Drop off</div>
                      <div className="mt-1 text-sm text-white/70">Notes welcome — we confirm after.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <SectionTitle
          eyebrow="Results"
          title="Details you can see"
          desc="A proper detail is about the small things: clean lines, clear glass, and a fresh interior feel."
        />

        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {[
            {
              title: "Interior refresh",
              sub: "Seats, mats, plastics",
              src: "/images/interior.webp",
              alt: "Interior detailing result",
              to: "/interior",
            },
            {
              title: "Paint gloss",
              sub: "Decon + finish",
              src: "/images/paint.webp",
              alt: "Paint finish result",
              to: "/paint",
            },
            {
              title: "Glass + trim",
              sub: "Crisp, streak-free",
              src: "/images/glass.webp",
              alt: "Glass and trim detailing result",
              to: "/glass",
            },
          ].map((x) => (
            <Link
              key={x.title}
              to={x.to}
              className="w-full rounded-2xl sm:rounded-3xl bg-white overflow-hidden text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ring-1 ring-black/5"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <img
                  src={x.src}
                  alt={x.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-5 sm:p-6">
                <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">{x.title}</div>
                <div className="mt-1.5 text-sm text-slate-600">{x.sub}</div>
                <div className="mt-3 text-xs font-semibold text-indigo-600">Learn more →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <SectionTitle
          eyebrow="Why DDS"
          title="Detailing that's built to be consistent"
          desc="The focus is simple: clear services, careful work, and tidy finishing — without the back-and-forth."
        />

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {[ 
            {
              t: "Clear services, clear outcomes",
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
            <div key={x.t} className="rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5 p-5 sm:p-6">
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

            <div className="rounded-2xl sm:rounded-3xl bg-slate-50 ring-1 ring-black/5 p-5 sm:p-6 md:p-7">
          <div className="max-w-2xl">
            <div className="text-sm font-extrabold text-slate-900">Not sure what to book?</div>
            <p className="mt-2 text-sm text-slate-600">
              Start with the closest service — leave notes about any priority areas. Dylan will confirm details after booking.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <SectionTitle
          eyebrow="Services"
          title="What we offer"
          desc="Clear inclusions and upfront pricing. Select a service to see availability."
        />

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          {topServices.map((s) => (
            <Card
              key={s.id}
              className="relative flex flex-col overflow-hidden group hover:shadow-lg transition-shadow duration-200"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-600/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
              
              <div className="relative p-5 sm:p-6 flex flex-col flex-1">
                {/* Header Section */}
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight break-words mb-1.5">
                    {s.title}
                  </h3>
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
                  <div className="mb-4 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 p-3">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500 mb-2">Top inclusions</div>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {s.includes.slice(0, 4).map((x, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                          <span className="min-w-0 leading-relaxed">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-auto pt-1">
                  <Link to={`/book?service=${encodeURIComponent(s.id)}`} className="block w-full">
                    <Button className="w-full">Check availability</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <SectionTitle
          eyebrow="FAQ"
          title="Quick answers"
          desc="Everything you need to know before booking."
        />

        <div className="grid gap-3 sm:gap-4">
          {[
            {
              q: "Do you offer mobile detailing?",
              a: "No — this is studio drop-off only. A controlled setup helps keep results consistent and avoids weather interruptions.",
            },
            {
              q: "How does booking work?",
              a: "Choose a service, pick a day + preferred drop-off window, and submit your details. No payment is taken online — Dylan will message you to confirm the exact drop-off time and final details.",
            },
            {
              q: "How long does it take?",
              a: "Times vary by service, vehicle size, and condition. After booking, you'll get a confirmed drop-off time and a realistic timeframe for pickup.",
            },
            {
              q: "What’s included in the price?",
              a: "Each service lists the key inclusions and a starting price. Final pricing can change for larger vehicles or heavy soiling — if anything needs an inspection-based quote, you'll be contacted first.",
            },
            {
              q: "Is GST included?",
              a: "Yes — where GST applies, displayed prices are shown in NZD with GST indicated. If a final quote is required, it will be confirmed with you before any work begins.",
            },
            {
              q: "Do I need to do anything before dropping the car off?",
              a: "If possible, remove personal items and anything fragile. If there are priority areas (pet hair, stains, sand, child seats), add a note during booking so the time estimate is accurate.",
            },
            {
              q: "What’s your cancellation / reschedule policy?",
              a: "Life happens — if you need to cancel or reschedule, please message as early as you can so the slot can be offered to someone else.",
            },
            {
              q: "What details do I need to provide?",
              a: "Name and email are required. Phone, vehicle size, and notes are strongly recommended so the booking can be confirmed quickly and quoted correctly.",
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
      </div>
    </>
  );
}

