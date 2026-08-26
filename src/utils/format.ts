export const NZ_TZ = "Pacific/Auckland";

export function fmtDayNZ(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(d);
}

export function fmtTimeNZ(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function fmtMoney(cents: number) {
  const n = (cents ?? 0) / 100;
  const whole = Number.isInteger(n);
  return n.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

export function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}
