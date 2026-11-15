import { NextResponse } from "next/server";
import { findCity } from "@/lib/cities";
import { fetchCityCrimes, latestMonths } from "@/lib/police";
import { packCrimes } from "@/lib/compact";
import type { CrimesResponse } from "@/lib/types";

// Same window as the original project: six months at a time keeps the map fast.
const MONTHS = 6;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = findCity(searchParams.get("city"));
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }
  try {
    const months = await latestMonths(MONTHS);
    const crimes = await fetchCityCrimes(city, months);
    const body: CrimesResponse = {
      city,
      months: [...months].sort(),
      crimes: packCrimes(crimes),
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Couldn't reach data.police.uk. Please try again in a minute." },
      { status: 502 },
    );
  }
}
