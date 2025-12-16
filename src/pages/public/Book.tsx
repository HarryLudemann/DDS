import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import { fmtDayNZ, fmtTimeNZ } from "../../utils/format";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

type Service = { id: string; title: string; duration_mins: number; active: boolean; sort_order: number };

type DayGroup = { label: string; times: string[] };

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Book() {
  const [services, setServices] = useState<Service[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [serviceId, setServiceId] = useState("");
  const [startAt, setStartAt] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const svc = await supabase
        .from("services")
        .select("id,title,duration_mins,active,sort_order")
        .eq("active", true)
        .order("sort_order");
      setServices((svc.data ?? []) as Service[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setTimes([]);
      setStartAt("");
      return;
    }

    (async () => {
      setStatus(null);
      setTimes([]);
      setStartAt("");

      const from = new Date();
      const to = addDays(from, 21);

      const { data, error } = await supabase.rpc("get_available_starts", {
        p_service_id: serviceId,
        p_from: toISODate(from),
        p_to: toISODate(to),
        p_step_mins: 15,
      });

      if (error) setStatus(error.message);
      else setTimes((data ?? []).map((r: any) => r.start_at));
    })();
  }, [serviceId]);

  const grouped = useMemo(() => {
    const map = new Map<string, DayGroup>();
    for (const t of times) {
      const label = fmtDayNZ(t);
      const g = map.get(label) ?? { label, times: [] };
      g.times.push(t);
      map.set(label, g);
    }
    return [...map.values()];
  }, [times]);

  const canSubmit = serviceId && startAt && name.trim() && email.trim();

  async function submit() {
    setStatus(null);
    if (!canSubmit) return;

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      service_id: serviceId,
      start_at: startAt,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim() || null,
      vehicle: vehicle.trim() || null,
      notes: notes.trim() || null,
      status: "confirmed",
    });
    setSubmitting(false);

    if (error) setStatus(error.message);
    else setStatus("Booking confirmed — Dylan will contact you shortly to confirm details.");
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Book Online</h1>
        <p className="mt-2 text-slate-600">Choose a service first — we’ll show times that fit.</p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600">Loading…</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5">
            <div className="text-sm font-extrabold text-slate-900">1) Choose service</div>

            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.duration_mins} mins)
                </option>
              ))}
            </Select>

            <div className="pt-5 border-t border-black/5 space-y-3">
              <div className="text-sm font-extrabold text-slate-900">2) Pick a time</div>

              {!serviceId ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                  Select a service to see availability.
                </div>
              ) : grouped.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-black/5">
                  No available times in the next 3 weeks. Try again later.
                </div>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                  {grouped.map((g) => (
                    <div key={g.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
                      <div className="text-sm font-bold text-slate-900">{g.label}</div>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {g.times.map((t) => {
                          const selected = t === startAt;
                          return (
                            <button
                              key={t}
                              onClick={() => setStartAt(t)}
                              className={[
                                "rounded-xl px-3 py-2 text-sm font-semibold transition",
                                "ring-1 ring-black/10 bg-white hover:bg-slate-50",
                                "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200",
                                selected ? "bg-indigo-600 text-white ring-0 hover:bg-indigo-700" : ""
                              ].join(" ")}
                            >
                              {fmtTimeNZ(t)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {status && <div className="text-sm text-slate-600">{status}</div>}
          </Card>

          <Card className="space-y-5">
            <div className="text-sm font-extrabold text-slate-900">3) Your details</div>

            <div className="grid gap-3">
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input placeholder="Vehicle (optional)" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
              <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button disabled={!canSubmit || submitting} onClick={submit} className="w-full">
              {submitting ? "Confirming…" : "Confirm booking"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
