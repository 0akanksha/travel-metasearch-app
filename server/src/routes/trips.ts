import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { cabBookings, hotelBookings, tripFlights, trips } from "../db/schema.js";

export const tripsRouter = Router();

function serializeTrip(trip: typeof trips.$inferSelect) {
  return { id: trip.id, email: trip.email, label: trip.label, createdAt: trip.createdAt.toISOString() };
}

function serializeFlight(flight: typeof tripFlights.$inferSelect) {
  return {
    id: flight.id,
    origin: flight.origin,
    originLabel: flight.originLabel,
    destination: flight.destination,
    destinationLabel: flight.destinationLabel,
    departureDate: flight.departureDate,
    returnDate: flight.returnDate,
    ownerName: flight.ownerName,
    totalAmount: Number(flight.totalAmount),
    totalCurrency: flight.totalCurrency,
    redirectUrl: flight.redirectUrl,
    offerExpiresAt: flight.offerExpiresAt?.toISOString() ?? null,
    createdAt: flight.createdAt.toISOString(),
  };
}

// Same "hotel" shape routes/stays.ts's serializeBooking produces — kept in
// sync manually since this is the only other place that reads hotelBookings.
function serializeHotelBooking(booking: typeof hotelBookings.$inferSelect) {
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

function serializeCabBooking(booking: typeof cabBookings.$inferSelect) {
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

tripsRouter.get("/", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const tripRows = await db.query.trips.findMany({
    where: (t, { eq: eqOp, sql: s }) => eqOp(s`lower(${t.email})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  const withCounts = await Promise.all(
    tripRows.map(async (trip) => {
      const [flightCount, hotelCount, cabCount] = await Promise.all([
        db.query.tripFlights.findMany({ where: (t, { eq: eqOp }) => eqOp(t.tripId, trip.id) }).then((r) => r.length),
        db.query.hotelBookings.findMany({ where: (t, { eq: eqOp }) => eqOp(t.tripId, trip.id) }).then((r) => r.length),
        db.query.cabBookings.findMany({ where: (t, { eq: eqOp }) => eqOp(t.tripId, trip.id) }).then((r) => r.length),
      ]);
      return { ...serializeTrip(trip), flightCount, hotelCount, cabCount };
    }),
  );

  res.json({ trips: withCounts });
});

tripsRouter.post("/", async (req, res) => {
  const { email, label } = req.body as { email?: string; label?: string };
  if (!email) return res.status(400).json({ error: "email is required" });

  const [trip] = await db
    .insert(trips)
    .values({ email, label: label?.trim() || "My trip" })
    .returning();

  res.status(201).json({ trip: serializeTrip(trip) });
});

async function findOwnedTrip(id: string, email: string) {
  const [trip] = await db.select().from(trips).where(eq(trips.id, id));
  if (!trip || trip.email.toLowerCase() !== email.toLowerCase()) return null;
  return trip;
}

tripsRouter.get("/:id", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const trip = await findOwnedTrip(req.params.id, email);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const [flights, hotels, cabs] = await Promise.all([
    db.query.tripFlights.findMany({ where: (t, { eq: eqOp }) => eqOp(t.tripId, trip.id) }),
    db.query.hotelBookings.findMany({ where: (t, { eq: eqOp }) => eqOp(t.tripId, trip.id) }),
    db.query.cabBookings.findMany({ where: (t, { eq: eqOp }) => eqOp(t.tripId, trip.id) }),
  ]);

  res.json({
    trip: serializeTrip(trip),
    flights: flights.map(serializeFlight),
    hotels: hotels.map(serializeHotelBooking),
    cabs: cabs.map(serializeCabBooking),
  });
});

tripsRouter.post("/:id/flights", async (req, res) => {
  const {
    email,
    origin,
    originLabel,
    destination,
    destinationLabel,
    departureDate,
    returnDate,
    ownerName,
    totalAmount,
    totalCurrency,
    redirectUrl,
    offerExpiresAt,
  } = req.body as {
    email?: string;
    origin?: string;
    originLabel?: string;
    destination?: string;
    destinationLabel?: string;
    departureDate?: string;
    returnDate?: string;
    ownerName?: string;
    totalAmount?: number;
    totalCurrency?: string;
    redirectUrl?: string;
    offerExpiresAt?: string;
  };

  if (!email || !origin || !destination || !departureDate || !totalAmount || !totalCurrency || !redirectUrl) {
    return res.status(400).json({ error: "email, origin, destination, departureDate, totalAmount/Currency, and redirectUrl are required" });
  }

  const trip = await findOwnedTrip(req.params.id, email);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const [flight] = await db
    .insert(tripFlights)
    .values({
      tripId: trip.id,
      origin,
      originLabel: originLabel ?? origin,
      destination,
      destinationLabel: destinationLabel ?? destination,
      departureDate,
      returnDate: returnDate ?? null,
      ownerName: ownerName ?? null,
      totalAmount: String(totalAmount),
      totalCurrency,
      redirectUrl,
      offerExpiresAt: offerExpiresAt ? new Date(offerExpiresAt) : null,
    })
    .returning();

  res.status(201).json({ flight: serializeFlight(flight) });
});

// Exported so routes/stays.ts and routes/cabs.ts can verify a tripId they
// were handed at booking time actually belongs to the same guest email,
// without duplicating the ownership check.
export async function verifyTripOwnership(tripId: string, email: string): Promise<boolean> {
  const trip = await findOwnedTrip(tripId, email);
  return trip !== null;
}
