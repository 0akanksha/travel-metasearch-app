import { Router } from "express";
import { cheapestFare, duffelFetch } from "../lib/duffel.js";
import { mapWithConcurrency } from "../lib/concurrency.js";
import { cacheGet, cacheSet } from "../lib/searchCache.js";
import { EVERYWHERE_DESTINATIONS } from "../lib/destinations.js";
import type { DuffelOffer, DuffelOfferRequest, DuffelOrder, DuffelPlace } from "../lib/duffelTypes.js";

export const duffelRouter = Router();
export const duffelAdminRouter = Router();

const CACHE_TTL_MS = 15 * 60 * 1000;
// Duffel test-mode rate limits well before this many requests would
// otherwise justify a higher cap — see the retry-with-backoff note in
// lib/duffel.ts.
const FAN_OUT_CONCURRENCY = 3;

// Backs the origin/destination autocomplete — Duffel's suggestions endpoint does
// fuzzy matching across airport names, city names, and (loosely) country names,
// so users can type "Tokyo" or "Japan" instead of needing to already know "NRT".
duffelRouter.get("/places", async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (query.length < 2) return res.json({ places: [] });

  try {
    const places = await duffelFetch<DuffelPlace[]>(`/places/suggestions?query=${encodeURIComponent(query)}`);
    res.json({
      places: places
        .filter((p) => p.iata_code)
        .slice(0, 8)
        .map((p) => ({
          id: p.id,
          type: p.type,
          iataCode: p.iata_code,
          name: p.name,
          cityName: p.city_name,
          countryCode: p.iata_country_code,
        })),
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Place lookup failed" });
  }
});

export function simplifyOffer(offer: DuffelOffer) {
  return {
    id: offer.id,
    totalAmount: offer.total_amount,
    totalCurrency: offer.total_currency,
    expiresAt: offer.expires_at,
    owner: { name: offer.owner.name, iataCode: offer.owner.iata_code },
    passengerCount: offer.passengers.length,
    slices: offer.slices.map((slice) => ({
      origin: slice.origin.iata_code,
      originName: slice.origin.name,
      destination: slice.destination.iata_code,
      destinationName: slice.destination.name,
      departingAt: slice.segments[0]?.departing_at ?? null,
      arrivingAt: slice.segments[slice.segments.length - 1]?.arriving_at ?? null,
      duration: slice.duration,
      stops: Math.max(0, slice.segments.length - 1),
    })),
  };
}

duffelRouter.post("/search", async (req, res) => {
  const { origin, destination, date, returnDate, passengers } = req.body;
  if (!origin || !destination || !date) {
    return res.status(400).json({ error: "origin, destination, and date are required" });
  }
  const numPassengers = Math.min(6, Math.max(1, Number(passengers) || 1));

  const slices = [{ origin: String(origin).toUpperCase(), destination: String(destination).toUpperCase(), departure_date: date }];
  if (returnDate) {
    slices.push({ origin: String(destination).toUpperCase(), destination: String(origin).toUpperCase(), departure_date: returnDate });
  }

  try {
    const offerRequest = await duffelFetch<DuffelOfferRequest>("/air/offer_requests?return_offers=true", {
      method: "POST",
      body: JSON.stringify({
        data: {
          slices,
          passengers: Array.from({ length: numPassengers }, () => ({ type: "adult" })),
          cabin_class: "economy",
        },
      }),
    });

    res.json({ offers: offerRequest.offers.map(simplifyOffer) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Search failed" });
  }
});

duffelRouter.get("/offers/:offerId", async (req, res) => {
  try {
    const offer = await duffelFetch<DuffelOffer>(`/air/offers/${req.params.offerId}`);
    res.json({ offer: { ...simplifyOffer(offer), passengers: offer.passengers } });
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : "Offer not found — it may have expired" });
  }
});

function simplifyOrder(order: DuffelOrder) {
  return {
    id: order.id,
    bookingReference: order.booking_reference,
    totalAmount: order.total_amount,
    totalCurrency: order.total_currency,
    createdAt: order.created_at,
    owner: { name: order.owner.name, iataCode: order.owner.iata_code },
    slices: order.slices.map((slice) => ({
      origin: slice.origin.iata_code,
      originName: slice.origin.name,
      destination: slice.destination.iata_code,
      destinationName: slice.destination.name,
      departingAt: slice.segments[0]?.departing_at ?? null,
      arrivingAt: slice.segments[slice.segments.length - 1]?.arriving_at ?? null,
      duration: slice.duration,
      stops: Math.max(0, slice.segments.length - 1),
    })),
    passengers: order.passengers.map((p) => ({ id: p.id, givenName: p.given_name, familyName: p.family_name, email: p.email })),
  };
}

duffelRouter.post("/orders", async (req, res) => {
  const { offerId, passengers } = req.body as {
    offerId?: string;
    passengers?: { title: string; gender: string; givenName: string; familyName: string; bornOn: string; email: string; phoneNumber: string }[];
  };
  if (!offerId || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ error: "offerId and passengers are required" });
  }

  try {
    // Fetch a fresh offer right before booking — Duffel offers expire quickly,
    // and the passenger IDs to book against live here. The price is taken from
    // this fresh fetch, never trusted from the client.
    const offer = await duffelFetch<DuffelOffer>(`/air/offers/${offerId}`);
    if (offer.passengers.length !== passengers.length) {
      return res.status(400).json({ error: "Passenger count does not match this offer" });
    }

    const order = await duffelFetch<DuffelOrder>("/air/orders", {
      method: "POST",
      body: JSON.stringify({
        data: {
          selected_offers: [offerId],
          // Test-mode only: Duffel test accounts have a simulated balance,
          // so this completes instantly with no real payment step.
          payments: [{ type: "balance", currency: offer.total_currency, amount: offer.total_amount }],
          passengers: offer.passengers.map((offerPassenger, i) => ({
            id: offerPassenger.id,
            title: passengers[i].title,
            gender: passengers[i].gender,
            given_name: passengers[i].givenName,
            family_name: passengers[i].familyName,
            born_on: passengers[i].bornOn,
            email: passengers[i].email,
            phone_number: passengers[i].phoneNumber,
          })),
        },
      }),
    });

    res.status(201).json({ order: simplifyOrder(order) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Booking failed" });
  }
});

// Manage-booking lookup: keyed by the human-readable booking reference (the
// code passengers actually have), scoped by email so one passenger can't look
// up another's order by guessing a reference.
duffelRouter.get("/orders/by-reference", async (req, res) => {
  const { reference, email } = req.query;
  if (typeof reference !== "string" || typeof email !== "string") {
    return res.status(400).json({ error: "reference and email are required" });
  }

  try {
    const orders = await duffelFetch<DuffelOrder[]>(
      `/air/orders?booking_reference=${encodeURIComponent(reference.toUpperCase())}`,
    );
    const order = orders.find((o) => o.passengers.some((p) => p.email?.toLowerCase() === email.toLowerCase()));
    if (!order) return res.status(404).json({ error: "Booking not found" });
    res.json({ order: simplifyOrder(order) });
  } catch {
    res.status(404).json({ error: "Booking not found" });
  }
});

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Duffel has no native "flexible date calendar" endpoint — this fans out one
// single-date search per day in the visible month (see the plan's "Known
// limitation" note) and caches the result, since a full month is ~30 live
// searches against a third-party API.
duffelRouter.get("/calendar", async (req, res) => {
  const origin = typeof req.query.origin === "string" ? req.query.origin.toUpperCase() : "";
  const destination = typeof req.query.destination === "string" ? req.query.destination.toUpperCase() : "";
  const month = typeof req.query.month === "string" ? req.query.month : "";
  if (!origin || !destination || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "origin, destination, and month (YYYY-MM) are required" });
  }

  const cacheKey = `cal:${origin}:${destination}:${month}`;
  const cached = cacheGet<{ days: { date: string; price: number | null; currency: string }[] }>(cacheKey);
  if (cached) return res.json(cached);

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  const today = todayISO();

  try {
    const results = await mapWithConcurrency(dates, FAN_OUT_CONCURRENCY, async (date) => {
      if (date < today) return { date, price: null, currency: "USD" };
      const fare = await cheapestFare(origin, destination, date);
      return { date, price: fare?.price ?? null, currency: fare?.currency ?? "USD" };
    });
    const payload = { days: results };
    // Only cache if at least one future day actually returned a price — an
    // all-null result usually means Duffel rate-limited most of the fan-out
    // rather than "no availability all month," and caching that would keep
    // showing a broken calendar for the full TTL even after the limit clears.
    if (results.some((d) => d.date >= today && d.price !== null)) {
      cacheSet(cacheKey, payload, CACHE_TTL_MS);
    }
    res.json(payload);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Calendar search failed" });
  }
});

