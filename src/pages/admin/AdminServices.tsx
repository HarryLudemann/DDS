import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import type { Service } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Page } from "../../components/layout/Page";
import { fmtMoney } from "../../utils/format";
import { clsx } from "clsx";

type Draft = Partial<Service> & {
  includesText?: string;
  idealForText?: string;
};

function toCents(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function fromCents(cents: number) {
  return ((cents ?? 0) / 100).toFixed(2);
}

function toLines(v: unknown): string {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join("\n");
  return "";
}

function parseLines(v: string): string[] {
  return v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminServices() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    active: true,
    duration_mins: 60,
    price_cents: 0,
    sort_order: 0,
    includes: [],
    ideal_for: [],
    includesText: "",
    idealForText: "",
  });

  const isEditing = useMemo(() => !!editingId, [editingId]);

  async function load() {
    setLoading(true);
    setStatus(null);

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (error) setStatus(error.message);
    setRows((data ?? []) as Service[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setDraft({
      active: true,
      duration_mins: 60,
      price_cents: 0,
      sort_order: 0,
      includes: [],
      ideal_for: [],
      includesText: "",
      idealForText: "",
    });
    setStatus(null);
  }

  async function save() {
    setSaving(true);
    setStatus(null);

    try {
      const title = (draft.title ?? "").trim();
      if (!title) throw new Error("Title is required.");
      const duration = Number(draft.duration_mins ?? 0);
      if (!Number.isFinite(duration) || duration < 15) throw new Error("Duration must be at least 15 minutes.");
      const price = Number(draft.price_cents ?? 0);
      if (!Number.isFinite(price) || price < 0) throw new Error("Price must be 0 or more.");

      const payload = {
        title,
        subtitle: (draft.subtitle ?? "").trim() || null,
        summary: (draft.summary ?? "").trim() || null,
        description: (draft.description ?? "").trim() || null,
        includes: parseLines(draft.includesText ?? ""),
        ideal_for: parseLines(draft.idealForText ?? ""),
        duration_mins: duration,
        price_cents: price,
        active: !!draft.active,
        sort_order: Number(draft.sort_order ?? 0) || 0,
      };

      if (editingId) {
        const { error } = await supabase.from("services").update(payload).eq("id", editingId);
        if (error) throw error;
        setStatus("Service updated.");
      } else {
        const { error } = await supabase.from("services").insert(payload).select("id").single();
        if (error) throw error;
        setStatus("Service created.");
      }

      try {
        window.localStorage.setItem("dds_services_updated_at", String(Date.now()));
      } catch {
      }
      window.dispatchEvent(new Event("dds_services_updated"));

      resetForm();
      await load();
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setDraft({
      title: s.title,
      subtitle: s.subtitle ?? "",
      summary: s.summary ?? "",
      description: s.description ?? "",
      duration_mins: s.duration_mins,
      price_cents: s.price_cents,
      active: s.active,
      sort_order: s.sort_order,
      includes: s.includes ?? [],
      ideal_for: s.ideal_for ?? [],
      includesText: toLines(s.includes),
      idealForText: toLines(s.ideal_for),
    });
    setStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActive(s: Service) {
    setStatus(null);
    const { error } = await supabase.from("services").update({ active: !s.active }).eq("id", s.id);
    if (error) setStatus(error.message);
    else await load();
  }

  async function remove(s: Service) {
    if (!confirm(`Delete "${s.title}"? This can't be undone.`)) return;
    setStatus(null);

    const { error } = await supabase.from("services").delete().eq("id", s.id);
    if (error) {
      // likely blocked if referenced by bookings (FK restrict)
      setStatus(error.message);
    } else {
      await load();
      setStatus("Service deleted.");
    }
  }

  return (
    <Page>
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 truncate">Services</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage all your services. Edit titles, prices, durations, and what's included. Changes appear on the frontend immediately.
            </p>
          </div>
          <Link to="/admin">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>

        {status && (
          <div className="rounded-2xl bg-white ring-1 ring-black/10 px-4 py-3 text-sm text-slate-700">
            {status}
          </div>
        )}

        {/* Editor */}
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm font-extrabold text-slate-900">
              {isEditing ? "Edit service" : "Add a new service"}
            </div>
            {isEditing && (
              <button className="text-sm font-semibold text-slate-600 hover:text-slate-900" onClick={resetForm}>
                Cancel editing
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Title *</label>
              <Input
                className="mt-2"
                value={draft.title ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Full Detail Inside + Out"
              />
            </div>

            <div className="min-w-0">
              <label className="text-sm font-semibold text-slate-700">Subtitle</label>
              <Input
                className="mt-2"
                value={draft.subtitle ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                placeholder="e.g. Full reset (3–5 hrs)"
              />
            </div>

            <div className="min-w-0">
              <label className="text-sm font-semibold text-slate-700">Price (NZD) *</label>
              <Input
                className="mt-2"
                inputMode="decimal"
                value={fromCents(Number(draft.price_cents ?? 0))}
                onChange={(e) => setDraft((d) => ({ ...d, price_cents: toCents(e.target.value) }))}
                placeholder="0.00"
              />
            </div>

            <div className="min-w-0">
              <label className="text-sm font-semibold text-slate-700">Duration (minutes) *</label>
              <Input
                className="mt-2"
                type="number"
                min={15}
                step={15}
                value={Number(draft.duration_mins ?? 60)}
                onChange={(e) => setDraft((d) => ({ ...d, duration_mins: Number(e.target.value) }))}
              />
            </div>

            <div className="min-w-0">
              <label className="text-sm font-semibold text-slate-700">Sort order</label>
              <Input
                className="mt-2"
                type="number"
                step={1}
                value={Number(draft.sort_order ?? 0)}
                onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-sm font-semibold text-slate-700">Summary</label>
            <Textarea
              className="mt-2"
              rows={2}
              value={draft.summary ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              placeholder="Brief description shown on service cards"
            />
          </div>

          <div className="min-w-0">
            <label className="text-sm font-semibold text-slate-700">Full Description</label>
            <Textarea
              className="mt-2"
              rows={4}
              value={draft.description ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Detailed description of what's included"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="text-sm font-semibold text-slate-700">What's Included (one per line)</label>
              <Textarea
                className="mt-2"
                rows={6}
                value={draft.includesText ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, includesText: e.target.value }))}
                placeholder="Hand wash&#10;Wheels / tyres clean&#10;Interior vacuum"
              />
            </div>

            <div className="min-w-0">
              <label className="text-sm font-semibold text-slate-700">Ideal For (one per line)</label>
              <Textarea
                className="mt-2"
                rows={6}
                value={draft.idealForText ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, idealForText: e.target.value }))}
                placeholder="Regular customers&#10;Pre-sale&#10;Busy people"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={!!draft.active}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                className="h-4 w-4 rounded border-black/20"
              />
              Active (visible to customers)
            </label>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : isEditing ? "Save changes" : "Create service"}
              </Button>
            </div>
          </div>
        </Card>

        {/* List */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between gap-3 min-w-0">
            <div className="text-sm font-extrabold text-slate-900">Current services</div>
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-900" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          <div className="divide-y divide-black/5">
            {rows.map((s) => (
              <div key={s.id} className="p-5 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 truncate">{s.title}</div>
                      <span
                        className={clsx(
                          "text-xs font-semibold rounded-full px-2 py-1 shrink-0",
                          s.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {s.active ? "Active" : "Hidden"}
                      </span>
                    </div>

                    {s.subtitle && (
                      <div className="mt-1 text-sm text-slate-600">{s.subtitle}</div>
                    )}

                    <div className="mt-1 text-sm text-slate-600">
                      {fmtMoney(s.price_cents)} · {s.duration_mins} mins · Sort {s.sort_order}
                    </div>

                    {s.summary && (
                      <div className="mt-2 text-sm text-slate-700 break-words">{s.summary}</div>
                    )}

                    {s.includes && s.includes.length > 0 && (
                      <div className="mt-2 text-xs text-slate-600">
                        Includes: {s.includes.slice(0, 3).join(", ")}
                        {s.includes.length > 3 && ` +${s.includes.length - 3} more`}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="secondary" onClick={() => startEdit(s)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => toggleActive(s)}>
                      {s.active ? "Hide" : "Show"}
                    </Button>
                    <Button variant="ghost" onClick={() => remove(s)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {rows.length === 0 && !loading && (
              <div className="p-6 text-sm text-slate-600">No services yet. Add your first one above.</div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
