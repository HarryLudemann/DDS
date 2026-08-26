import { clearAvailabilityCache } from "./availability";

export const SERVICES_UPDATED_AT_KEY = "dds_services_updated_at";
export const SERVICES_UPDATED_EVENT = "dds_services_updated";
export const AVAILABILITY_UPDATED_AT_KEY = "dds_availability_updated_at";
export const AVAILABILITY_UPDATED_EVENT = "dds_availability_updated";

export function notifyServicesUpdated() {
  try {
    window.localStorage.setItem(SERVICES_UPDATED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SERVICES_UPDATED_EVENT));
  notifyAvailabilityUpdated();
}

export function notifyAvailabilityUpdated() {
  try {
    window.localStorage.setItem(AVAILABILITY_UPDATED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  clearAvailabilityCache();
  window.dispatchEvent(new Event(AVAILABILITY_UPDATED_EVENT));
}
