import { isFirebaseConfigured } from "../../utils/firebase";
import { getAvailableStarts } from "../firebase/store";
import { addDaysToDateKey, todayNZDateKey } from "./bookingTime";

const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;

const cache = new Map<string, { at: number; times: string[] }>();
const inFlight = new Map<string, Promise<{ times: string[]; error: string | null }>>();

export function clearAvailabilityCache() {
  cache.clear();
  inFlight.clear();
}

export async function fetchAvailableStarts(serviceId: string, force = false) {
  if (!isFirebaseConfigured) {
    return {
      times: [] as string[],
      error: "Bookings need Firebase keys in .env before available times can load.",
    };
  }

  const cached = cache.get(serviceId);
  const fresh = cached && Date.now() - cached.at < CACHE_TTL_MS;
  if (fresh && cached && !force) {
    return { times: cached.times, error: null as string | null };
  }

  let promise = inFlight.get(serviceId);
  if (!promise) {
    promise = (async () => {
      const fromNZ = todayNZDateKey();
      const toNZ = addDaysToDateKey(fromNZ, 22);

      const rpcPromise = (async () => {
        try {
          const times = await getAvailableStarts(serviceId, fromNZ, toNZ, 15);
          cache.set(serviceId, { at: Date.now(), times });
          return { times, error: null as string | null };
        } catch (e) {
          return {
            times: [] as string[],
            error: e instanceof Error ? e.message : "Could not load availability.",
          };
        }
      })();

      const timeoutPromise = new Promise<{ times: string[]; error: string }>((resolve) => {
        window.setTimeout(() => {
          resolve({
            times: [],
            error: "Availability is taking too long to load. Please try again.",
          });
        }, REQUEST_TIMEOUT_MS);
      });

      return await Promise.race([rpcPromise, timeoutPromise]);
    })().finally(() => {
      inFlight.delete(serviceId);
    });

    inFlight.set(serviceId, promise);
  }

  return promise;
}
