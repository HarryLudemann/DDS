import type { AvailabilityRule } from "../../types/db";
import { todayNZDateKey } from "./bookingTime";

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DAY_META: Record<number, { label: string; short: string; schema: string }> = {
  0: { label: "Sunday", short: "Sun", schema: "Su" },
  1: { label: "Monday", short: "Mon", schema: "Mo" },
  2: { label: "Tuesday", short: "Tue", schema: "Tu" },
  3: { label: "Wednesday", short: "Wed", schema: "We" },
  4: { label: "Thursday", short: "Thu", schema: "Th" },
  5: { label: "Friday", short: "Fri", schema: "Fr" },
  6: { label: "Saturday", short: "Sat", schema: "Sa" },
};

export type DayHours = {
  dow: number;
  label: string;
  short: string;
  open: boolean;
  start: string;
  end: string;
};

export type HoursLine = {
  label: string;
  hours: string;
};

function parseHm(time: string) {
  const [h, m] = time.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function formatClock(time: string) {
  const { h, m } = parseHm(time);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  if (!m) return `${hour}${suffix}`;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

function schemaTime(time: string) {
  const { h, m } = parseHm(time);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function newestActiveByDow(rules: AvailabilityRule[], onDate = todayNZDateKey()) {
  const map = new Map<number, AvailabilityRule>();
  const sorted = [...rules].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const rule of sorted) {
    if (!rule.active) continue;
    if (rule.effective_from > onDate) continue;
    if (rule.effective_to && rule.effective_to < onDate) continue;
    if (!map.has(rule.dow)) map.set(rule.dow, rule);
  }
  return map;
}

export function weekFromRules(rules: AvailabilityRule[]): DayHours[] {
  const byDow = newestActiveByDow(rules);
  return WEEKDAY_ORDER.map((dow) => {
    const meta = DAY_META[dow];
    const rule = byDow.get(dow);
    return {
      dow,
      label: meta.label,
      short: meta.short,
      open: !!rule,
      start: rule?.start_time ?? "08:00:00",
      end: rule?.end_time ?? "17:00:00",
    };
  });
}

function sameHours(a: DayHours, b: DayHours) {
  return a.open === b.open && (!a.open || (a.start === b.start && a.end === b.end));
}

export function groupHourLines(week: DayHours[]): HoursLine[] {
  const groups: DayHours[][] = [];
  for (const day of week) {
    const last = groups[groups.length - 1];
    const prev = last?.[last.length - 1];
    if (last && prev && sameHours(prev, day)) last.push(day);
    else groups.push([day]);
  }

  return groups.map((days) => {
    const first = days[0]!;
    const last = days[days.length - 1]!;
    const label = first.dow === last.dow ? first.label : `${first.short}–${last.short}`;
    const hours = first.open ? `${formatClock(first.start)}–${formatClock(first.end)}` : "Closed";
    return { label, hours };
  });
}

export function schemaOpeningHours(week: DayHours[]): string[] {
  const groups: DayHours[][] = [];
  for (const day of week) {
    const last = groups[groups.length - 1];
    const prev = last?.[last.length - 1];
    if (last && prev && sameHours(prev, day) && day.open) last.push(day);
    else if (day.open) groups.push([day]);
  }

  return groups.map((days) => {
    const first = days[0]!;
    const last = days[days.length - 1]!;
    const dayPart =
      first.dow === last.dow
        ? DAY_META[first.dow].schema
        : `${DAY_META[first.dow].schema}-${DAY_META[last.dow].schema}`;
    return `${dayPart} ${schemaTime(first.start)}-${schemaTime(first.end)}`;
  });
}
