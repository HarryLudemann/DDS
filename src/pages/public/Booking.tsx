import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import type { Product, Slot } from "../../types/db";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { fmtSlotNZ } from "../../utils/format";

type AvailableSlot = Slot & { is_booked?: boolean };

export default function Booking() {
  const [services, setServices] = useState<Product[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [slotId, setSlotId] = useState<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("type", "service")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setServices((data ?? []) as Product[]));
  }, []);

  useEffect(() => {
    // `available_slots` is a view we create in schema.sql
    supabase
      .from("available_slots")
      .select("*")
      .order("start_at", { ascending: true })
      .limit(80)
      .then(({ data }) => setSlots((data ?? []) as AvailableSlot[]));
  }, []);

  const canSubmit = useMemo(() => {
    return !!(productId && slotId && name.trim() && email.trim());
  }, [productId, slotId, name, email]);

  async function submit() {
    setStatus(null);
    setLoading(true);

    const { error } = await supabase.from("bookings").insert({
      slot_id: slotId,
      product_id: productId,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim() || null,
      notes: notes.trim() || null,
      status: "confirmed",
    });

    setLoading(false);

    if (error) setStatus(error.message);
    else {
      setStatus("Booked! You’ll receive a confirmation soon.");
      setSlotId("");
      setNotes("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Book a call</h1>
        <p className="mt-2 text-zinc-600">Times shown in Pacific/Auckland. Select a service and a slot.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <label className="text-sm font-medium">Service</label>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Available times</label>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
            >
              <option value="">Select…</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {fmtSlotNZ(slot.start_at)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone (optional)</label>
              <Input className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea className="mt-2" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <Button disabled={!canSubmit || loading} onClick={submit}>
            {loading ? "Booking…" : "Confirm booking"}
          </Button>

          {status && <p className="text-sm text-zinc-700">{status}</p>}
        </Card>
      </div>
    </div>
  );
}
