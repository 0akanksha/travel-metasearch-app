import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
