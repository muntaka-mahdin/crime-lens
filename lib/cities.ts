import type { City } from "./types";

// The original project covered Huddersfield and Manchester. Greater Manchester
// Police don't currently publish street-level crimes to data.police.uk, so
// Manchester is replaced here with other cities that have full data.
// data.police.uk returns crimes within a one mile radius of each point.
export const CITIES: City[] = [
  { slug: "huddersfield", name: "Huddersfield", lat: 53.6458, lng: -1.785 },
  { slug: "leeds", name: "Leeds", lat: 53.7997, lng: -1.5492 },
  { slug: "sheffield", name: "Sheffield", lat: 53.3811, lng: -1.4701 },
  { slug: "birmingham", name: "Birmingham", lat: 52.4862, lng: -1.8904 },
  { slug: "london", name: "London (Westminster)", lat: 51.5074, lng: -0.1278 },
];

export function findCity(slug: string | null | undefined): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
