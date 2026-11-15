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

/** Compact payload sent from the API route to keep responses small. */
export interface CompactCrimes {
  categories: string[];
  streets: string[];
  months: string[];
  outcomes: string[];
  /** [id, categoryIdx, streetIdx, lat, lng, monthIdx, outcomeIdx (-1 = none)] */
  rows: [string, number, number, number, number, number, number][];
}

export interface CrimesResponse {
  city: City;
  months: string[];
  crimes: CompactCrimes;
  fetchedAt: string;
}
