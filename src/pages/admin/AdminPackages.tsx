import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAllServices } from "../../lib/firebase/store";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { PACKAGES } from "../../catalog/packages";

type ServiceRow = { id: string; title: string };

type PackageRow = {
  code: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  includes: unknown;
  ideal_for: unknown;
  from_price_cents: number | null;
  active: boolean | null;
  service_id: string | null;
};

function fromCents(cents: number) {
  return ((cents ?? 0) / 100).toFixed(2);
}

function toLines(v: unknown): string {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join("\n");
  return "";
}

export default function AdminPackages() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [rows, setRows] = useState<PackageRow[]>([]);

  const codes = useMemo(() => PACKAGES.map((p) => p.code), []);
  const [activeCode, setActiveCode] = useState<string>(codes[0] ?? "");

  const activeRow = useMemo(
    () => rows.find((r) => r.code === activeCode) ?? null,
    [rows, activeCode]
  );

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [price, setPrice] = useState("0.00");
  const [includesText, setIncludesText] = useState("");
  const [idealForText, setIdealForText] = useState("");
  const [active, setActive] = useState(true);
  const [serviceId, setServiceId] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setStatus(null);

      try {
        const svcData = await listAllServices();
        if (!alive) return;
        setServices(svcData.map((s) => ({ id: s.id, title: s.title })));
        setRows(
          PACKAGES.map((p) => ({
            code: p.code,
            title: p.title,
            subtitle: p.subtitle,
            summary: p.summary,
            includes: p.includes,
            ideal_for: p.idealFor,
            from_price_cents: p.fromPriceCents,
            active: true,
            service_id: svcData.find((s) => s.title === p.title)?.id ?? null,
          }))
        );
      } catch (e) {
        if (alive) setStatus(e instanceof Error ? e.message : "Failed to load.");
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const fallback = PACKAGES.find((p) => p.code === activeCode) ?? PACKAGES[0];
    const row = activeRow;

    setTitle((row?.title ?? fallback?.title ?? "").trim());
    setSubtitle((row?.subtitle ?? fallback?.subtitle ?? "").trim());
    setSummary((row?.summary ?? fallback?.summary ?? "").trim());
    setPrice(fromCents(Number(row?.from_price_cents ?? fallback?.fromPriceCents ?? 0)));
    setIncludesText(toLines(row?.includes).trim() || (fallback?.includes ?? []).join("\n"));
    setIdealForText(toLines(row?.ideal_for).trim() || (fallback?.idealFor ?? []).join("\n"));
    setActive(row?.active ?? true);
    setServiceId(row?.service_id ?? "");
  }, [activeCode, activeRow]);

  async function save() {
    if (!activeCode) return;

    setSaving(true);
    setStatus("Package copy is now edited as services. Use Admin → Services.");
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Packages</h1>
          <p className="mt-1 text-sm text-slate-600">
            Edit package names, pricing, and inclusions. This affects the public site.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {status && (
        <div className="rounded-2xl bg-white ring-1 ring-black/10 px-4 py-3 text-sm text-slate-700">{status}</div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">Loading…</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="space-y-3 lg:col-span-1">
            <div className="text-sm font-extrabold text-slate-900">Package</div>
            <Select value={activeCode} onChange={(e) => setActiveCode(e.target.value)}>
              {codes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <div className="text-xs text-slate-500">
              Package codes are fixed. You can edit the content, or hide a package.
            </div>
          </Card>

          <Card className="space-y-4 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">From price (NZD)</label>
                <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Subtitle</label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Summary</label>
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Includes (one per line)</label>
                <Textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Best for (one per line)</label>
                <Textarea value={idealForText} onChange={(e) => setIdealForText(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-700">Availability mapping (optional)</label>
                <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  <option value="">(Not set)</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </Select>
                <div className="text-xs text-slate-500">
                  Links this package to an internal schedule profile.
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-700">Active</label>
                <button
                  type="button"
                  onClick={() => setActive((x) => !x)}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold ring-1 ring-black/10 bg-white hover:bg-slate-50"
                >
                  {active ? "Active" : "Hidden"}
                </button>
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save package"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
