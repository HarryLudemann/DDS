import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

type Rule = {
  id: string;
  dow: number;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to: string | null;
  active: boolean;
};

const DOW = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 0, label: "Sun" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAvailability() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [days, setDays] = useState<number[]>([6, 0]); // Sat/Sun default
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState<string>(""); // optional
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data, error } = await supabase
      .from("availability_rules")
      .select("*")
      .order("dow", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) setStatus(error.message);
    setRules((data ?? []) as Rule[]);
  }

  useEffect(() => { refresh(); }, []);

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  async function saveRules() {
    setStatus(null);
    if (days.length === 0) return setStatus("Select at least one day.");
    if (!from) return setStatus("Choose a start date.");
    if (end <= start) return setStatus("End time must be after start time.");

    const inserts = days.map((dow) => ({
      dow,
      start_time: start,
      end_time: end,
      effective_from: from,
      effective_to: to ? to : null,
      active: true,
    }));

    setBusy(true);
    const { error } = await supabase.from("availability_rules").insert(inserts);
    setBusy(false);

    if (error) setStatus(error.message);
    else {
      setStatus("Availability rules saved.");
      refresh();
    }
  }

  async function removeRule(id: string) {
    setBusy(true);
    const { error } = await supabase.from("availability_rules").delete().eq("id", id);
    setBusy(false);
    if (error) setStatus(error.message);
    else refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Availability</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set working hours (e.g. Sat/Sun 8–5). Booking availability is computed per service duration.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="text-sm font-extrabold text-slate-900">Create working hours</div>

        <div className="flex flex-wrap gap-2">
          {DOW.map((d) => {
            const on = days.includes(d.v);
            return (
              <button
                key={d.v}
                onClick={() => toggleDay(d.v)}
                className={[
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  "ring-1 ring-black/10",
                  on ? "bg-indigo-600 text-white ring-0" : "bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-xs font-semibold text-slate-500">Start</div>
            <Input className="mt-2" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">End</div>
            <Input className="mt-2" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">From date</div>
            <Input className="mt-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">To date (optional)</div>
            <Input className="mt-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveRules} disabled={busy}>Save rules</Button>
          {status && <div className="text-sm text-slate-600">{status}</div>}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="text-sm font-extrabold text-slate-900">Current rules</div>

        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {DOW.find((d) => d.v === r.dow)?.label}
                </span>{" "}
                {r.start_time}–{r.end_time}
                <span className="text-slate-500"> · from {r.effective_from}{r.effective_to ? ` to ${r.effective_to}` : ""}</span>
              </div>
              <Button variant="ghost" onClick={() => removeRule(r.id)} disabled={busy}>Remove</Button>
            </div>
          ))}
          {rules.length === 0 && <div className="text-sm text-slate-600">No rules yet.</div>}
        </div>
      </Card>
    </div>
  );
}
