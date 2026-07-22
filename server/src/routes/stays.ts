import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { hotelBookings } from "../db/schema.js";
import { cacheGet, cacheSet } from "../lib/searchCache.js";
import { cheapestPrice, searchHotels, searchRegions } from "../lib/hotelsProvider.js";
import type { HotelsProviderProperty } from "../lib/hotelsProviderTypes.js";

export const staysRouter = Router();
export const staysAdminRouter = Router();

const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;

function simplifyProperty(property: HotelsProviderProperty) {
  const price = cheapestPrice(property);
  return {
    id: property.id,
    name: property.name,
    subtitle: property.messages?.[0] ?? null,
    rating: property.guestRating?.rating ?? null,
    reviewCount: property.guestRating?.totalReviews ?? 0,
    photoUrl: property.mediaSection?.media?.[0]?.url ?? null,
    price,
  };
}

function serializeBooking(booking: typeof hotelBookings.$inferSelect) {
  return {
    id: booking.id,
    providerHotelId: booking.providerHotelId,
    bookingReference: booking.bookingReference,
    hotelName: booking.hotelName,
    cityLabel: booking.cityLabel,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    guestCount: booking.guestCount,
    totalAmount: Number(booking.totalAmount),
    totalCurrency: booking.totalCurrency,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    status: booking.status,
    cancelToken: booking.cancelToken,
    createdAt: booking.createdAt.toISOString(),
  };
}

// Backs the destination autocomplete on the hotel search form — the
// "Hotels.com Provider" listing uses its own gaiaId regions, unrelated to
// Duffel's IATA place codes, so this can't reuse /api/duffel/places.
staysRouter.get("/places", async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (query.length < 2) return res.json({ places: [] });

  try {
    const regions = await searchRegions(query);
    res.json({
      places: regions.slice(0, 8).map((r) => ({
        regionId: r.gaiaId,
        type: r.type,
        label: r.regionNames.primaryDisplayName,
        secondaryLabel: r.regionNames.secondaryDisplayName,
      })),
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Destination lookup failed" });
  }
});

staysRouter.post("/search", async (req, res) => {
  const { regionId, cityLabel, checkInDate, checkOutDate, guests } = req.body as {
    regionId?: string;
    cityLabel?: string;
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
  };
  if (!regionId || !checkInDate || !checkOutDate) {
    return res.status(400).json({ error: "regionId, checkInDate, and checkOutDate are required" });
  }

  try {
    const properties = await searchHotels(regionId, checkInDate, checkOutDate, Math.min(8, Math.max(1, Number(guests) || 1)));
    const searchId = crypto.randomUUID();
    cacheSet(
      `stays:${searchId}`,
      { cityLabel: cityLabel ?? "", checkInDate, checkOutDate, guests: Number(guests) || 1, properties },
      SEARCH_CACHE_TTL_MS,
    );
    res.json({ searchId, hotels: properties.map(simplifyProperty) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Hotel search failed" });
  }
});

interface CachedStaysSearch {
  cityLabel: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  properties: HotelsProviderProperty[];
}

// No confirmed room/rate-detail endpoint exists on this listing — the
// detail page reads the one property it needs back out of the already-
// cached search response instead of making a second external call.
staysRouter.get("/hotel/:hotelId", async (req, res) => {
  const searchId = typeof req.query.searchId === "string" ? req.query.searchId : "";
  const cached = cacheGet<CachedStaysSearch>(`stays:${searchId}`);
  if (!cached) return res.status(404).json({ error: "Search results expired — try searching again" });

  const property = cached.properties.find((p) => p.id === req.params.hotelId);
  if (!property) return res.status(404).json({ error: "Hotel not found in this search" });

  res.json({
    hotel: {
      ...simplifyProperty(property),
      cityLabel: cached.cityLabel,
      checkInDate: cached.checkInDate,
      checkOutDate: cached.checkOutDate,
      guests: cached.guests,
      photos: property.mediaSection?.media?.map((m) => m.url) ?? [],
      amenities: property.messages ?? [],
    },
  });
});

staysRouter.post("/book", async (req, res) => {
  const { hotelId, hotelName, cityLabel, price, currency, checkInDate, checkOutDate, guests, guest } = req.body as {
    hotelId?: string;
    hotelName?: string;
    cityLabel?: string;
    price?: number;
    currency?: string;
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
    guest?: { name?: string; email?: string };
  };
  if (!hotelId || !hotelName || !checkInDate || !checkOutDate || !price || !currency || !guest?.name || !guest?.email) {
    return res.status(400).json({ error: "hotelId, hotelName, dates, price, and guest name/email are required" });
  }

  const [booking] = await db
    .insert(hotelBookings)
    .values({
      providerHotelId: hotelId,
      bookingReference: crypto.randomUUID().slice(0, 8).toUpperCase(),
      hotelName,
      cityLabel: cityLabel ?? "",
      checkInDate,
      checkOutDate,
      guestCount: Math.min(8, Math.max(1, Number(guests) || 1)),
      totalAmount: String(price),
      totalCurrency: currency,
      guestName: guest.name,
      guestEmail: guest.email,
      cancelToken: crypto.randomUUID(),
    })
    .returning();

  res.status(201).json({ booking: serializeBooking(booking) });
});

staysRouter.get("/bookings", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const bookings = await db.query.hotelBookings.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ bookings: bookings.map(serializeBooking) });
});

staysRouter.delete("/bookings/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [booking] = await db.select().from(hotelBookings).where(eq(hotelBookings.id, req.params.id));
  if (!booking || booking.cancelToken !== token) {
    return res.status(404).json({ error: "Booking not found" });
  }

  await db.update(hotelBookings).set({ status: "cancelled" }).where(eq(hotelBookings.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every hotel booking (mounted behind requireAuth+requireAdmin in index.ts).
staysAdminRouter.get("/", async (_req, res) => {
  const bookings = await db.query.hotelBookings.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ bookings: bookings.map(serializeBooking) });
});
