// Real geocoding + real driving routes for cabs.
//
// Geocoding: public Nominatim (nominatim.openstreetmap.org) worked in dev
// but returned 429 from Render's shared IP in production — its usage policy
// throttles cloud-hosting traffic harder than residential. Swapped for the
// "Forward & Reverse Geocoding" listing on RapidAPI (same account already
// used for hotels, same underlying OpenStreetMap/Nominatim data, but hosted
// so it isn't subject to the public instance's IP-based throttling) —
// confirmed live with a real query before wiring this up, response shape is
// identical to public Nominatim's (display_name/lat/lon).
//
// Routing: OSRM's public demo server (router.project-osrm.org) had no such
// problem on Render, so it's untouched. It has no uptime guarantee ("not
// for production") — acceptable for this app's scale; swapping in a
// self-hosted/paid instance later only touches this one function.

const GEOCODING_HOST = "forward-reverse-geocoding.p.rapidapi.com";
const USER_AGENT = "FareCompass/1.0 (personal project; hotel/cab search demo)";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface GeoPlace {
  label: string;
  lat: number;
  lng: number;
}

export async function geocodeAddress(query: string): Promise<GeoPlace[]> {
  const url = new URL(`https://${GEOCODING_HOST}/v1/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  // Without this, results come back in each place's local-language name
  // (e.g. Arabic for Middle Eastern addresses) instead of English.
  url.searchParams.set("accept-language", "en");

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": GEOCODING_HOST,
      "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "",
    },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

  const results = (await res.json()) as NominatimResult[];
  return results.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}

interface OsrmRouteResponse {
  code: string;
  routes: { distance: number; duration: number }[];
}

export async function computeRoute(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
): Promise<{ distanceKm: number; durationMin: number }> {
  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Routing failed (${res.status})`);

  const body = (await res.json()) as OsrmRouteResponse;
  const route = body.routes?.[0];
  if (!route) throw new Error("No route found between these points");

  return { distanceKm: route.distance / 1000, durationMin: route.duration / 60 };
}
