import crypto from "node:crypto";
import type { ChatCompletionTool } from "groq-sdk/resources/chat/completions";
import { duffelFetch } from "./duffel.js";
import { simplifyOffer } from "../routes/duffel.js";
import type { DuffelOfferRequest, DuffelPlace } from "./duffelTypes.js";
import { cheapestPrice, searchHotels, searchRegions } from "./hotelsProvider.js";
import type { HotelsProviderProperty } from "./hotelsProviderTypes.js";
import { computeRoute, geocodeAddress } from "./routing.js";
import { CAB_TYPES, estimateFare } from "./cabRates.js";
import { cacheSet } from "./searchCache.js";
import { db } from "../db/client.js";

// Tools the support chatbot can call. Kept separate from the
// duffel/stays/cabs routers (which serve the search/booking UI) so the tool
// schemas and the HTTP request shapes can evolve independently, even though
// both call the same upstream APIs — mirrors airline-booking-app's chatTools.ts.

export const chatTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_airports",
      description:
        "Resolve a free-text city or airport name (e.g. 'Tokyo' or 'JFK') to IATA airport codes. Call this before search_flights whenever the user gives a city/airport name instead of a 3-letter code.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "City, airport, or country name to search for" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_flights",
      description:
        "Search live flight offers between two airports on a given date. Origin and destination must be 3-letter IATA airport codes — use search_airports first to resolve a city name. FareCompass doesn't sell tickets itself; each result links to the airline's own site to complete booking.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin airport IATA code, e.g. JFK" },
          destination: { type: "string", description: "Destination airport IATA code, e.g. LHR" },
          date: { type: "string", description: "Departure date, YYYY-MM-DD" },
          returnDate: { type: "string", description: "Return date for a round trip, YYYY-MM-DD (omit for one-way)" },
          passengers: { type: "integer", description: "Number of adult passengers (default 1)" },
        },
        required: ["origin", "destination", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_hotel_destinations",
      description: "Resolve a free-text city/neighborhood name to a destination id. Call this before search_hotels.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "City or neighborhood name to search for" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_hotels",
      description:
        "Search real hotels for a destination and date range. regionId must come from search_hotel_destinations first. FareCompass books these directly (no redirect) once the traveler fills in their name/email on the hotel's page.",
      parameters: {
        type: "object",
        properties: {
          regionId: { type: "string", description: "Destination id from search_hotel_destinations" },
          cityLabel: { type: "string", description: "Human-readable destination label, e.g. 'Paris'" },
          checkInDate: { type: "string", description: "Check-in date, YYYY-MM-DD" },
          checkOutDate: { type: "string", description: "Check-out date, YYYY-MM-DD" },
          guests: { type: "integer", description: "Number of guests (default 2)" },
        },
        required: ["regionId", "checkInDate", "checkOutDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_cab_fare",
      description:
        "Estimate a cab fare between two addresses using a real driving route. FareCompass books these directly (no redirect) once the traveler fills in their name/email/phone on the fare-options page.",
      parameters: {
        type: "object",
        properties: {
          pickup: { type: "string", description: "Pickup address or place name" },
          dropoff: { type: "string", description: "Drop-off address or place name" },
          pickupTime: { type: "string", description: "Pickup date/time, ISO 8601 (defaults to now if omitted)" },
        },
        required: ["pickup", "dropoff"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_hotel_bookings",
      description: "Look up a traveler's existing hotel bookings by the email they booked with.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Guest email address used at booking time" },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_cab_bookings",
      description: "Look up a traveler's existing cab bookings by the email they booked with.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Guest email address used at booking time" },
        },
        required: ["email"],
      },
    },
  },
];

const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;

async function searchAirports(query: string) {
  if (query.trim().length < 2) return { places: [] };
  const places = await duffelFetch<DuffelPlace[]>(`/places/suggestions?query=${encodeURIComponent(query)}`);
  return {
    places: places
      .filter((p) => p.iata_code)
      .slice(0, 8)
      .map((p) => ({ iataCode: p.iata_code, name: p.name, cityName: p.city_name, countryCode: p.iata_country_code })),
  };
}

async function searchFlights(input: {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  passengers?: number;
}) {
  const numPassengers = Math.min(6, Math.max(1, Number(input.passengers) || 1));
  const slices = [
    { origin: input.origin.toUpperCase(), destination: input.destination.toUpperCase(), departure_date: input.date },
  ];
  if (input.returnDate) {
    slices.push({
      origin: input.destination.toUpperCase(),
      destination: input.origin.toUpperCase(),
      departure_date: input.returnDate,
    });
  }

  const offerRequest = await duffelFetch<DuffelOfferRequest>("/air/offer_requests?return_offers=true", {
    method: "POST",
    body: JSON.stringify({
      data: { slices, passengers: Array.from({ length: numPassengers }, () => ({ type: "adult" })), cabin_class: "economy" },
    }),
  });

  // Cap to the 5 cheapest so results stay small enough for the model to
  // reason over and quote back without ballooning the conversation's tokens.
  const offers = offerRequest.offers
    .map(simplifyOffer)
    .sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount))
    .slice(0, 5);

  return { offers };
}

