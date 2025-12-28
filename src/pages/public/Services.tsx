import { Link } from "react-router-dom";
import { fmtMoneyNZD } from "../../utils/format";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { useServices } from "../../hooks/useServices";
import { taxLabelShort } from "../../utils/tax";

export default function Services() {
  const { services, loading } = useServices();

  return (
    <div className="space-y-10 overflow-x-clip">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Services</h1>
          <p className="mt-2 text-muted max-w-2xl">
            Clear inclusions and starting prices. Exact time and details are confirmed after booking.
          </p>
        </div>
        <Link to="/book" className="shrink-0"><Button>Check availability</Button></Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : services.length === 0 ? (
        <div className="rounded-3xl bg-white ring-1 ring-black/5 p-8 text-center">
          <div className="text-sm font-semibold text-slate-900">No services available</div>
          <div className="mt-2 text-sm text-slate-600">Check back later or contact us for more information.</div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {services.map((s) => (
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
                      From {fmtMoneyNZD(s.price_cents)}
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

                {/* Includes and Ideal For */}
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  {s.includes && s.includes.length > 0 && (
                    <div className="rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 p-3">
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

                  {s.ideal_for && s.ideal_for.length > 0 && (
                    <div className="rounded-xl bg-white ring-1 ring-slate-200/60 p-3">
                      <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500 mb-2">Ideal for</div>
                      <div className="flex flex-wrap gap-2">
                        {s.ideal_for.map((x, i) => (
                          <Pill key={i} className="text-xs">{x}</Pill>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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
      )}
    </div>
  );
}
