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
        <div className="grid gap-5 lg:grid-cols-2">
          {services.map((s) => (
            <Card
              key={s.id}
              className="relative flex flex-col gap-5 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-extrabold tracking-tight whitespace-normal break-normal hyphens-auto leading-tight">{s.title}</div>
                  </div>
                  {s.subtitle && (
                    <div className="mt-1 text-sm text-muted">{s.subtitle}</div>
                  )}
                </div>

                <div className="shrink-0 sm:text-right">
                  <div className="text-lg font-extrabold">
                    From {fmtMoneyNZD(s.price_cents)}
                    <span className="ml-2 text-xs font-extrabold text-slate-500">{taxLabelShort()}</span>
                  </div>
                  <div className="mt-1 sm:mt-2 flex sm:justify-end">
                    <Pill>{s.duration_mins} mins</Pill>
                  </div>
                </div>
              </div>

              {s.summary && (
                <div className="text-sm text-slate-700">{s.summary}</div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {s.includes && s.includes.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-black/5 p-4">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Top inclusions</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {s.includes.slice(0, 4).map((x, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                          <span className="min-w-0">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.ideal_for && s.ideal_for.length > 0 && (
                  <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Ideal for</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.ideal_for.map((x, i) => (
                        <Pill key={i}>{x}</Pill>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <Link to={`/book?service=${encodeURIComponent(s.id)}`} className="w-full">
                  <Button className="w-full">Check availability</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
