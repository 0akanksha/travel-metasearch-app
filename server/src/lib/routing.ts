// Real geocoding + real driving routes, both from free, keyless public
// services — no self-serve provider survived without either a sales gate
// (Duffel Stays), a shutdown (Amadeus), or a billing pre-auth the user
// wasn't comfortable with (Google Maps Platform). Nominatim and OSRM's
// public demo server need no account at all.
//
// Nominatim's usage policy caps the public instance at ~1 request/second
// and requires a real User-Agent (not a browser UA) — respected here by
// relying on the caller's debounce (see AddressAutocomplete.tsx), not by
// rate-limiting server-side. OSRM's demo server has no uptime guarantee
// ("not for production") — acceptable for this app's scale; swapping in a
// self-hosted/paid instance later only touches this one file.

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
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  // Without this, Nominatim falls back to each place's local-language name
  // (e.g. Arabic script for Middle Eastern addresses) instead of English.
  url.searchParams.set("accept-language", "en");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
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
