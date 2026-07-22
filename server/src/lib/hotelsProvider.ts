import type {
  HotelsProviderProperty,
  HotelsProviderRegionsResponse,
  HotelsProviderSearchResponse,
} from "./hotelsProviderTypes.js";

const HOTELS_PROVIDER_BASE_URL = "https://hotels-com-provider.p.rapidapi.com";
const HOTELS_PROVIDER_HOST = "hotels-com-provider.p.rapidapi.com";

// Thin wrapper around an unofficial RapidAPI listing (no official SDK) —
// real search/pricing data (Expedia's own internal API), but no
// booking-creation endpoint exists on it, so bookings are entirely local
// (see routes/stays.ts). Same shape as lib/duffel.ts's duffelFetch.
async function hotelsProviderFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${HOTELS_PROVIDER_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": HOTELS_PROVIDER_HOST,
      "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "",
    },
  });

  if (!res.ok) {
    throw new Error(`Hotels provider request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function searchRegions(query: string) {
  const res = await hotelsProviderFetch<HotelsProviderRegionsResponse>("/v2/regions", {
    query,
    locale: "en_US",
    domain: "US",
  });
  return res.data ?? [];
}

export async function searchHotels(
  regionId: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number,
) {
  const res = await hotelsProviderFetch<HotelsProviderSearchResponse>("/v3/hotels/search", {
    region_id: regionId,
    checkin_date: checkInDate,
    checkout_date: checkOutDate,
    adults_number: String(adults),
    locale: "en_US",
    domain: "US",
    page_number: "1",
    sort_order: "REVIEW",
  });
  return res.data?.properties ?? [];
}

// Symbol -> ISO 4217 code. The listing only ever gives display-formatted
// price strings (e.g. "€971"), never a separate amount/currency pair.
const CURRENCY_SYMBOLS: Record<string, string> = {
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₩": "KRW",
  "₽": "RUB",
  $: "USD",
};

export function parsePrice(formatted: string | undefined): { amount: number; currency: string } | null {
  if (!formatted) return null;
  const symbol = Object.keys(CURRENCY_SYMBOLS).find((s) => formatted.includes(s));
  const currency = symbol ? CURRENCY_SYMBOLS[symbol] : "USD";
  const amount = Number(formatted.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount)) return null;
  return { amount, currency };
}

// Every property in a search response carries a STRIKEOUT (original) and
// LEAD (current, discounted) price — LEAD is the one to show/book against.
export function cheapestPrice(property: HotelsProviderProperty): { amount: number; currency: string } | null {
  const displayPrices = property.price?.priceSummary?.displayPrices ?? [];
  const lead = displayPrices.find((p) => p.role === "LEAD");
  return parsePrice(lead?.price?.formatted);
}
