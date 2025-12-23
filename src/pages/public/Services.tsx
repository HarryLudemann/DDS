import { Link } from "react-router-dom";
import { fmtMoneyNZD } from "../../utils/format";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { usePackages } from "../../hooks/usePackages";
import { accentClass, isMostPopular } from "../../utils/packageUi";

export default function Services() {
  const { packages, loading } = usePackages();

  return (
    <div className="space-y-10 overflow-x-clip">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Packages</h1>
          <p className="mt-2 text-muted max-w-2xl">
            Clear inclusions and starting prices. Exact time and details are confirmed after booking.
          </p>
        </div>
        <Link to="/book" className="shrink-0"><Button>Check availability</Button></Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {packages.map((p) => (
            <Card
              key={p.code}
              className={
                "relative flex flex-col gap-5 overflow-hidden " +
                (isMostPopular(p.code) ? "ring-2 ring-indigo-600/35" : "")
              }
            >
              <div className="flex items-start justify-between gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={"h-2.5 w-2.5 rounded-full bg-gradient-to-r shrink-0 " + accentClass(p.code)} />
                      <div className="text-lg font-extrabold tracking-tight truncate">{p.title}</div>
                    </div>
                    {isMostPopular(p.code) && (
                      <span className="inline-flex items-center rounded-full bg-indigo-600 text-white px-2.5 py-1 text-xs font-extrabold">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted">{p.subtitle}</div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-lg font-extrabold">From {fmtMoneyNZD(p.fromPriceCents)}</div>
                  <div className="mt-2 flex justify-end">
                    <Pill>Time varies</Pill>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-700">{p.summary}</div>

              <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
                  <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Ideal for</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.idealFor.map((x) => (
                      <Pill key={x}>{x}</Pill>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Link to={`/book?package=${encodeURIComponent(p.code)}`} className="w-full">
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
