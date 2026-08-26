import { NZ_TZ } from "../../utils/format";

export const BOOKING_WINDOWS = [
  { key: "early", label: "Morning", startMins: 0, endMins: 10 * 60 },
  { key: "mid", label: "Late morning", startMins: 10 * 60, endMins: 12 * 60 },
  { key: "arvo", label: "Afternoon", startMins: 12 * 60, endMins: 15 * 60 },
  { key: "late", label: "Later", startMins: 15 * 60, endMins: 24 * 60 },
  { key: "any", label: "Any time", startMins: 0, endMins: 24 * 60 },
] as const;

export type WindowKey = (typeof BOOKING_WINDOWS)[number]["key"];

export function isoToNZDateKey(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TZ }).format(d);
}

export function isoToNZMinutesSinceMidnight(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function toISODateNZ(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TZ }).format(d);
}

export function todayNZDateKey() {
  return toISODateNZ(new Date());
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function tomorrowNZDateKey() {
  return addDaysToDateKey(todayNZDateKey(), 1);
}

export function addMinutesIso(iso: string, mins: number) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return new Date(d.getTime() + mins * 60_000).toISOString();
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function normalizePlate(raw: string) {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isPlausiblePlate(raw: string) {
  if (!raw.trim()) return true;
  const plate = normalizePlate(raw);
  return plate.length >= 2 && plate.length <= 8;
}

export function labelForDateKeyNZ(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateForFormatting = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0));

  const day = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    weekday: "short",
  }).format(dateForFormatting);

  const rest = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    day: "2-digit",
    month: "short",
  }).format(dateForFormatting);

  const nowKey = todayNZDateKey();
  const tomorrowKey = tomorrowNZDateKey();
  const tag = dateKey === nowKey ? "Today" : dateKey === tomorrowKey ? "Tomorrow" : "";

  return tag ? `${tag} · ${day} ${rest}` : `${day} ${rest}`;
}

export function groupStartsByDay(times: string[]) {
  const map = new Map<string, string[]>();

  for (const t of times) {
    const dateKey = isoToNZDateKey(t);
    if (!dateKey) continue;
    const list = map.get(dateKey) ?? [];
    list.push(t);
    map.set(dateKey, list);
  }

  return [...map.entries()]
    .map(([dateKey, dayTimes]) => ({
      dateKey,
      label: labelForDateKeyNZ(dateKey),
      times: dayTimes,
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
