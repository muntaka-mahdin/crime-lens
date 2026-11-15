"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
import { categoryLabel } from "@/lib/categories";
import { countByCategory, countByMonth, topLocations } from "@/lib/stats";
import type { Crime } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip);

const GRID = "rgba(148, 163, 184, 0.15)";
const TEXT = "#cbd5e1";

function baseOptions<T extends "bar" | "line">(horizontal = false): ChartOptions<T> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: TEXT }, grid: { color: GRID } },
      y: { ticks: { color: TEXT }, grid: { color: GRID }, beginAtZero: true },
    },
  } as unknown as ChartOptions<T>;
}

function shortMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export default function Charts({ crimes, months }: { crimes: Crime[]; months: string[] }) {
  const byType = useMemo(() => countByCategory(crimes), [crimes]);
  const byMonth = useMemo(() => countByMonth(crimes, months), [crimes, months]);
  const top = useMemo(() => topLocations(crimes, 10), [crimes]);

  return (
    <section className="charts">
      <div className="card chart">
        <h2>Crimes by type</h2>
        <div className="chart-box">
          <Bar
            options={baseOptions<"bar">(true)}
            data={{
              labels: byType.map((c) => categoryLabel(c.label)),
              datasets: [{ data: byType.map((c) => c.count), backgroundColor: "#3b82f6", borderRadius: 4 }],
            }}
          />
        </div>
      </div>
      <div className="card chart">
        <h2>Monthly trend</h2>
        <div className="chart-box">
          <Line
            options={baseOptions<"line">()}
            data={{
              labels: byMonth.map((c) => shortMonth(c.label)),
              datasets: [
                {
                  data: byMonth.map((c) => c.count),
                  borderColor: "#38bdf8",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  fill: true,
                  tension: 0.3,
                },
              ],
            }}
          />
        </div>
      </div>
      <div className="card chart">
        <h2>Top 10 hotspots</h2>
        <div className="chart-box">
          <Bar
            options={baseOptions<"bar">(true)}
            data={{
              labels: top.map((c) => c.label.replace(/^On or near /, "")),
              datasets: [{ data: top.map((c) => c.count), backgroundColor: "#f97316", borderRadius: 4 }],
            }}
          />
        </div>
      </div>
    </section>
  );
}
