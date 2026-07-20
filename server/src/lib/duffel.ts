import type { DuffelOfferRequest } from "./duffelTypes.js";

const DUFFEL_BASE_URL = "https://api.duffel.com";

interface DuffelErrorBody {
  errors?: { message?: string; title?: string }[];
}

// Thin wrapper, not the official @duffel/api SDK — the surface we need
// (offer requests, offers, orders) is small enough that a direct fetch
// keeps this simple.
//
// Retries on 429: the calendar/everywhere fan-out routes can fire dozens of
// requests for one page load, which trips Duffel test-mode's rate limit
// well before it trips any deliberate concurrency cap on our side. Without
// a retry, that surfaces as a wall of "no results" instead of a plain
// slowdown — worth a couple of backoff-and-retry passes before giving up.
export async function duffelFetch<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
  const res = await fetch(`${DUFFEL_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 429 && attempt < 3) {
    const resetSeconds = Number(res.headers.get("ratelimit-reset"));
    const waitMs = Number.isFinite(resetSeconds) && resetSeconds > 0 ? Math.min(resetSeconds * 1000, 4000) : 500 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return duffelFetch<T>(path, init, attempt + 1);
  }

  const body = (await res.json()) as { data?: T } & DuffelErrorBody;

  if (!res.ok) {
    const message = body.errors?.[0]?.message ?? `Duffel request failed (${res.status})`;
    throw new Error(message);
  }

  return body.data as T;
}

// Single-adult, single-date lookup shared by the calendar/everywhere fan-out
// routes and the price-alerts recheck job — they only need the cheapest
// fare, not the full offer list.
export async function cheapestFare(
  origin: string,
  destination: string,
  date: string,
): Promise<{ price: number; currency: string; destinationName: string | null } | null> {
  try {
    const offerRequest = await duffelFetch<DuffelOfferRequest>("/air/offer_requests?return_offers=true", {
      method: "POST",
      body: JSON.stringify({
        data: {
          slices: [{ origin, destination, departure_date: date }],
          passengers: [{ type: "adult" }],
          cabin_class: "economy",
        },
      }),
    });
    if (offerRequest.offers.length === 0) return null;
    const cheapest = offerRequest.offers.reduce((min, o) => (Number(o.total_amount) < Number(min.total_amount) ? o : min));
    return {
      price: Number(cheapest.total_amount),
      currency: cheapest.total_currency,
      destinationName: cheapest.slices[0]?.destination.name ?? null,
    };
  } catch (err) {
    console.error(`[cheapestFare] ${origin}->${destination} ${date}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
