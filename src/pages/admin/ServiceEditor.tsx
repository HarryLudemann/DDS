import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createService, getService, listAllServices, updateService } from "../../lib/firebase/store";
import { notifyServicesUpdated } from "../../lib/site/live";
import { AdminBanner, AdminButton, AdminField, AdminInput, AdminTextarea } from "./ui";
import { AdminChrome } from "./AdminChrome";

type Draft = {
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  includesText: string;
  idealForText: string;
  durationMins: string;
  priceText: string;
  active: boolean;
};

const emptyDraft = (): Draft => ({
  title: "",
  subtitle: "",
  summary: "",
  description: "",
  includesText: "",
  idealForText: "",
  durationMins: "60",
  priceText: "",
  active: true,
});

function toLines(v: string[]) {
  return v.join("\n");
}

function parseLines(v: string) {
  return v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function ServiceEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [existingSort, setExistingSort] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const row = await getService(id);
        if (!alive) return;
        if (!row) {
          setStatus("That service was not found.");
          return;
        }
        setExistingSort(row.sort_order ?? 0);
        setDraft({
          title: row.title,
          subtitle: row.subtitle ?? "",
          summary: row.summary ?? "",
          description: row.description ?? "",
          includesText: toLines(row.includes ?? []),
          idealForText: toLines(row.ideal_for ?? []),
          durationMins: String(row.duration_mins),
          priceText: ((row.price_cents ?? 0) / 100).toFixed(2),
          active: row.active,
        });
      } catch (e) {
        if (alive) setStatus(e instanceof Error ? e.message : "Could not load service.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  async function save() {
    const title = draft.title.trim();
    if (!title) {
      setStatus("Add a title so it can appear on the site.");
      return;
    }
    const duration = Number(draft.durationMins);
    if (!Number.isFinite(duration) || duration < 15) {
      setStatus("Duration must be at least 15 minutes.");
      return;
    }
    const price = Number(draft.priceText);
    if (!Number.isFinite(price) || price < 0) {
      setStatus("Enter a starting price in NZD, e.g. 160.");
      return;
    }

    setSaving(true);
    setStatus(null);
    const payload = {
      title,
      subtitle: draft.subtitle.trim() || null,
      summary: draft.summary.trim() || null,
      description: draft.description.trim() || null,
      includes: parseLines(draft.includesText),
      ideal_for: parseLines(draft.idealForText),
      duration_mins: duration,
      price_cents: Math.round(price * 100),
      active: draft.active,
    };

    try {
      if (isNew) {
        const rows = await listAllServices();
        const maxSort = rows.reduce((n, s) => Math.max(n, s.sort_order), 0);
        await createService({ ...payload, sort_order: maxSort + 10 });
      } else if (id) {
        await updateService(id, { ...payload, sort_order: existingSort });
      }
      notifyServicesUpdated();
      nav("/admin?tab=services");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminChrome>
      <div className="max-w-3xl">
        <Link to="/admin?tab=services" className="text-sm text-[var(--admin-muted)] hover:text-[var(--admin-ink)]">
          ← Services
        </Link>
        <h2 className="mt-4 text-3xl font-medium tracking-tight">{isNew ? "New service" : "Edit service"}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--admin-muted)]">
          This is what customers see on the site and when they book. Duration also controls which drop-off times fit your hours.
        </p>

        {status && (
          <div className="mt-6">
            <AdminBanner>{status}</AdminBanner>
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-sm text-[var(--admin-muted)]">Loading…</p>
        ) : (
          <form
            className="mt-10 space-y-12"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <section className="space-y-5">
              <div>
                <h3 className="text-sm font-medium">Listing</h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">Name and starting price on cards, booking, and the detail page.</p>
              </div>
              <AdminField label="Title" htmlFor="svc-title">
                <AdminInput
                  id="svc-title"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="e.g. Full Detail Inside + Out"
                />
              </AdminField>
              <AdminField label="Subtitle" htmlFor="svc-sub" hint="Optional. Shown under the title, e.g. typical time.">
                <AdminInput
                  id="svc-sub"
                  value={draft.subtitle}
                  onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                  placeholder="e.g. Full reset (3–5 hrs)"
                />
              </AdminField>
              <div className="grid gap-5 sm:grid-cols-2">
                <AdminField label="Starting price (NZD)" htmlFor="svc-price" hint="GST included. Shown as “from”.">
                  <AdminInput
                    id="svc-price"
                    inputMode="decimal"
                    placeholder="160.00"
                    value={draft.priceText}
                    onChange={(e) => setDraft((d) => ({ ...d, priceText: e.target.value }))}
                  />
                </AdminField>
                <AdminField label="Duration (minutes)" htmlFor="svc-dur" hint="Used to fit bookings inside your hours.">
                  <AdminInput
                    id="svc-dur"
                    inputMode="numeric"
                    value={draft.durationMins}
                    onChange={(e) => setDraft((d) => ({ ...d, durationMins: e.target.value }))}
                  />
                </AdminField>
              </div>
            </section>

            <section className="space-y-5">
              <div>
                <h3 className="text-sm font-medium">Copy</h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">Short summary on cards. Longer description on the service page.</p>
              </div>
              <AdminField label="Summary" htmlFor="svc-sum">
                <AdminTextarea
                  id="svc-sum"
                  rows={3}
                  className="min-h-[5.5rem]"
                  value={draft.summary}
                  onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Description" htmlFor="svc-desc">
                <AdminTextarea
                  id="svc-desc"
                  rows={6}
                  className="min-h-[10rem]"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </AdminField>
            </section>

            <section className="space-y-5">
              <div>
                <h3 className="text-sm font-medium">Details</h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">One item per line. These become the lists on the service page.</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <AdminField label="What’s included" htmlFor="svc-inc">
                  <AdminTextarea
                    id="svc-inc"
                    rows={8}
                    className="min-h-[12rem]"
                    value={draft.includesText}
                    onChange={(e) => setDraft((d) => ({ ...d, includesText: e.target.value }))}
                    placeholder={"Hand wash\nWheels / tyres clean\nInterior vacuum"}
                  />
                </AdminField>
                <AdminField label="Ideal for" htmlFor="svc-ideal">
                  <AdminTextarea
                    id="svc-ideal"
                    rows={8}
                    className="min-h-[12rem]"
                    value={draft.idealForText}
                    onChange={(e) => setDraft((d) => ({ ...d, idealForText: e.target.value }))}
                    placeholder={"Regular customers\nPre-sale\nBusy weeks"}
                  />
                </AdminField>
              </div>
            </section>

            <section className="flex flex-col gap-4 border-t border-[var(--admin-line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                />
                <span>
                  <span className="font-medium">Visible on the site</span>
                  <span className="mt-0.5 block text-[var(--admin-muted)]">
                    Hidden services are removed from booking and the public pages.
                  </span>
                </span>
              </label>
              <div className="flex gap-2">
                <AdminButton variant="secondary" onClick={() => nav("/admin?tab=services")}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" disabled={saving}>
                  {saving ? "Saving…" : isNew ? "Create service" : "Save changes"}
                </AdminButton>
              </div>
            </section>
          </form>
        )}
      </div>
    </AdminChrome>
  );
}
