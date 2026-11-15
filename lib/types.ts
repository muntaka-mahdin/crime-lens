export type CrimeSource = "police" | "report";

export interface Crime {
  id: string;
  category: string; // police category slug, e.g. "burglary"
  street: string; // e.g. "On or near Station Road"
  lat: number;
  lng: number;
  month: string; // "YYYY-MM"
  outcome: string | null;
  source: CrimeSource;
  description?: string;
}

export interface City {
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

/** Compact form used for the browser cache (London packs to about 1 MB instead of 3 MB). */
export interface CompactCrimes {
  categories: string[];
  streets: string[];
  months: string[];
  outcomes: string[];
  /** [id, categoryIdx, streetIdx, lat, lng, monthIdx, outcomeIdx (-1 = none)] */
  rows: [string, number, number, number, number, number, number][];
}
