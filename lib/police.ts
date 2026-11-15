import type { City, Crime } from "./types";
import { dedupeCrimes } from "./dedupe";

const BASE = "https://data.police.uk/api";
const DAY = 60 * 60 * 24;

interface RawCrime {
  id: number;
  persistent_id: string;
  category: string;
  month: string;
  location: {
    latitude: string;
    longitude: string;
    street: { id: number; name: string };
  } | null;
  outcome_status: { category: string; date: string } | null;
}

export function normaliseCrime(raw: RawCrime): Crime | null {
  if (!raw.location) return null;
  const lat = Number(raw.location.latitude);
  const lng = Number(raw.location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id: String(raw.id),
    category: raw.category,
    street: raw.location.street?.name ?? "Unknown location",
    lat,
    lng,
    month: raw.month,
    outcome: raw.outcome_status?.category ?? null,
    source: "police",
  };
}

/** The most recent `n` months that data.police.uk has published, newest first. */
export async function latestMonths(n: number): Promise<string[]> {
  const res = await fetch(`${BASE}/crimes-street-dates`, { next: { revalidate: DAY } });
  if (!res.ok) throw new Error(`crimes-street-dates failed: ${res.status}`);
  const dates = (await res.json()) as { date: string }[];
  return dates
    .map((d) => d.date)
    .sort()
    .reverse()
    .slice(0, n);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** data.police.uk allows about 15 requests a second and answers 429 when busy, so retry with a short backoff. */
async function fetchWithRetry(url: string, tries = 4): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { next: { revalidate: DAY } });
    if (res.status !== 429 || i >= tries - 1) return res;
    await sleep(500 * 2 ** i);
  }
}

async function fetchMonth(city: City, month: string): Promise<Crime[]> {
  const url = `${BASE}/crimes-street/all-crime?lat=${city.lat}&lng=${city.lng}&date=${month}`;
  const res = await fetchWithRetry(url);
  // 503 means the area has more than 10,000 crimes that month; 404 means no data yet.
  if (res.status === 503 || res.status === 404) return [];
  if (!res.ok) throw new Error(`all-crime ${city.slug} ${month} failed: ${res.status}`);
  const raw = (await res.json()) as RawCrime[];
  return raw.map(normaliseCrime).filter((c): c is Crime => c !== null);
}

/** Street-level crimes within a mile of the city centre for the given months. */
export async function fetchCityCrimes(city: City, months: string[]): Promise<Crime[]> {
  // Two months at a time keeps us well under the API's rate limit.
  const perMonth: Crime[][] = [];
  for (let i = 0; i < months.length; i += 2) {
    perMonth.push(...(await Promise.all(months.slice(i, i + 2).map((m) => fetchMonth(city, m)))));
  }
  return dedupeCrimes(perMonth.flat());
}
