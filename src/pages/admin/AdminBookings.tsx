import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { fmtSlotNZ } from "../../utils/format";
import { Card } from "../../components/ui/Card";

type BookingRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  vehicle: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  services?: { title: string } | null;
  availability_slots?: { start_at: string } | null;
};

export default function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id,customer_name,customer_email,customer_phone,vehicle,address,notes,created_at, services(title), availability_slots(start_at)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) setStatus(error.message);
      else setRows((data ?? []) as BookingRow[]);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-2 text-sm text-muted">All customer bookings.</p>
      </div>

      {status && <div className="text-sm text-muted">{status}</div>}

      <Card className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{b.customer_name}</div>
              <div className="text-sm text-muted">
                {b.availability_slots?.start_at ? fmtSlotNZ(b.availability_slots.start_at) : ""}
              </div>
            </div>

            <div className="mt-3 grid gap-1 text-sm text-muted">
              <div><span className="text-text">Service:</span> {b.services?.title ?? "—"}</div>
              <div><span className="text-text">Email:</span> {b.customer_email}</div>
              {b.customer_phone && <div><span className="text-text">Phone:</span> {b.customer_phone}</div>}
              {b.vehicle && <div><span className="text-text">Vehicle:</span> {b.vehicle}</div>}
              {b.address && <div><span className="text-text">Address:</span> {b.address}</div>}
              {b.notes && <div><span className="text-text">Notes:</span> {b.notes}</div>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted">No bookings yet.</div>}
      </Card>
    </div>
  );
}