// Duffel has no native "explore everywhere" endpoint either — this fans out
// one search per destination in a curated list (lib/destinations.ts), not
// literally every airport on Earth. See the plan's "Known limitation" note.
duffelRouter.get("/everywhere", async (req, res) => {
  const origin = typeof req.query.origin === "string" ? req.query.origin.toUpperCase() : "";
  const date = typeof req.query.date === "string" ? req.query.date : "";
  if (!origin || !date) {
    return res.status(400).json({ error: "origin and date are required" });
  }

  const cacheKey = `every:${origin}:${date}`;
  const cached = cacheGet<{ destinations: { iataCode: string; cityName: string; countryName: string; price: number; currency: string }[] }>(cacheKey);
  if (cached) return res.json(cached);

  const targets = EVERYWHERE_DESTINATIONS.filter((d) => d.iataCode !== origin);

  try {
    const results = await mapWithConcurrency(targets, FAN_OUT_CONCURRENCY, async (dest) => {
      const fare = await cheapestFare(origin, dest.iataCode, date);
      if (!fare) return null;
      return { iataCode: dest.iataCode, cityName: dest.cityName, countryName: dest.countryName, price: fare.price, currency: fare.currency };
    });
    const destinations = results.filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => a.price - b.price);
    const payload = { destinations };
    // Only cache a non-empty result — an empty one is almost always Duffel
    // rate-limiting the fan-out rather than genuinely zero fares across ~45
    // major airports, and caching that would hide the real data for the
    // full TTL even after the rate limit clears.
    if (destinations.length > 0) {
      cacheSet(cacheKey, payload, CACHE_TTL_MS);
    }
    res.json(payload);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Everywhere search failed" });
  }
});

// Admin-only: every order on the Duffel test account, not scoped to one
// passenger's email (mounted behind requireAuth+requireAdmin in index.ts).
duffelAdminRouter.get("/", async (_req, res) => {
  try {
    const orders = await duffelFetch<DuffelOrder[]>("/air/orders?limit=50");
    res.json({ orders: orders.map(simplifyOrder) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Could not list orders" });
  }
});
