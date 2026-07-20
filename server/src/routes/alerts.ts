import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { priceAlerts } from "../db/schema.js";
import { cheapestFare } from "../lib/duffel.js";
import { sendAlertConfirmationEmail } from "../lib/email.js";
import { runPriceRecheckOnce } from "../lib/priceRecheckJob.js";

export const alertsRouter = Router();
export const alertsAdminRouter = Router();

function serialize(alert: typeof priceAlerts.$inferSelect) {
  return {
    id: alert.id,
    email: alert.email,
    origin: alert.origin,
    originLabel: alert.originLabel,
    destination: alert.destination,
    destinationLabel: alert.destinationLabel,
    departureDate: alert.departureDate,
    returnDate: alert.returnDate,
    targetPrice: alert.targetPrice ? Number(alert.targetPrice) : undefined,
    lastCheckedPrice: alert.lastCheckedPrice ? Number(alert.lastCheckedPrice) : null,
    lastCheckedAt: alert.lastCheckedAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
    unsubscribeToken: alert.unsubscribeToken,
  };
}

alertsRouter.post("/", async (req, res) => {
  const { email, origin, originLabel, destination, destinationLabel, departureDate, returnDate, targetPrice } = req.body as {
    email?: string;
    origin?: string;
    originLabel?: string;
    destination?: string;
    destinationLabel?: string;
    departureDate?: string;
    returnDate?: string;
    targetPrice?: number;
  };
  if (!email || !origin || !destination || !departureDate) {
    return res.status(400).json({ error: "email, origin, destination, and departureDate are required" });
  }

  const fare = await cheapestFare(origin.toUpperCase(), destination.toUpperCase(), departureDate);

  const [alert] = await db
    .insert(priceAlerts)
    .values({
      email,
      origin: origin.toUpperCase(),
      originLabel: originLabel ?? origin.toUpperCase(),
      destination: destination.toUpperCase(),
      destinationLabel: destinationLabel ?? destination.toUpperCase(),
      departureDate,
      returnDate: returnDate ?? null,
      targetPrice: targetPrice ? String(targetPrice) : null,
      lastCheckedPrice: fare ? String(fare.price) : null,
      lastCheckedAt: new Date(),
      unsubscribeToken: crypto.randomUUID(),
    })
    .returning();

  await sendAlertConfirmationEmail(alert);

  res.status(201).json({ alert: serialize(alert) });
});

alertsRouter.get("/", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const alerts = await db.query.priceAlerts.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.email})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ alerts: alerts.map(serialize) });
});

alertsRouter.delete("/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [alert] = await db.select().from(priceAlerts).where(eq(priceAlerts.id, req.params.id));
  if (!alert || alert.unsubscribeToken !== token) {
    return res.status(404).json({ error: "Alert not found" });
  }

  await db.delete(priceAlerts).where(eq(priceAlerts.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every alert in the database, not scoped to one email (mounted
// behind requireAuth+requireAdmin in index.ts).
alertsAdminRouter.get("/", async (_req, res) => {
  const alerts = await db.query.priceAlerts.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ alerts: alerts.map(serialize) });
});

// Manual trigger for the periodic recheck job — otherwise it only runs
// every 3 hours, which is inconvenient for testing and occasionally useful
// for an admin who wants a fresher read right now.
alertsAdminRouter.post("/recheck", async (_req, res) => {
  const result = await runPriceRecheckOnce();
  res.json(result);
});
