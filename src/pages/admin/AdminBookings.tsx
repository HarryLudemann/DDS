import { useEffect, useState } from "react";
import { deleteBooking as deleteBookingDoc, listBookings, updateBookingMeta } from "../../lib/firebase/store";
import type { Booking, Service } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { fmtDayNZ, fmtMoney, fmtTimeNZ } from "../../utils/format";
import { amountsForCustomerPrice, GST_RATE, TAX_MODE, taxLabelShort } from "../../utils/tax";

type BookingRow = Booking & { service?: Pick<Service, "title"> | null };

export default function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quotedById, setQuotedById] = useState<Record<string, string>>({});

  function parseMoneyToCents(v: string) {
    const s = v.trim();
    if (!s) return null;
    const cleaned = s.replace(/[^0-9.]/g, "");
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  }

  useEffect(() => {
    (async () => {
      setStatus(null);

      // IMPORTANT:
      // Use an alias so Supabase returns a single object (not an array)
      try {
        const next = await listBookings();
        setRows(next);
        setQuotedById(() => {
          const m: Record<string, string> = {};
          for (const b of next) {
            const cents = (b as { meta?: { quoted_price_cents?: number } })?.meta?.quoted_price_cents;
            m[b.id] = typeof cents === "number" && Number.isFinite(cents) ? String((cents / 100).toFixed(2)) : "";
          }
          return m;
        });
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Failed to load bookings.");
      }
    })();
  }, []);

  async function deleteBooking(id: string) {
    const ok = window.confirm("Delete this booking? This cannot be undone.");
    if (!ok) return;

    setBusyId(id);
    setStatus(null);
    try {
      await deleteBookingDoc(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to delete.");
    }
    setBusyId(null);
  }

  async function saveQuotedPrice(b: BookingRow) {
    const cents = parseMoneyToCents(quotedById[b.id] ?? "");
    if (quotedById[b.id]?.trim() && cents == null) {
      setStatus("Quoted price must be a number (e.g. 249 or 249.00).");
      return;
    }

    setBusyId(b.id);
    setStatus(null);

    const nextMeta = { ...(b.meta ?? {}), quoted_price_cents: cents };
    try {
      await updateBookingMeta(b.id, nextMeta);
      setRows((prev) => prev.map((x) => (x.id === b.id ? ({ ...x, meta: nextMeta } as BookingRow) : x)));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to save.");
    }
    setBusyId(null);
  }

  function taxModeFor(b: BookingRow) {
    const v = (b as any)?.meta?.tax_mode;
    return v === "gst_included" || v === "gst_excluded" || v === "no_gst" ? v : TAX_MODE;
  }

  function gstRateFor(b: BookingRow) {
    const v = (b as any)?.meta?.gst_rate;
    return typeof v === "number" && Number.isFinite(v) ? v : GST_RATE;
  }

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
          {rows.map((b) => {
            const mode = taxModeFor(b);
            const rate = gstRateFor(b);
            const quotedCents = (b as any)?.meta?.quoted_price_cents;
            const quotedOk = typeof quotedCents === "number" && Number.isFinite(quotedCents);
            const quotedBreakdown = quotedOk ? amountsForCustomerPrice(quotedCents, mode, rate) : null;

            return (
              <div key={b.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">{b.customer_name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {b.meta?.service_title ?? b.service?.title ?? b.service_id}
                    </div>
                  </div>

                  <div className="text-sm text-slate-700 sm:text-right">
                    <div className="font-semibold text-slate-900">
                      {fmtDayNZ(b.start_at)} · {fmtTimeNZ(b.start_at)}
                    </div>
                    <div className="text-xs text-slate-500">Status: {b.status}</div>
                  </div>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-500">Email:</span> {b.customer_email}
                  </div>
                  {b.customer_phone && (
                    <div>
                      <span className="text-slate-500">Phone:</span> {b.customer_phone}
                    </div>
                  )}
                  {(b.meta?.vehicle_size || b.vehicle) && (
                    <div>
                      <span className="text-slate-500">Vehicle:</span> {b.meta?.vehicle_size ?? b.vehicle}
                    </div>
                  )}
                  {b.meta?.preferred_window_label && (
                    <div>
                      <span className="text-slate-500">Window:</span> {b.meta.preferred_window_label}
                    </div>
                  )}

                  {typeof b.meta?.service_price_cents === "number" && Number.isFinite(b.meta.service_price_cents) && (
                    <div>
                      <span className="text-slate-500">Service price:</span> {fmtMoney(b.meta.service_price_cents)}
                      <span className="ml-2 text-xs font-extrabold text-slate-500">{taxLabelShort(mode)}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="text-xs font-extrabold tracking-wider uppercase text-slate-500">
                      Quoted price <span className="ml-1">({taxLabelShort(mode)})</span>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input
                        value={quotedById[b.id] ?? ""}
                        onChange={(e) => setQuotedById((prev) => ({ ...prev, [b.id]: e.target.value }))}
                        placeholder="e.g. 249.00"
                        className="w-full sm:w-44 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-black/10"
                      />
                      <Button variant="secondary" disabled={busyId === b.id} onClick={() => saveQuotedPrice(b)}>
                        {busyId === b.id ? "Saving…" : "Save"}
                      </Button>
                    </div>

                    {quotedBreakdown && (
                      <div className="mt-2 grid gap-1 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-500">Net:</span> {fmtMoney(quotedBreakdown.netCents)}
                        </div>
                        <div>
                          <span className="text-slate-500">GST:</span> {fmtMoney(quotedBreakdown.gstCents)}
                        </div>
                        <div>
                          <span className="text-slate-500">Total:</span> {fmtMoney(quotedBreakdown.grossCents)}
                        </div>
                      </div>
                    )}
                  </div>

                  {b.notes && (
                    <div className="pt-2">
                      <span className="text-slate-500">Notes:</span> {b.notes}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">ID: {b.id}</div>
                  <Button variant="ghost" disabled={busyId === b.id} onClick={() => deleteBooking(b.id)}>
                    {busyId === b.id ? "Working…" : "Delete"}
                  </Button>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="p-6 text-sm text-slate-600">No bookings yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