async function searchHotelDestinations(query: string) {
  if (query.trim().length < 2) return { destinations: [] };
  const regions = await searchRegions(query);
  return {
    destinations: regions.slice(0, 8).map((r) => ({
      regionId: r.gaiaId,
      label: r.regionNames.primaryDisplayName,
      secondaryLabel: r.regionNames.secondaryDisplayName,
    })),
  };
}

function simplifyHotelProperty(property: HotelsProviderProperty) {
  return {
    hotelId: property.id,
    name: property.name,
    rating: property.guestRating?.rating ?? null,
    reviewCount: property.guestRating?.totalReviews ?? 0,
    price: cheapestPrice(property),
  };
}

async function searchHotelsTool(input: {
  regionId: string;
  cityLabel?: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
}) {
  const guests = Math.min(8, Math.max(1, Number(input.guests) || 2));
  const properties = await searchHotels(input.regionId, input.checkInDate, input.checkOutDate, guests);

  // Cache under the exact key shape routes/stays.ts's GET /hotel/:hotelId
  // reads from, so a link generated here (/hotels/HOTEL_ID?searchId=...)
  // lands on a real, working detail page.
  const searchId = crypto.randomUUID();
  cacheSet(
    `stays:${searchId}`,
    { cityLabel: input.cityLabel ?? "", checkInDate: input.checkInDate, checkOutDate: input.checkOutDate, guests, properties },
    SEARCH_CACHE_TTL_MS,
  );

  const hotels = properties
    .map(simplifyHotelProperty)
    .filter((h) => h.price !== null)
    .sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0))
    .slice(0, 5);

  return { searchId, hotels };
}

async function estimateCabFareTool(input: { pickup: string; dropoff: string; pickupTime?: string }) {
  const [pickupMatches, dropoffMatches] = await Promise.all([
    geocodeAddress(input.pickup),
    geocodeAddress(input.dropoff),
  ]);
  const pickup = pickupMatches[0];
  const dropoff = dropoffMatches[0];
  if (!pickup) return { error: `Couldn't find an address matching "${input.pickup}"` };
  if (!dropoff) return { error: `Couldn't find an address matching "${input.dropoff}"` };

  const { distanceKm, durationMin } = await computeRoute(pickup, dropoff);
  const options = CAB_TYPES.map((cabType) => ({
    cabType: cabType.id,
    label: cabType.label,
    fare: estimateFare(cabType, distanceKm, durationMin),
  }));

  const pickupTime = input.pickupTime && !Number.isNaN(Date.parse(input.pickupTime)) ? input.pickupTime : new Date().toISOString();
  const params = new URLSearchParams({
    pickupLabel: pickup.label,
    pickupLat: String(pickup.lat),
    pickupLng: String(pickup.lng),
    dropoffLabel: dropoff.label,
    dropoffLat: String(dropoff.lat),
    dropoffLng: String(dropoff.lng),
    pickupTime,
  });

  return {
    pickup: pickup.label,
    dropoff: dropoff.label,
    distanceKm,
    durationMin,
    options,
    bookingLink: `/cabs/estimate?${params.toString()}`,
  };
}

async function findHotelBookings(email: string) {
  const bookings = await db.query.hotelBookings.findMany({
    where: (t, { eq, sql }) => eq(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return {
    bookings: bookings.map((b) => ({
      hotelName: b.hotelName,
      cityLabel: b.cityLabel,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      totalAmount: Number(b.totalAmount),
      totalCurrency: b.totalCurrency,
      bookingReference: b.bookingReference,
      status: b.status,
    })),
  };
}

async function findCabBookings(email: string) {
  const bookings = await db.query.cabBookings.findMany({
    where: (t, { eq, sql }) => eq(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return {
    bookings: bookings.map((b) => ({
      pickupLabel: b.pickupLabel,
      dropoffLabel: b.dropoffLabel,
      pickupTime: b.pickupTime.toISOString(),
      cabType: b.cabType,
      fare: Number(b.fare),
      currency: b.currency,
      status: b.status,
    })),
  };
}

// Executes a tool call and always returns a JSON string — tool errors are
// serialized into the result (rather than thrown) so the model can see what
// went wrong and explain it to the user instead of the turn just failing.
export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case "search_airports":
        return JSON.stringify(await searchAirports(String(input.query ?? "")));
      case "search_flights":
        return JSON.stringify(
          await searchFlights(
            input as { origin: string; destination: string; date: string; returnDate?: string; passengers?: number },
          ),
        );
      case "search_hotel_destinations":
        return JSON.stringify(await searchHotelDestinations(String(input.query ?? "")));
      case "search_hotels":
        return JSON.stringify(
          await searchHotelsTool(
            input as { regionId: string; cityLabel?: string; checkInDate: string; checkOutDate: string; guests?: number },
          ),
        );
      case "estimate_cab_fare":
        return JSON.stringify(
          await estimateCabFareTool(input as { pickup: string; dropoff: string; pickupTime?: string }),
        );
      case "find_hotel_bookings":
        return JSON.stringify(await findHotelBookings(String(input.email ?? "")));
      case "find_cab_bookings":
        return JSON.stringify(await findCabBookings(String(input.email ?? "")));
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : "Tool call failed" });
  }
}
