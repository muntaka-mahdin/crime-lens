"use client";

import L from "leaflet";
import { HeatLayer as LeafletHeatLayer } from "leaflet.heat";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { categoryLabel } from "@/lib/categories";
import type { City, Crime } from "@/lib/types";

// Blue (low density) to red (high density), as in the original design.
const GRADIENT = { 0.2: "#2563eb", 0.4: "#06b6d4", 0.6: "#facc15", 0.8: "#f97316", 1.0: "#dc2626" };
const MAX_MARKERS = 3000;

function HeatLayer({ crimes }: { crimes: Crime[] }) {
  const map = useMap();
  useEffect(() => {
    const points = crimes.map((c) => [c.lat, c.lng, 1] as [number, number, number]);
    // leaflet.heat's types target Leaflet 2; at runtime it's a normal Leaflet 1.9 layer.
    const layer = new LeafletHeatLayer(points, {
      radius: 12,
      blur: 15,
      // Each point is drawn at least this opaque and overlaps add up, so keep it low for dense cities.
      minOpacity: 0.02,
      // Intensity that counts as "red". Scaled to the data so only real hotspots reach it.
      max: Math.max(1, crimes.length / 300),
      maxZoom: 18,
      gradient: GRADIENT,
    }) as unknown as L.Layer;
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, crimes]);
  return null;
}

function Legend() {
  const map = useMap();
  useEffect(() => {
    const control = new L.Control({ position: "bottomright" });
    control.onAdd = () => {
      const div = L.DomUtil.create("div", "legend");
      div.innerHTML =
        '<div class="legend-title">Crime density</div><div class="legend-bar"></div><div class="legend-scale"><span>Low</span><span>High</span></div>';
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);
  return null;
}

function FlyToSelected({ crime }: { crime: Crime | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (crime) map.flyTo([crime.lat, crime.lng], Math.max(map.getZoom(), 17), { duration: 0.8 });
  }, [map, crime]);
  return null;
}

function SelectedMarker({ crime }: { crime: Crime }) {
  const ref = useRef<L.CircleMarker>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.openPopup(), 850);
    return () => clearTimeout(t);
  }, [crime]);
  return (
    <CircleMarker
      ref={ref}
      center={[crime.lat, crime.lng]}
      radius={11}
      pathOptions={{ color: "#fff", weight: 3, fillColor: "#ef4444", fillOpacity: 0.9 }}
    >
      <CrimePopup crime={crime} />
    </CircleMarker>
  );
}

function CrimePopup({ crime }: { crime: Crime }) {
  return (
    <Popup>
      <strong>{categoryLabel(crime.category)}</strong>
      <br />
      {crime.street}
      <br />
      {crime.month}
      {crime.source === "report" && <><br /><em>Your report</em></>}
      {crime.description && <><br />{crime.description}</>}
      {crime.outcome && <><br /><span className="muted">Outcome: {crime.outcome}</span></>}
    </Popup>
  );
}

interface Props {
  city: City;
  crimes: Crime[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CrimeMap({ city, crimes, selectedId, onSelect }: Props) {
  const selected = useMemo(() => crimes.find((c) => c.id === selectedId), [crimes, selectedId]);
  // Drawing every point as a marker gets slow, so markers are capped; the heatmap always uses everything.
  const markers = useMemo(() => crimes.slice(0, MAX_MARKERS), [crimes]);

  return (
    <MapContainer center={[city.lat, city.lng]} zoom={14} preferCanvas className="map" scrollWheelZoom>
      {/* Standard OpenStreetMap tiles, darkened with a CSS filter (see .dark-tiles). */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-tiles"
        maxZoom={19}
      />
      <HeatLayer crimes={crimes} />
      {markers.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lng]}
          radius={c.source === "report" ? 7 : 3}
          pathOptions={{
            color: c.source === "report" ? "#a855f7" : "#93c5fd",
            weight: 1,
            fillOpacity: 0.7,
          }}
          eventHandlers={{ click: () => onSelect(c.id) }}
        >
          <CrimePopup crime={c} />
        </CircleMarker>
      ))}
      {selected && <SelectedMarker crime={selected} />}
      <FlyToSelected crime={selected} />
      <Legend />
    </MapContainer>
  );
}
