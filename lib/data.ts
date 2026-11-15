import { packCrimes, unpackCrimes } from "./compact";
import { fetchCityCrimes, latestMonths } from "./police";
import type { City, CompactCrimes, Crime } from "./types";

// Same window as the original project: six months at a time keeps the map fast.
const MONTHS = 6;
// Police data is published monthly, so a copy from the last 12 hours is fresh enough.
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const cacheKey = (slug: string) => `crime-lens-cache-v1:${slug}`;

export interface CityData {
  months: string[];
  crimes: Crime[];
  fetchedAt: string;
}

interface Cached {
  months: string[];
  crimes: CompactCrimes;
  fetchedAt: string;
}

function readCache(slug: string): CityData | null {
  try {
    const raw = localStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    if (Date.now() - new Date(c.fetchedAt).getTime() > MAX_AGE_MS) return null;
    return { months: c.months, crimes: unpackCrimes(c.crimes), fetchedAt: c.fetchedAt };
  } catch {
    return null;
  }
}

function writeCache(slug: string, months: string[], crimes: Crime[], fetchedAt: string) {
  const value = JSON.stringify({ months, crimes: packCrimes(crimes), fetchedAt } satisfies Cached);
  try {
    localStorage.setItem(cacheKey(slug), value);
  } catch {
    // Storage full (London alone is about 1 MB packed): drop other cities' copies and try once more.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith("crime-lens-cache-") && k !== cacheKey(slug)) localStorage.removeItem(k);
      }
      localStorage.setItem(cacheKey(slug), value);
    } catch {
      /* caching is only a speed-up */
    }
  }
}

/** Latest six months of street crime around a city, cached in the browser for 12 hours. */
export async function loadCityCrimes(city: City, { fresh = false } = {}): Promise<CityData> {
  if (!fresh) {
    const cached = readCache(city.slug);
    if (cached) return cached;
  }
  const months = [...(await latestMonths(MONTHS))].sort();
  const crimes = await fetchCityCrimes(city, months);
  const fetchedAt = new Date().toISOString();
  writeCache(city.slug, months, crimes, fetchedAt);
  return { months, crimes, fetchedAt };
}
