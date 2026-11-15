import { NextResponse } from "next/server";

// The original used the OpenCage API (needs a key). This uses OpenStreetMap's
// Nominatim, which is free; its usage policy asks for a clear User-Agent and
// no more than one request a second, which a demo's manual reports stay well under.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Please enter a location." }, { status: 400 });
  }
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=gb&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { "User-Agent": "CrimeLens-portfolio-demo/2.0", "Accept-Language": "en-GB" },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Location lookup failed." }, { status: 502 });
  }
  const hits = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hits.length) {
    return NextResponse.json({ error: "Couldn't find that place in the UK." }, { status: 404 });
  }
  return NextResponse.json({
    lat: Number(hits[0].lat),
    lng: Number(hits[0].lon),
    label: hits[0].display_name,
  });
}
