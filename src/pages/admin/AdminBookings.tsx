import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import type { Booking, Service } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { fmtDayNZ, fmtTimeNZ } from "../../utils/format";

type BookingRow = Booking & { service?: Pick<Service, "title"> | null };

type PackageRow = { code: string; title: string; service_id: string | null };

export default function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const packageTitleByServiceId = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of packages) {
      if (p.service_id) m.set(p.service_id, p.title);
    }
    return m;
  }, [packages]);

  useEffect(() => {
    (async () => {
      setStatus(null);

      const { data: pkgData, error: pkgErr } = await supabase
        .from("packages")
        .select("code,title,service_id")
        .order("code", { ascending: true });

      if (pkgErr) setStatus(pkgErr.message);
      setPackages((pkgData ?? []) as PackageRow[]);

      // IMPORTANT:
      // Use an alias so Supabase returns a single object (not an array)
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id, created_at, status,
          start_at, end_at,
          customer_name, customer_email, customer_phone,
          vehicle, notes,
          service:services(title)
        `
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) setStatus(error.message);
      else setRows((data ?? []) as unknown as BookingRow[]);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Bookings</h1>
        <Link to="/admin">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-black/5">
          {rows.map((b) => (
            <div key={b.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{b.customer_name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {packageTitleByServiceId.get(b.service_id) ?? b.service?.title ?? b.service_id}
                  </div>
                </div>

                <div className="text-sm text-slate-700 sm:text-right">
                  <div className="font-semibold text-slate-900">
                    {fmtDayNZ(b.start_at)} · {fmtTimeNZ(b.start_at)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: {b.status}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-slate-700">
                <div><span className="text-slate-500">Email:</span> {b.customer_email}</div>
                {b.customer_phone && <div><span className="text-slate-500">Phone:</span> {b.customer_phone}</div>}
                {b.vehicle && <div><span className="text-slate-500">Vehicle:</span> {b.vehicle}</div>}
                {b.notes && <div className="pt-2"><span className="text-slate-500">Notes:</span> {b.notes}</div>}
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="p-6 text-sm text-slate-600">No bookings yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
