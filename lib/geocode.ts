// The original used the OpenCage API (needs a key). This uses OpenStreetMap's Nominatim,
// which is free and allows browser requests. Its usage policy asks for no more than one
// request a second, which manual reports stay well under.
export interface Place {
  lat: number;
  lng: number;
  label: string;
}

export async function geocode(query: string): Promise<Place> {
  const q = query.trim();
  if (q.length < 3) throw new Error("Please enter a location.");
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=gb&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: { "Accept-Language": "en-GB" } });
  if (!res.ok) throw new Error("Location lookup failed.");
  const hits = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hits.length) throw new Error("Couldn't find that place in the UK.");
  return { lat: Number(hits[0].lat), lng: Number(hits[0].lon), label: hits[0].display_name };
}
