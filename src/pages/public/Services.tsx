import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { fmtMoneyNZD } from "../../utils/format";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type Service = {
  id: string;
  title: string;
  description: string | null;
  duration_mins: number;
  price_cents: number;
  active: boolean;
  sort_order: number;
};

export default function Services() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as Service[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Services</h1>
          <p className="mt-2 text-muted max-w-2xl">
            Choose a package, pick an available time, and you’re done. Dylan will confirm details after booking.
          </p>
        </div>
        <Link to="/book"><Button>Book Online</Button></Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((s) => (
            <Card key={s.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-extrabold tracking-tight">{s.title}</div>
                  {s.description && <div className="mt-2 text-sm text-muted">{s.description}</div>}
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold">{fmtMoneyNZD(s.price_cents)}</div>
                  <div className="mt-2 flex justify-end">
                    <Pill>{s.duration_mins} mins</Pill>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                <Link to="/book" className="w-full">
                  <Button className="w-full">Book this</Button>
                </Link>
                <Link to="/book" className="w-full">
                  <Button variant="secondary" className="w-full">Choose time</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
