import type { Crime } from "./types";

export interface Count {
  label: string;
  count: number;
}

const sortDesc = (a: Count, b: Count) => b.count - a.count || a.label.localeCompare(b.label);

function tally(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

/** Crimes per category, most common first. */
export function countByCategory(crimes: Crime[]): Count[] {
  return [...tally(crimes.map((c) => c.category))]
    .map(([label, count]) => ({ label, count }))
    .sort(sortDesc);
}

/** Crimes per month, oldest month first. Months with no crimes are kept if listed in `months`. */
export function countByMonth(crimes: Crime[], months: string[] = []): Count[] {
  const m = tally(crimes.map((c) => c.month));
  for (const month of months) if (!m.has(month)) m.set(month, 0);
  return [...m]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** The streets with the most crimes (the "hotspots"). */
export function topLocations(crimes: Crime[], n = 10): Count[] {
  return [...tally(crimes.map((c) => c.street))]
    .map(([label, count]) => ({ label, count }))
    .sort(sortDesc)
    .slice(0, n);
}

export interface Filters {
  category: string; // "all" or a slug
  month: string; // "all" or "YYYY-MM"
}

export function applyFilters(crimes: Crime[], f: Filters): Crime[] {
  return crimes.filter(
    (c) =>
      (f.category === "all" || c.category === f.category) &&
      (f.month === "all" || c.month === f.month),
  );
}
