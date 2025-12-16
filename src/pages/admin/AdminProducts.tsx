import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import type { Product, ProductType } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Link } from "react-router-dom";

const empty: Partial<Product> = {
  type: "service",
  title: "",
  slug: "",
  description: "",
  price_cents: 0,
  currency: "NZD",
  cover_url: "",
  buy_url: "",
  active: true,
  sort_order: 0,
};

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Partial<Product>>(empty);
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });
    if (error) setStatus(error.message);
    else setItems((data ?? []) as Product[]);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    setStatus(null);
    if (!draft.title || !draft.slug || !draft.type) return setStatus("Title, slug, and type are required.");

    const payload = {
      type: draft.type as ProductType,
      title: draft.title,
      slug: draft.slug,
      description: draft.description || null,
      price_cents: Number(draft.price_cents ?? 0),
      currency: draft.currency || "NZD",
      cover_url: draft.cover_url || null,
      buy_url: draft.buy_url || null,
      active: !!draft.active,
      sort_order: Number(draft.sort_order ?? 0),
    };

    const { error } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id)
      : await supabase.from("products").insert(payload);

    if (error) setStatus(error.message);
    else {
      setStatus("Saved.");
      setDraft(empty);
      await refresh();
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    setStatus(error ? error.message : "Deleted.");
    await refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link className="text-sm underline" to="/admin">Back</Link>
      </div>

      {status && <p className="text-sm text-zinc-700">{status}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="font-medium">{draft.id ? "Edit" : "Add"} product</div>

          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={draft.type ?? "service"}
                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as ProductType }))}
              >
                <option value="service">Service</option>
                <option value="book">Book</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input className="mt-2" value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input className="mt-2" value={draft.slug ?? ""} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea className="mt-2" rows={4} value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Price (cents)</label>
                <Input className="mt-2" type="number" value={draft.price_cents ?? 0} onChange={(e) => setDraft((d) => ({ ...d, price_cents: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Sort</label>
                <Input className="mt-2" type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Cover URL (optional)</label>
                <Input className="mt-2" value={draft.cover_url ?? ""} onChange={(e) => setDraft((d) => ({ ...d, cover_url: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Buy URL (optional)</label>
                <Input className="mt-2" value={draft.buy_url ?? ""} onChange={(e) => setDraft((d) => ({ ...d, buy_url: e.target.value }))} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!draft.active}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              />
              Active
            </label>

            <Button onClick={save}>Save</Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="font-medium">All products</div>

          <div className="space-y-2">
            {items.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-zinc-600">{p.type} · {p.slug}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setDraft(p)}>Edit</Button>
                  <Button variant="ghost" onClick={() => remove(p.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
