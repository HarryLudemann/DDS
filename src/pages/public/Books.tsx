import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import type { Product } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { fmtMoney } from "../../utils/format";

export default function Books() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("type", "book")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <p className="mt-2 text-zinc-600">Selected titles with direct links to purchase.</p>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-600">Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id} className="flex gap-4">
              {p.cover_url ? (
                <img
                  src={p.cover_url}
                  alt={p.title}
                  className="h-24 w-20 rounded-xl border border-zinc-200 object-cover"
                />
              ) : (
                <div className="h-24 w-20 rounded-xl border border-zinc-200 bg-zinc-50" />
              )}

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{p.title}</div>
                  <Badge>{fmtMoney(p.price_cents, p.currency)}</Badge>
                </div>
                <div className="text-sm text-zinc-600">{p.description}</div>
                {p.buy_url && (
                  <a className="text-sm underline" href={p.buy_url} target="_blank" rel="noreferrer">
                    Buy now
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
