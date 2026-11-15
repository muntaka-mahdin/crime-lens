import type { CompactCrimes, Crime } from "./types";

/** Packs crimes into lookup tables plus small tuples, roughly a third of the JSON size. */
export function packCrimes(crimes: Crime[]): CompactCrimes {
  const tables = {
    categories: new Map<string, number>(),
    streets: new Map<string, number>(),
    months: new Map<string, number>(),
    outcomes: new Map<string, number>(),
  };
  const idx = (m: Map<string, number>, v: string) => {
    let i = m.get(v);
    if (i === undefined) {
      i = m.size;
      m.set(v, i);
    }
    return i;
  };
  const rows: CompactCrimes["rows"] = crimes.map((c) => [
    c.id,
    idx(tables.categories, c.category),
    idx(tables.streets, c.street),
    Math.round(c.lat * 1e6) / 1e6,
    Math.round(c.lng * 1e6) / 1e6,
    idx(tables.months, c.month),
    c.outcome === null ? -1 : idx(tables.outcomes, c.outcome),
  ]);
  return {
    categories: [...tables.categories.keys()],
    streets: [...tables.streets.keys()],
    months: [...tables.months.keys()],
    outcomes: [...tables.outcomes.keys()],
    rows,
  };
}

export function unpackCrimes(p: CompactCrimes): Crime[] {
  return p.rows.map(([id, cat, street, lat, lng, month, outcome]) => ({
    id,
    category: p.categories[cat],
    street: p.streets[street],
    lat,
    lng,
    month: p.months[month],
    outcome: outcome < 0 ? null : p.outcomes[outcome],
    source: "police" as const,
  }));
}
