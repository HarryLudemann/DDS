import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { fromZonedTime } from "date-fns-tz";
import { db, isFirebaseConfigured } from "../../utils/firebase";
import { NZ_TZ } from "../../utils/format";
import type { AvailabilityRule, Booking, Service } from "../../types/db";
import { PACKAGES } from "../../catalog/packages";
import { addDaysToDateKey, todayNZDateKey } from "../site/bookingTime";

const SERVICES = "services";
const RULES = "availabilityRules";
const BOOKINGS = "bookings";
const PROFILES = "profiles";

const SEED_DURATION: Record<string, number> = {
  exterior_refresh: 60,
  interior_refresh: 120,
  full_detail: 240,
  full_interior: 420,
  paint_enhancement: 360,
};

function requireDb() {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

function asIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => (typeof x === "string" ? x : "")).filter(Boolean);
}

function serviceFromDoc(id: string, data: Record<string, unknown>): Service {
  return {
    id,
    title: String(data.title ?? ""),
    subtitle: (data.subtitle as string | null) ?? null,
    summary: (data.summary as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    includes: asStringArray(data.includes),
    ideal_for: asStringArray(data.ideal_for),
    duration_mins: Number(data.duration_mins ?? 60),
    price_cents: Number(data.price_cents ?? 0),
    active: data.active !== false,
    sort_order: Number(data.sort_order ?? 0),
    created_at: asIso(data.created_at),
  };
}

function bookingFromDoc(id: string, data: Record<string, unknown>): Booking {
  return {
    id,
    service_id: String(data.service_id ?? ""),
    start_at: asIso(data.start_at),
    end_at: asIso(data.end_at),
    customer_name: String(data.customer_name ?? ""),
    customer_email: String(data.customer_email ?? ""),
    customer_phone: (data.customer_phone as string | null) ?? null,
    vehicle: (data.vehicle as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    meta: (data.meta as Record<string, unknown>) ?? {},
    status: data.status === "cancelled" ? "cancelled" : "confirmed",
    created_at: asIso(data.created_at),
  };
}

function ruleFromDoc(id: string, data: Record<string, unknown>): AvailabilityRule {
  return {
    id,
    dow: Number(data.dow ?? 0),
    start_time: String(data.start_time ?? "08:00:00"),
    end_time: String(data.end_time ?? "17:00:00"),
    effective_from: String(data.effective_from ?? todayNZDateKey()),
    effective_to: (data.effective_to as string | null) ?? null,
    active: data.active !== false,
    created_at: asIso(data.created_at),
  };
}

export async function isAdminUser(uid: string | undefined | null): Promise<boolean> {
  if (!uid || !db) return false;
  const snap = await getDoc(doc(db, PROFILES, uid));
  return snap.exists() && snap.data()?.is_admin === true;
}

export async function ensureProfile(uid: string) {
  const firestore = requireDb();
  const ref = doc(firestore, PROFILES, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { is_admin: false, created_at: serverTimestamp() });
  }
}

export async function listActiveServices(): Promise<Service[]> {
  const firestore = requireDb();
  const snap = await getDocs(query(collection(firestore, SERVICES), where("active", "==", true)));
  return snap.docs
    .map((d) => serviceFromDoc(d.id, d.data()))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}

export async function listAllServices(): Promise<Service[]> {
  const firestore = requireDb();
  const snap = await getDocs(collection(firestore, SERVICES));
  return snap.docs
    .map((d) => serviceFromDoc(d.id, d.data()))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}

export async function getService(id: string): Promise<Service | null> {
  const snap = await getDoc(doc(requireDb(), SERVICES, id));
  if (!snap.exists()) return null;
  return serviceFromDoc(snap.id, snap.data());
}

export async function createService(payload: Omit<Service, "id" | "created_at">) {
  const firestore = requireDb();
  const ref = await addDoc(collection(firestore, SERVICES), {
    ...payload,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateService(id: string, payload: Partial<Omit<Service, "id" | "created_at">>) {
  await updateDoc(doc(requireDb(), SERVICES, id), payload);
}

export async function deleteService(id: string) {
  await deleteDoc(doc(requireDb(), SERVICES, id));
}

export async function listAvailabilityRules(): Promise<AvailabilityRule[]> {
  const firestore = requireDb();
  const snap = await getDocs(collection(firestore, RULES));
  return snap.docs.map((d) => ruleFromDoc(d.id, d.data()));
}

export async function saveAvailabilityRule(id: string | undefined, payload: Omit<AvailabilityRule, "id" | "created_at">) {
  const firestore = requireDb();
  const ref = id ? doc(firestore, RULES, id) : doc(collection(firestore, RULES));
  await setDoc(
    ref,
    {
      ...payload,
      created_at: serverTimestamp(),
    },
    { merge: true }
  );
  return ref.id;
}

export async function deactivateRulesForDow(dow: number) {
  const rules = await listAvailabilityRules();
  await Promise.all(
    rules
      .filter((r) => r.dow === dow && r.active)
      .map((r) => updateDoc(doc(requireDb(), RULES, r.id), { active: false }))
  );
}

export async function listBookings(): Promise<Booking[]> {
  const firestore = requireDb();
  const snap = await getDocs(collection(firestore, BOOKINGS));
  return snap.docs
    .map((d) => bookingFromDoc(d.id, d.data()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.start_at.localeCompare(a.start_at));
}

export async function updateBookingMeta(id: string, meta: Record<string, unknown>) {
  await updateDoc(doc(requireDb(), BOOKINGS, id), { meta });
}

export async function updateBookingStatus(id: string, status: Booking["status"]) {
  await updateDoc(doc(requireDb(), BOOKINGS, id), { status });
}

export async function deleteBooking(id: string) {
  await deleteDoc(doc(requireDb(), BOOKINGS, id));
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function parseHm(time: string) {
  const [h, m] = time.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function nzDateTime(dateKey: string, time: string) {
  const { h, m } = parseHm(time);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return fromZonedTime(`${dateKey}T${hh}:${mm}:00`, NZ_TZ);
}

function dowForDateKey(dateKey: string) {
  const noon = nzDateTime(dateKey, "12:00:00");
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: NZ_TZ, weekday: "short" }).format(noon);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

async function bookingsInRange(from: Date, to: Date): Promise<Booking[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, BOOKINGS),
      where("start_at", ">=", Timestamp.fromDate(from)),
      where("start_at", "<=", Timestamp.fromDate(to))
    )
  );
  return snap.docs.map((d) => bookingFromDoc(d.id, d.data())).filter((b) => b.status === "confirmed");
}

export async function getAvailableStarts(serviceId: string, fromKey: string, toKey: string, stepMins = 15) {
  const [services, rules, bookings] = await Promise.all([
    listActiveServices(),
    listAvailabilityRules(),
    bookingsInRange(nzDateTime(addDaysToDateKey(fromKey, -1), "00:00:00"), nzDateTime(addDaysToDateKey(toKey, 1), "23:59:00")),
  ]);

  const service = services.find((s) => s.id === serviceId);
  if (!service) return [] as string[];

  const durationMs = service.duration_mins * 60_000;
  const stepMs = Math.max(1, stepMins) * 60_000;
  const now = Date.now();
  const times: string[] = [];

  let day = fromKey;
  while (day <= toKey) {
    const dow = dowForDateKey(day);
    const rule = rules
      .filter((r) => r.active && r.dow === dow && r.effective_from <= day && (!r.effective_to || day <= r.effective_to))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    if (rule) {
      const winStart = nzDateTime(day, rule.start_time).getTime();
      const winEnd = nzDateTime(day, rule.end_time).getTime();
      const lastStart = winEnd - durationMs;
      for (let t = winStart; t <= lastStart; t += stepMs) {
        if (t <= now) continue;
        const end = t + durationMs;
        const clash = bookings.some((b) => overlaps(t, end, new Date(b.start_at).getTime(), new Date(b.end_at).getTime()));
        if (!clash) times.push(new Date(t).toISOString());
      }
    }

    day = addDaysToDateKey(day, 1);
  }

  return times;
}

export type NewBooking = {
  service_id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  vehicle: string | null;
  notes: string | null;
  meta: Record<string, unknown>;
  status: "confirmed";
};

export async function createBooking(payload: NewBooking) {
  const firestore = requireDb();
  const start = new Date(payload.start_at);
  const end = new Date(payload.end_at);
  if (!(start.getTime() > Date.now())) throw new Error("Please choose a future time.");
  if (!(end.getTime() > start.getTime())) throw new Error("Selected time is invalid.");

  const existing = await bookingsInRange(new Date(start.getTime() - 12 * 3600_000), new Date(end.getTime() + 12 * 3600_000));
  const clash = existing.some((b) =>
    overlaps(start.getTime(), end.getTime(), new Date(b.start_at).getTime(), new Date(b.end_at).getTime())
  );
  if (clash) throw new Error("That time was just taken. Please pick another slot.");

  await addDoc(collection(firestore, BOOKINGS), {
    ...payload,
    start_at: Timestamp.fromDate(start),
    end_at: Timestamp.fromDate(end),
    created_at: serverTimestamp(),
  });
}

export async function seedDefaults() {
  const firestore = requireDb();
  const existing = await getDocs(collection(firestore, SERVICES));
  if (!existing.empty) return { seeded: false, reason: "Services already exist." };

  const today = todayNZDateKey();
  await Promise.all(
    PACKAGES.map((pkg, index) =>
      addDoc(collection(firestore, SERVICES), {
        title: pkg.title,
        subtitle: pkg.subtitle,
        summary: pkg.summary,
        description: pkg.summary,
        includes: pkg.includes,
        ideal_for: pkg.idealFor,
        duration_mins: SEED_DURATION[pkg.code] ?? 90,
        price_cents: pkg.fromPriceCents,
        active: true,
        sort_order: (index + 1) * 10,
        created_at: serverTimestamp(),
      })
    )
  );

  await Promise.all(
    [0, 1, 2, 3, 4, 5, 6].map((dow) =>
      setDoc(doc(firestore, RULES, `dow-${dow}`), {
        dow,
        start_time: "08:00:00",
        end_time: "17:00:00",
        effective_from: today,
        effective_to: null,
        active: true,
        created_at: serverTimestamp(),
      })
    )
  );

  return { seeded: true, reason: "Loaded default services and 8am–5pm hours." };
}

export { isFirebaseConfigured };
