import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { cabBookings } from "../db/schema.js";
import { CAB_TYPES, estimateFare } from "../lib/cabRates.js";
import { computeRoute, geocodeAddress } from "../lib/routing.js";

export const cabsRouter = Router();
export const cabsAdminRouter = Router();

function serializeBooking(booking: typeof cabBookings.$inferSelect) {
  return {
    id: booking.id,
    pickupLabel: booking.pickupLabel,
    dropoffLabel: booking.dropoffLabel,
    distanceKm: Number(booking.distanceKm),
    durationMin: Number(booking.durationMin),
    cabType: booking.cabType,
    fare: Number(booking.fare),
    currency: booking.currency,
    pickupTime: booking.pickupTime.toISOString(),
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    status: booking.status,
    cancelToken: booking.cancelToken,
    createdAt: booking.createdAt.toISOString(),
  };
}

cabsRouter.get("/places", async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (query.length < 3) return res.json({ places: [] });

  try {
    const places = await geocodeAddress(query);
    res.json({ places });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Address lookup failed" });
  }
});

cabsRouter.post("/estimate", async (req, res) => {
  const { pickup, dropoff } = req.body as {
    pickup?: { lat: number; lng: number; label: string };
    dropoff?: { lat: number; lng: number; label: string };
  };
  if (!pickup || !dropoff) {
    return res.status(400).json({ error: "pickup and dropoff are required" });
  }

  try {
    const { distanceKm, durationMin } = await computeRoute(pickup, dropoff);
    const options = CAB_TYPES.map((cabType) => ({
      cabType: cabType.id,
      label: cabType.label,
      seats: cabType.seats,
      fare: estimateFare(cabType, distanceKm, durationMin),
    }));
    res.json({ distanceKm, durationMin, options });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Fare estimate failed" });
  }
});

cabsRouter.post("/book", async (req, res) => {
  const { pickup, dropoff, distanceKm, durationMin, cabType, fare, pickupTime, guest } = req.body as {
    pickup?: { lat: number; lng: number; label: string };
    dropoff?: { lat: number; lng: number; label: string };
    distanceKm?: number;
    durationMin?: number;
    cabType?: string;
    fare?: number;
    pickupTime?: string;
    guest?: { name?: string; email?: string; phone?: string };
  };
  const cabTypeDef = CAB_TYPES.find((c) => c.id === cabType);
  if (!pickup || !dropoff || !cabTypeDef || !fare || !pickupTime || !guest?.name || !guest?.email || !guest?.phone) {
    return res.status(400).json({ error: "pickup, dropoff, cabType, fare, pickupTime, and guest info are required" });
  }

  const [booking] = await db
    .insert(cabBookings)
    .values({
      pickupLabel: pickup.label,
      pickupLat: String(pickup.lat),
      pickupLng: String(pickup.lng),
      dropoffLabel: dropoff.label,
      dropoffLat: String(dropoff.lat),
      dropoffLng: String(dropoff.lng),
      distanceKm: String(distanceKm ?? 0),
      durationMin: String(durationMin ?? 0),
      cabType: cabTypeDef.id,
      fare: String(fare),
      pickupTime: new Date(pickupTime),
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      cancelToken: crypto.randomUUID(),
    })
    .returning();

  res.status(201).json({ booking: serializeBooking(booking) });
});

cabsRouter.get("/bookings", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const bookings = await db.query.cabBookings.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ bookings: bookings.map(serializeBooking) });
});

cabsRouter.delete("/bookings/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [booking] = await db.select().from(cabBookings).where(eq(cabBookings.id, req.params.id));
  if (!booking || booking.cancelToken !== token) {
    return res.status(404).json({ error: "Booking not found" });
  }

  await db.update(cabBookings).set({ status: "cancelled" }).where(eq(cabBookings.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every cab booking (mounted behind requireAuth+requireAdmin in index.ts).
cabsAdminRouter.get("/", async (_req, res) => {
  const bookings = await db.query.cabBookings.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ bookings: bookings.map(serializeBooking) });
});
