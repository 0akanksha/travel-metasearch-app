import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { forexOrders } from "../db/schema.js";
import { CURRENCIES, getRate } from "../lib/forex.js";
import { verifyTripOwnership } from "./trips.js";

export const forexRouter = Router();
export const forexAdminRouter = Router();

function serializeOrder(order: typeof forexOrders.$inferSelect) {
  return {
    id: order.id,
    tripId: order.tripId,
    toCurrency: order.toCurrency,
    amountForeign: Number(order.amountForeign),
    exchangeRate: Number(order.exchangeRate),
    amountInr: Number(order.amountInr),
    travelDestination: order.travelDestination,
    travelDate: order.travelDate,
    deliveryAddress: order.deliveryAddress,
    deliveryCity: order.deliveryCity,
    deliveryPostalCode: order.deliveryPostalCode,
    guestName: order.guestName,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
    status: order.status,
    orderReference: order.orderReference,
    cancelToken: order.cancelToken,
    createdAt: order.createdAt.toISOString(),
  };
}

forexRouter.get("/currencies", (_req, res) => {
  res.json({ currencies: CURRENCIES });
});

forexRouter.get("/rate", async (req, res) => {
  const currency = typeof req.query.currency === "string" ? req.query.currency.toUpperCase() : "";
  if (!CURRENCIES.some((c) => c.code === currency)) {
    return res.status(400).json({ error: "Unsupported currency" });
  }
  try {
    const rate = await getRate(currency);
    res.json({ currency, rate });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Rate lookup failed" });
  }
});

forexRouter.post("/order", async (req, res) => {
  const {
    toCurrency,
    amountForeign,
    travelDestination,
    travelDate,
    deliveryAddress,
    deliveryCity,
    deliveryPostalCode,
    guest,
    tripId,
  } = req.body as {
    toCurrency?: string;
    amountForeign?: number;
    travelDestination?: string;
    travelDate?: string;
    deliveryAddress?: string;
    deliveryCity?: string;
    deliveryPostalCode?: string;
    guest?: { name?: string; email?: string; phone?: string };
    tripId?: string;
  };

  const currency = toCurrency?.toUpperCase();
  if (
    !currency ||
    !CURRENCIES.some((c) => c.code === currency) ||
    !amountForeign ||
    amountForeign <= 0 ||
    !deliveryAddress ||
    !deliveryCity ||
    !deliveryPostalCode ||
    !guest?.name ||
    !guest?.email ||
    !guest?.phone
  ) {
    return res.status(400).json({ error: "currency, amount, delivery address, and guest info are required" });
  }

  if (tripId && !(await verifyTripOwnership(tripId, guest.email))) {
    return res.status(404).json({ error: "Trip not found" });
  }

  // Never trust a client-supplied rate — re-fetch live, server-side, at order time.
  let rate: number;
  try {
    rate = await getRate(currency);
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : "Rate lookup failed" });
  }
  const amountInr = amountForeign * rate;

  const [order] = await db
    .insert(forexOrders)
    .values({
      tripId: tripId ?? null,
      toCurrency: currency,
      amountForeign: String(amountForeign),
      exchangeRate: String(rate),
      amountInr: String(amountInr),
      travelDestination: travelDestination ?? null,
      travelDate: travelDate ?? null,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      orderReference: crypto.randomUUID().slice(0, 8).toUpperCase(),
      cancelToken: crypto.randomUUID(),
    })
    .returning();

  res.status(201).json({ order: serializeOrder(order) });
});

forexRouter.get("/orders", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const orders = await db.query.forexOrders.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ orders: orders.map(serializeOrder) });
});

forexRouter.delete("/orders/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [order] = await db.select().from(forexOrders).where(eq(forexOrders.id, req.params.id));
  if (!order || order.cancelToken !== token) {
    return res.status(404).json({ error: "Order not found" });
  }

  await db.update(forexOrders).set({ status: "cancelled" }).where(eq(forexOrders.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every forex order (mounted behind requireAuth+requireAdmin in index.ts).
forexAdminRouter.get("/", async (_req, res) => {
  const orders = await db.query.forexOrders.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ orders: orders.map(serializeOrder) });
});
