import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { cruiseBookings } from "../db/schema.js";
import { CRUISE_ITINERARIES } from "../lib/cruiseItineraries.js";
import { verifyTripOwnership } from "./trips.js";

export const cruisesRouter = Router();
export const cruisesAdminRouter = Router();

function serializeBooking(booking: typeof cruiseBookings.$inferSelect) {
  return {
    id: booking.id,
    tripId: booking.tripId,
    itineraryId: booking.itineraryId,
    itineraryTitle: booking.itineraryTitle,
    shipName: booking.shipName,
    departurePort: booking.departurePort,
    sailDate: booking.sailDate,
    nights: booking.nights,
    cabinTier: booking.cabinTier,
    cabinLabel: booking.cabinLabel,
    guestCount: booking.guestCount,
    pricePerPersonUsd: Number(booking.pricePerPersonUsd),
    totalUsd: Number(booking.totalUsd),
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    status: booking.status,
    bookingReference: booking.bookingReference,
    cancelToken: booking.cancelToken,
    createdAt: booking.createdAt.toISOString(),
  };
}

cruisesRouter.post("/booking", async (req, res) => {
  const { itineraryId, cabinTier, sailDate, guestCount, guest, tripId } = req.body as {
    itineraryId?: string;
    cabinTier?: string;
    sailDate?: string;
    guestCount?: number;
    guest?: { name?: string; email?: string; phone?: string };
    tripId?: string;
  };

  const itinerary = CRUISE_ITINERARIES.find((i) => i.id === itineraryId);
  const tier = itinerary?.cabinTiers.find((t) => t.id === cabinTier);

  if (
    !itinerary ||
    !tier ||
    !sailDate ||
    !itinerary.sailDates.includes(sailDate) ||
    !guestCount ||
    guestCount < 1 ||
    guestCount > 8 ||
    !guest?.name ||
    !guest?.email ||
    !guest?.phone
  ) {
    return res.status(400).json({ error: "itinerary, cabin tier, a valid sail date, guest count, and guest info are required" });
  }

  if (tripId && !(await verifyTripOwnership(tripId, guest.email))) {
    return res.status(404).json({ error: "Trip not found" });
  }

  // Never trust a client-supplied total — compute server-side from the catalog price.
  const totalUsd = tier.pricePerPersonUsd * guestCount;

  const [booking] = await db
    .insert(cruiseBookings)
    .values({
      tripId: tripId ?? null,
      itineraryId: itinerary.id,
      itineraryTitle: itinerary.title,
      shipName: itinerary.shipName,
      departurePort: itinerary.departurePort,
      sailDate,
      nights: itinerary.nights,
      cabinTier: tier.id,
      cabinLabel: tier.label,
      guestCount,
      pricePerPersonUsd: String(tier.pricePerPersonUsd),
      totalUsd: String(totalUsd),
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      bookingReference: crypto.randomUUID().slice(0, 8).toUpperCase(),
      cancelToken: crypto.randomUUID(),
    })
    .returning();

  res.status(201).json({ booking: serializeBooking(booking) });
});

cruisesRouter.get("/bookings", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const bookings = await db.query.cruiseBookings.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ bookings: bookings.map(serializeBooking) });
});

cruisesRouter.delete("/bookings/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [booking] = await db.select().from(cruiseBookings).where(eq(cruiseBookings.id, req.params.id));
  if (!booking || booking.cancelToken !== token) {
    return res.status(404).json({ error: "Booking not found" });
  }

  await db.update(cruiseBookings).set({ status: "cancelled" }).where(eq(cruiseBookings.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every cruise booking (mounted behind requireAuth+requireAdmin in index.ts).
cruisesAdminRouter.get("/", async (_req, res) => {
  const bookings = await db.query.cruiseBookings.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ bookings: bookings.map(serializeBooking) });
});
