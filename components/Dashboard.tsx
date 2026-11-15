"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CITIES, findCity } from "@/lib/cities";
import { categoryLabel } from "@/lib/categories";
import { loadCityCrimes } from "@/lib/data";
import { applyFilters, countByCategory } from "@/lib/stats";
import type { Crime } from "@/lib/types";
import Charts from "./Charts";
import CrimeList from "./CrimeList";
import ReportForm from "./ReportForm";

// Leaflet needs `window`, so the map only renders in the browser.
const CrimeMap = dynamic(() => import("./CrimeMap"), {
  ssr: false,
  loading: () => <div className="map map-loading">Loading map…</div>,
});

const REPORTS_KEY = "crime-lens-reports";

function loadReports(): Crime[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]") as Crime[];
  } catch {
    return [];
  }
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function Dashboard() {
  const [citySlug, setCitySlug] = useState(CITIES[0].slug);
  const [data, setData] = useState<{ months: string[]; crimes: Crime[]; fetchedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reports, setReports] = useState<Crime[]>([]);
  const [showForm, setShowForm] = useState(false);

  const city = CITIES.find((c) => c.slug === citySlug)!;

  // Only the latest request may update the page, so a slow old response can't overwrite a newer city.
  const requestId = useRef(0);
  const load = useCallback(async (slug: string, fresh = false) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loadCityCrimes(findCity(slug)!, { fresh });
      if (id !== requestId.current) return;
      setData(result);
    } catch (e) {
      if (id !== requestId.current) return;
      console.error(e);
      setError("Couldn't reach data.police.uk. Please try again in a minute.");
      setData(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  useEffect(() => {
    setCategory("all");
    setMonth("all");
    setSelectedId(null);
    load(citySlug);
  }, [citySlug, load]);

  const saveReports = (next: Crime[]) => {
    setReports(next);
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
    } catch {
      /* storage can be unavailable in private windows; reports still show this session */
    }
  };

  // Police data plus the user's own reports (kept in this browser only).
  const allCrimes = useMemo(() => [...reports, ...(data?.crimes ?? [])], [data, reports]);

  const filtered = useMemo(() => applyFilters(allCrimes, { category, month }), [allCrimes, category, month]);
  const categories = useMemo(() => countByCategory(allCrimes), [allCrimes]);
  const months = useMemo(() => {
    const set = new Set([...(data?.months ?? []), ...allCrimes.map((c) => c.month)]);
    return [...set].sort().reverse();
  }, [data, allCrimes]);

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>◎</span>
          <div>
            <h1>Crime Lens</h1>
            <p>Street crime around UK city centres, from data.police.uk</p>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Report a crime</button>
          <button className="btn" onClick={() => load(citySlug, true)} disabled={loading}>
            {loading ? "Loading…" : "Refresh police data"}
          </button>
          {reports.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (confirm(`Remove your ${reports.length} reported crime(s) from this browser?`)) saveReports([]);
              }}
            >
              Clear my reports ({reports.length})
            </button>
          )}
        </div>
      </header>

      <section className="filters card">
        <label>
          City
          <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Crime type
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All types</option>
            {categories.map((c) => (
              <option key={c.label} value={c.label}>
                {categoryLabel(c.label)} ({c.count.toLocaleString("en-GB")})
              </option>
            ))}
          </select>
        </label>
        <label>
          Month
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All {months.length} months</option>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </label>
        <div className="stat">
          <strong>{filtered.length.toLocaleString("en-GB")}</strong>
          <span>crimes shown</span>
        </div>
      </section>

      {error && <div className="card error">{error}</div>}

      <section className="grid">
        <div className="card map-card">
          <CrimeMap
            key={citySlug}
            city={city}
            crimes={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="card list-card">
          <CrimeList
            crimes={filtered}
            selectedId={selectedId}
            onShow={setSelectedId}
            onDeleteReport={(id) => saveReports(reports.filter((r) => r.id !== id))}
            loading={loading}
          />
        </div>
      </section>

      <Charts crimes={filtered} months={month === "all" ? data?.months ?? [] : [month]} />

      <footer className="footer">
        Contains public sector information licensed under the Open Government Licence v3.0 (data.police.uk).
        Locations are approximate: the police snap each crime to a nearby anonymous point.
        {data && <> Data fetched {new Date(data.fetchedAt).toLocaleString("en-GB")}.</>}
      </footer>

      {showForm && (
        <ReportForm
          defaultMonth={months[0]}
          onClose={() => setShowForm(false)}
          onSaved={(crime) => {
            saveReports([crime, ...reports]);
            setShowForm(false);
            setCategory("all");
            setMonth("all");
            setSelectedId(crime.id);
          }}
        />
      )}
    </main>
  );
}
