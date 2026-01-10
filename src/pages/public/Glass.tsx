import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { SEO } from "../../components/SEO";

export default function Glass() {
  return (
    <>
      <SEO
        title="Glass + Trim Service | Crisp, Streak-Free"
        description="Glass and trim detailing service. Streak-free windows and clean trim for a professional finish."
        canonical="https://dds.harryludemann.com/glass"
      />
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-600/10 blur-2xl" />
        
        <div className="relative">
          <div className="relative h-64 sm:h-80 md:h-96 bg-slate-100">
            <img
              src="/images/glass.webp"
              alt="Glass and trim detailing result"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-white">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Glass + trim</h1>
                <div className="mt-2 text-lg sm:text-xl text-white/90">Crisp, streak-free</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10">
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
              A high-contrast clean that makes the car look sharper instantly — clear glass, tidy trim, finished edges.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
        <div className="rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5 p-6 sm:p-7">
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-4">Highlights</div>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>Streak-free visibility</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>Sharper lines around trim</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>Cleaner 'finished' look overall</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5 p-6 sm:p-7">
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-4">Ideal for</div>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>Cars with hazy glass or fingerprints</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>Anyone who notices the small details</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span>Finishing touch before an event</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-slate-50 ring-1 ring-black/5 p-6 sm:p-7">
        <div className="text-base font-extrabold tracking-tight text-slate-900 mb-4">What's included</div>
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>Interior + exterior glass cleaned</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>Trim wipe-down and tidy finishing</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>Final touch-up pass (missed spots fixed)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>Detail focus on edges and corners</span>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5 p-6 sm:p-7">
        <div className="text-base font-extrabold tracking-tight text-slate-900 mb-4">What to expect</div>
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>We'll prioritise visibility and clean lines</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>A final quality pass before handover</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
            <span>Choose a day + drop-off window that fits your schedule</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80">
        <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          ← Back to home
        </Link>
        <Link to="/book" className="inline-block">
          <Button className="rounded-2xl px-8 py-3.5 text-base font-semibold shadow-sm hover:shadow-md transition-shadow">Check availability</Button>
        </Link>
      </div>
      </div>
    </>
  );
}
