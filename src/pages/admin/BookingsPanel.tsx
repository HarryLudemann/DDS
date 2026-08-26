import { useEffect, useMemo, useState } from "react";
import {
  deleteBooking,
  listAllServices,
  listBookings,
  updateBookingMeta,
  updateBookingStatus,
} from "../../lib/firebase/store";
import { notifyAvailabilityUpdated } from "../../lib/site/live";
import type { Booking } from "../../types/db";
import { fmtDayNZ, fmtMoney, fmtTimeNZ } from "../../utils/format";
import { amountsForCustomerPrice, GST_RATE, TAX_MODE, taxLabelShort } from "../../utils/tax";
import { AdminBanner, AdminButton, AdminInput, AdminSegmented } from "./ui";

type Filter = "upcoming" | "past" | "cancelled" | "all";

export default function BookingsPanel() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quotedById, setQuotedById] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [bookings, services] = await Promise.all([listBookings(), listAllServices()]);
        if (!alive) return;
        const map: Record<string, string> = {};
        for (const s of services) map[s.id] = s.title;
        setTitles(map);
        setRows(bookings);
        setQuotedById(() => {
          const next: Record<string, string> = {};
          for (const b of bookings) {
            const cents = b.meta?.quoted_price_cents;
            next[b.id] = typeof cents === "number" && Number.isFinite(cents) ? (cents / 100).toFixed(2) : "";
          }
          return next;
        });
      } catch (e) {
        if (alive) setStatus(e instanceof Error ? e.message : "Failed to load bookings.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const now = Date.now();
  const filtered = useMemo(() => {
    const list = rows.filter((b) => {
      const start = new Date(b.start_at).getTime();
      if (filter === "cancelled") return b.status === "cancelled";
      if (filter === "upcoming") return b.status === "confirmed" && start >= now;
      if (filter === "past") return b.status === "confirmed" && start < now;
      return true;
    });
    const dir = filter === "past" || filter === "cancelled" ? -1 : 1;
    return [...list].sort((a, b) => dir * (new Date(a.start_at).getTime() - new Date(b.start_at).getTime()));
  }, [rows, filter, now]);

  async function cancel(id: string) {
    if (!window.confirm("Cancel this booking? The time slot will become free again.")) return;
    setBusyId(id);
    setStatus(null);
    try {
      await updateBookingStatus(id, "cancelled");
      setRows((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      notifyAvailabilityUpdated();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not cancel.");
    }
    setBusyId(null);
  }

  async function restore(id: string) {
    setBusyId(id);
    setStatus(null);
    try {
      await updateBookingStatus(id, "confirmed");
      setRows((prev) => prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)));
      notifyAvailabilityUpdated();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not restore.");
    }
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this booking permanently?")) return;
    setBusyId(id);
    setStatus(null);
    try {
      await deleteBooking(id);
      setRows((prev) => prev.filter((b) => b.id !== id));
      notifyAvailabilityUpdated();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not delete.");
    }
    setBusyId(null);
  }

  async function saveQuote(b: Booking) {
    const raw = (quotedById[b.id] ?? "").trim();
    let cents: number | null = null;
    if (raw) {
      const n = Number(raw.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(n)) {
        setStatus("Quoted price must be a number, e.g. 249.00.");
        return;
      }
      cents = Math.round(n * 100);
    }
    setBusyId(b.id);
    setStatus(null);
    const nextMeta = { ...(b.meta ?? {}), quoted_price_cents: cents };
    try {
      await updateBookingMeta(b.id, nextMeta);
      setRows((prev) => prev.map((x) => (x.id === b.id ? { ...x, meta: nextMeta } : x)));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save quote.");
    }
    setBusyId(null);
  }

  function serviceTitle(b: Booking) {
    return String(b.meta?.service_title ?? titles[b.service_id] ?? "Service");
  }

  const counts = {
    upcoming: rows.filter((b) => b.status === "confirmed" && new Date(b.start_at).getTime() >= now).length,
    past: rows.filter((b) => b.status === "confirmed" && new Date(b.start_at).getTime() < now).length,
    cancelled: rows.filter((b) => b.status === "cancelled").length,
    all: rows.length,
  };

  return (
    <div className="space-y-5">
      <AdminSegmented
        ariaLabel="Filter bookings"
        size="sm"
        value={filter}
        onChange={setFilter}
        options={[
          { id: "upcoming", label: "Upcoming", count: counts.upcoming },
          { id: "past", label: "Past", count: counts.past },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
          { id: "all", label: "All", count: counts.all },
        ]}
      />

      {status && <AdminBanner>{status}</AdminBanner>}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading bookings…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-[var(--admin-line)] bg-white px-5 py-10">
          <p className="font-medium">No bookings here</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">New requests from the site will show up in Upcoming.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--admin-line)] border border-[var(--admin-line)] bg-white">
          {filtered.map((b) => {
            const open = openId === b.id;
            const quoted = b.meta?.quoted_price_cents;
            const quotedOk = typeof quoted === "number" && Number.isFinite(quoted);
            const breakdown = quotedOk ? amountsForCustomerPrice(quoted, TAX_MODE, GST_RATE) : null;
            const mode = b.meta?.tax_mode === "gst_included" || b.meta?.tax_mode === "gst_excluded" || b.meta?.tax_mode === "no_gst" ? b.meta.tax_mode : TAX_MODE;

            return (
              <article key={b.id} className="px-5 py-4">
                <button type="button" className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpenId(open ? null : b.id)}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{b.customer_name}</div>
                    <div className="mt-1 truncate text-sm text-[var(--admin-muted)]">{serviceTitle(b)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium">
                      {fmtDayNZ(b.start_at)} · {fmtTimeNZ(b.start_at)}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--admin-muted)]">
                      {b.status === "cancelled" ? "Cancelled" : open ? "Hide" : "Details"}
                    </div>
                  </div>
                </button>

                {open && (
                  <div className="mt-4 space-y-3 border-t border-[var(--admin-line)] pt-4 text-sm">
                    <p>
                      <span className="text-[var(--admin-muted)]">Email </span>
                      <a className="underline underline-offset-2" href={`mailto:${b.customer_email}`}>
                        {b.customer_email}
                      </a>
                    </p>
                    {b.customer_phone && (
                      <p>
                        <span className="text-[var(--admin-muted)]">Phone </span>
                        <a className="underline underline-offset-2" href={`tel:${b.customer_phone}`}>
                          {b.customer_phone}
                        </a>
                      </p>
                    )}
                    {(() => {
                      const plate = String(b.meta?.plate ?? b.vehicle ?? "").trim();
                      if (!plate) return null;
                      return (
                        <p>
                          <span className="text-[var(--admin-muted)]">Plate </span>
                          <span className="tracking-[0.06em]">{plate}</span>
                          {" · "}
                          <a
                            className="underline underline-offset-2"
                            href={`https://www.carjam.co.nz/car/?plate=${encodeURIComponent(plate)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            CarJam
                          </a>
                        </p>
                      );
                    })()}
                    {b.meta?.preferred_window_label && (
                      <p>
                        <span className="text-[var(--admin-muted)]">Window </span>
                        {String(b.meta.preferred_window_label)}
                      </p>
                    )}
                    {typeof b.meta?.service_price_cents === "number" && (
                      <p>
                        <span className="text-[var(--admin-muted)]">Listed from </span>
                        {fmtMoney(b.meta.service_price_cents)} {taxLabelShort(mode)}
                      </p>
                    )}
                    {b.notes && (
                      <p className="whitespace-pre-wrap">
                        <span className="text-[var(--admin-muted)]">Notes </span>
                        {b.notes}
                      </p>
                    )}

                    <div className="max-w-xs pt-1">
                      <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--admin-muted)]">
                        Quoted price ({taxLabelShort(mode)})
                      </div>
                      <div className="mt-2 flex gap-2">
                        <AdminInput
                          value={quotedById[b.id] ?? ""}
                          onChange={(e) => setQuotedById((prev) => ({ ...prev, [b.id]: e.target.value }))}
                          placeholder="249.00"
                          inputMode="decimal"
                        />
                        <AdminButton variant="secondary" disabled={busyId === b.id} onClick={() => saveQuote(b)}>
                          Save
                        </AdminButton>
                      </div>
                      {breakdown && (
                        <p className="mt-2 text-xs text-[var(--admin-muted)]">
                          Net {fmtMoney(breakdown.netCents)} · GST {fmtMoney(breakdown.gstCents)} · Total {fmtMoney(breakdown.grossCents)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {b.status === "cancelled" ? (
                        <AdminButton variant="secondary" disabled={busyId === b.id} onClick={() => restore(b.id)}>
                          Restore
                        </AdminButton>
                      ) : (
                        <AdminButton variant="secondary" disabled={busyId === b.id} onClick={() => cancel(b.id)}>
                          Cancel booking
                        </AdminButton>
                      )}
                      <AdminButton variant="danger" disabled={busyId === b.id} onClick={() => remove(b.id)}>
                        Delete
                      </AdminButton>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
