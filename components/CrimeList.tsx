"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryLabel } from "@/lib/categories";
import type { Crime } from "@/lib/types";

const PAGE = 50;

interface Props {
  crimes: Crime[];
  selectedId: string | null;
  onShow: (id: string) => void;
  onDeleteReport: (id: string) => void;
  loading: boolean;
}

export default function CrimeList({ crimes, selectedId, onShow, onDeleteReport, loading }: Props) {
  const [shown, setShown] = useState(PAGE);
  // Newest first, with the user's own reports at the top of each month.
  const sorted = useMemo(
    () =>
      [...crimes].sort(
        (a, b) =>
          b.month.localeCompare(a.month) ||
          Number(b.source === "report") - Number(a.source === "report") ||
          a.street.localeCompare(b.street),
      ),
    [crimes],
  );
  useEffect(() => setShown(PAGE), [crimes]);

  if (loading) return <p className="muted pad">Loading crimes from data.police.uk…</p>;
  if (!sorted.length) return <p className="muted pad">No crimes match these filters.</p>;

  return (
    <div className="list">
      <h2>Crime list</h2>
      <ul>
        {sorted.slice(0, shown).map((c) => (
          <li key={c.id} className={c.id === selectedId ? "active" : undefined}>
            <div>
              <span className={`tag ${c.source === "report" ? "tag-report" : ""}`}>
                {categoryLabel(c.category)}
              </span>
              <div className="street">{c.street}</div>
              <div className="muted small">
                {c.month}
                {c.source === "report" ? " · your report" : c.outcome ? ` · ${c.outcome}` : ""}
              </div>
            </div>
            <div className="row-actions">
              <button className="btn btn-small" onClick={() => onShow(c.id)}>Show on map</button>
              {c.source === "report" && (
                <button className="btn btn-small btn-ghost" onClick={() => onDeleteReport(c.id)}>
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {shown < sorted.length && (
        <button className="btn more" onClick={() => setShown((n) => n + PAGE)}>
          Show more ({(sorted.length - shown).toLocaleString("en-GB")} left)
        </button>
      )}
    </div>
  );
}
