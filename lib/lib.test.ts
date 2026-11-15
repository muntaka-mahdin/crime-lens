import { describe, expect, it } from "vitest";
import { dedupeCrimes } from "./dedupe";
import { packCrimes, unpackCrimes } from "./compact";
import { applyFilters, countByCategory, countByMonth, topLocations } from "./stats";
import { normaliseCrime } from "./police";
import type { Crime } from "./types";

const crime = (over: Partial<Crime> = {}): Crime => ({
  id: "1",
  category: "burglary",
  street: "On or near High Street",
  lat: 53.6458,
  lng: -1.785,
  month: "2026-08",
  outcome: null,
  source: "police",
  ...over,
});

describe("dedupeCrimes", () => {
  it("drops records with the same police id", () => {
    expect(dedupeCrimes([crime(), crime()])).toHaveLength(1);
  });
  it("keeps different crimes at the same anonymised point", () => {
    expect(dedupeCrimes([crime({ id: "1" }), crime({ id: "2" })])).toHaveLength(2);
  });
  it("falls back to type, location and month when there is no id", () => {
    const a = crime({ id: "" });
    expect(dedupeCrimes([a, { ...a }, crime({ id: "", month: "2026-09" })])).toHaveLength(2);
  });
});

describe("pack / unpack", () => {
  it("round-trips crimes", () => {
    const list = [crime(), crime({ id: "2", category: "drugs", outcome: "Under investigation" })];
    expect(unpackCrimes(packCrimes(list))).toEqual(list);
  });
});

describe("stats", () => {
  const list = [
    crime({ id: "1", category: "burglary", street: "A" }),
    crime({ id: "2", category: "drugs", street: "A", month: "2026-09" }),
    crime({ id: "3", category: "drugs", street: "B", month: "2026-09" }),
  ];
  it("counts by category, most common first", () => {
    expect(countByCategory(list)).toEqual([
      { label: "drugs", count: 2 },
      { label: "burglary", count: 1 },
    ]);
  });
  it("counts by month in order and keeps empty months", () => {
    expect(countByMonth(list, ["2026-07"]).map((c) => c.count)).toEqual([0, 1, 2]);
  });
  it("ranks hotspots", () => {
    expect(topLocations(list, 1)).toEqual([{ label: "A", count: 2 }]);
  });
  it("filters by type and month", () => {
    expect(applyFilters(list, { category: "drugs", month: "2026-09" })).toHaveLength(2);
    expect(applyFilters(list, { category: "all", month: "2026-08" })).toHaveLength(1);
  });
});

describe("normaliseCrime", () => {
  it("maps the police API shape", () => {
    const c = normaliseCrime({
      id: 99,
      persistent_id: "x",
      category: "robbery",
      month: "2026-08",
      location: { latitude: "53.1", longitude: "-1.2", street: { id: 5, name: "On or near Park" } },
      outcome_status: { category: "Investigation complete", date: "2026-09" },
    });
    expect(c).toMatchObject({ id: "99", lat: 53.1, lng: -1.2, street: "On or near Park", outcome: "Investigation complete" });
  });
  it("skips records without a location", () => {
    expect(
      normaliseCrime({ id: 1, persistent_id: "", category: "x", month: "2026-08", location: null, outcome_status: null }),
    ).toBeNull();
  });
});
