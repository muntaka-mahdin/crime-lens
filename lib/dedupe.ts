import type { Crime } from "./types";

/**
 * Removes duplicate crime records.
 *
 * The original Laravel version treated two records as the same crime when they
 * had the same type, location, coordinates and month. data.police.uk snaps
 * crimes to anonymised map points, so separate crimes on the same street in the
 * same month can share all of those values. This version uses the police record
 * id when there is one, and only falls back to the old rule for records
 * without an id.
 */
export function dedupeCrimes(crimes: Crime[]): Crime[] {
  const seen = new Set<string>();
  const out: Crime[] = [];
  for (const c of crimes) {
    const key = c.id
      ? `id:${c.id}`
      : `k:${c.category}|${c.street}|${c.lat.toFixed(6)}|${c.lng.toFixed(6)}|${c.month}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
