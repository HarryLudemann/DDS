import { useSearchParams } from "react-router-dom";
import { AdminChrome } from "./AdminChrome";
import { AdminSegmented } from "./ui";
import BookingsPanel from "./BookingsPanel";
import ServicesPanel from "./ServicesPanel";
import HoursPanel from "./HoursPanel";

const TABS = [
  {
    id: "bookings",
    label: "Bookings",
    hint: "Requests from the site. Open one to quote, cancel, or delete.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" />
        <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" stroke="currentColor" />
      </svg>
    ),
  },
  {
    id: "services",
    label: "Services",
    hint: "What customers can book. Open a service to edit it.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 4.5h10M3 8h10M3 11.5h7" stroke="currentColor" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "hours",
    label: "Hours",
    hint: "Open or close each day. These times appear on the site and in booking.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" />
        <path d="M8 5.5V8l2 1.5" stroke="currentColor" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

type Tab = (typeof TABS)[number]["id"];

function tabFromSearch(value: string | null): Tab {
  if (value === "services" || value === "hours" || value === "availability") return value === "availability" ? "hours" : value;
  return "bookings";
}

export default function AdminWorkspace() {
  const [params, setParams] = useSearchParams();
  const tab = tabFromSearch(params.get("tab"));
  const current = TABS.find((item) => item.id === tab) ?? TABS[0];

  function setTab(next: Tab) {
    const copy = new URLSearchParams(params);
    if (next === "bookings") copy.delete("tab");
    else copy.set("tab", next);
    setParams(copy, { replace: true });
  }

  return (
    <AdminChrome>
      <AdminSegmented
        ariaLabel="Admin sections"
        value={tab}
        onChange={setTab}
        options={TABS.map((item) => ({ id: item.id, label: item.label, icon: item.icon }))}
      />
      <p className="mt-3 text-sm text-[var(--admin-muted)]">{current.hint}</p>
      <div className="mt-8">
        {tab === "bookings" && <BookingsPanel />}
        {tab === "services" && <ServicesPanel />}
        {tab === "hours" && <HoursPanel />}
      </div>
    </AdminChrome>
  );
}
