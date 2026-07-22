import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Admin-only accounts — travelers never sign up or log in (booking and
// alerts are both guest flows, see routes/duffel.ts and routes/alerts.ts).
// Seeded from ADMIN_EMAIL/ADMIN_PASSWORD on first start (lib/ensureAdmin.ts).
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Flights and bookings aren't stored locally — Duffel is the system of
// record for both search results and orders (see routes/duffel.ts). This
// table only tracks the discovery-layer feature Duffel has no API for:
// watching a route/date for a price drop and emailing a guest about it.
export const priceAlerts = pgTable("price_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  origin: text("origin").notNull(),
  originLabel: text("origin_label").notNull(),
  destination: text("destination").notNull(),
  destinationLabel: text("destination_label").notNull(),
  departureDate: text("departure_date").notNull(), // YYYY-MM-DD
  returnDate: text("return_date"),
  targetPrice: numeric("target_price"),
  lastCheckedPrice: numeric("last_checked_price"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  // Lets a guest (no login) manage/delete their own alert via a link,
  // same trust model as the Duffel booking-by-reference+email lookup.
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A trip is just a named grouping owned by an email — same guest-only trust
// model as priceAlerts/hotelBookings/cabBookings (looked up by email, no
// login). Flights have no local booking to link here (see tripFlights
// below); hotel/cab bookings link in via their own nullable tripId.
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  label: text("label").notNull().default("My trip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A saved flight offer, not a booking — FareCompass never books flights
// itself (see routes/duffel.ts, the 135edcd metasearch-redirect pivot).
// This is the trip view's equivalent of the Redirect.tsx fare card: enough
// of a snapshot to display and re-link to the airline, taken at save time
// since a live Duffel offer expires quickly (offerExpiresAt lets the trip
// view warn that the fare may have changed since).
export const tripFlights = pgTable("trip_flights", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id").notNull().references(() => trips.id),
  origin: text("origin").notNull(),
  originLabel: text("origin_label").notNull(),
  destination: text("destination").notNull(),
  destinationLabel: text("destination_label").notNull(),
  departureDate: text("departure_date").notNull(), // YYYY-MM-DD
  returnDate: text("return_date"),
  ownerName: text("owner_name"), // airline
  totalAmount: numeric("total_amount").notNull(),
  totalCurrency: text("total_currency").notNull(),
  redirectUrl: text("redirect_url").notNull(),
  offerExpiresAt: timestamp("offer_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Hotels aren't stored locally either — the "Hotels.com Provider" RapidAPI
// listing (lib/hotelsProvider.ts) is the search/pricing source of record.
// But unlike Duffel, it's an unofficial listing with no booking-creation
// endpoint, so a booking here is entirely local: this table *is* the
// reservation record, not just a cache of one made elsewhere.
export const hotelBookings = pgTable("hotel_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable — attaching a booking to a trip is optional, see TripPicker.tsx.
  tripId: uuid("trip_id").references(() => trips.id),
  providerHotelId: text("provider_hotel_id").notNull(),
  bookingReference: text("booking_reference").notNull(),
  hotelName: text("hotel_name").notNull(),
  cityLabel: text("city_label").notNull(),
  checkInDate: text("check_in_date").notNull(), // YYYY-MM-DD
  checkOutDate: text("check_out_date").notNull(),
  guestCount: integer("guest_count").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  totalCurrency: text("total_currency").notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  status: text("status").notNull().default("confirmed"),
  // Guest-only management (no login), same trust model as priceAlerts above.
  cancelToken: text("cancel_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cabs have no external booking system at all (see lib/routing.ts) — this
// table is the sole record of a ride, priced from a local rate table
// against a real route (Nominatim geocoding + OSRM driving distance).
export const cabBookings = pgTable("cab_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable — attaching a booking to a trip is optional, see TripPicker.tsx.
  tripId: uuid("trip_id").references(() => trips.id),
  pickupLabel: text("pickup_label").notNull(),
  pickupLat: numeric("pickup_lat").notNull(),
  pickupLng: numeric("pickup_lng").notNull(),
  dropoffLabel: text("dropoff_label").notNull(),
  dropoffLat: numeric("dropoff_lat").notNull(),
  dropoffLng: numeric("dropoff_lng").notNull(),
  distanceKm: numeric("distance_km").notNull(),
  durationMin: numeric("duration_min").notNull(),
  cabType: text("cab_type").notNull(),
  fare: numeric("fare").notNull(),
  currency: text("currency").notNull().default("USD"),
  pickupTime: timestamp("pickup_time", { withTimezone: true }).notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  status: text("status").notNull().default("confirmed"),
  cancelToken: text("cancel_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
