"use client";

import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Crime } from "@/lib/types";

interface Props {
  defaultMonth?: string;
  onClose: () => void;
  onSaved: (crime: Crime) => void;
}

export default function ReportForm({ defaultMonth, onClose, onSaved }: Props) {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [month, setMonth] = useState(defaultMonth ?? new Date().toISOString().slice(0, 7));
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Same rule as the original: type, location and date are required.
    if (!category || !location.trim() || !month) {
      setError("Please fill in the crime type, location and month.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(location)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Location lookup failed.");
      onSaved({
        id: `report-${Date.now()}`,
        category,
        street: location.trim(),
        lat: body.lat,
        lng: body.lng,
        month,
        outcome: null,
        source: "report",
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Report a crime</h2>
        <p className="muted small">
          This demo saves reports in your browser only. To report a real crime, call 999 in an
          emergency or 101 otherwise.
        </p>
        <label>
          Crime type
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Choose…</option>
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Queensgate, Huddersfield"
            required
          />
        </label>
        <label>
          Month
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
        </label>
        <label>
          Description (optional)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Finding location…" : "Add to map"}
          </button>
        </div>
      </form>
    </div>
  );
}
