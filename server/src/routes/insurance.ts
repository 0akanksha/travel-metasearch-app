import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { insurancePolicies } from "../db/schema.js";
import { estimatePremium, INSURANCE_PLANS } from "../lib/insuranceRates.js";
import { verifyTripOwnership } from "./trips.js";

export const insuranceRouter = Router();
export const insuranceAdminRouter = Router();

function daysBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function serializePolicy(policy: typeof insurancePolicies.$inferSelect) {
  return {
    id: policy.id,
    tripId: policy.tripId,
    planId: policy.planId,
    tripType: policy.tripType,
    destination: policy.destination,
    startDate: policy.startDate,
    endDate: policy.endDate,
    travelers: JSON.parse(policy.travelersJson) as { name: string; age: number }[],
    sumInsuredUsd: Number(policy.sumInsuredUsd),
    premiumInr: Number(policy.premiumInr),
    guestName: policy.guestName,
    guestEmail: policy.guestEmail,
    guestPhone: policy.guestPhone,
    status: policy.status,
    policyReference: policy.policyReference,
    cancelToken: policy.cancelToken,
    createdAt: policy.createdAt.toISOString(),
  };
}

interface QuoteInput {
  planId?: string;
  tripType?: string;
  startDate?: string;
  endDate?: string;
  travelerAges?: number[];
}

function resolveQuote(body: QuoteInput) {
  const plan = INSURANCE_PLANS.find((p) => p.id === body.planId);
  const tripType = body.tripType === "international" ? "international" : "domestic";
  if (
    !plan ||
    !body.startDate ||
    !body.endDate ||
    !Array.isArray(body.travelerAges) ||
    body.travelerAges.length === 0 ||
    body.travelerAges.some((a) => typeof a !== "number" || a < 0 || a > 120)
  ) {
    return null;
  }
  const days = daysBetween(body.startDate, body.endDate);
  const premiumInr = estimatePremium(plan, tripType, body.travelerAges, days);
  return { plan, tripType, premiumInr };
}

insuranceRouter.get("/plans", (_req, res) => {
  res.json({ plans: INSURANCE_PLANS });
});

insuranceRouter.post("/quote", (req, res) => {
  const quote = resolveQuote(req.body as QuoteInput);
  if (!quote) return res.status(400).json({ error: "planId, tripType, dates, and travelerAges are required" });
  res.json({ premiumInr: quote.premiumInr, sumInsuredUsd: quote.plan.sumInsuredUsd });
});

insuranceRouter.post("/policy", async (req, res) => {
  const { planId, tripType, destination, startDate, endDate, travelers, guest, tripId } = req.body as {
    planId?: string;
    tripType?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    travelers?: { name?: string; age?: number }[];
    guest?: { name?: string; email?: string; phone?: string };
    tripId?: string;
  };

  if (
    !Array.isArray(travelers) ||
    travelers.length === 0 ||
    travelers.some((t) => !t.name || typeof t.age !== "number") ||
    !guest?.name ||
    !guest?.email ||
    !guest?.phone
  ) {
    return res.status(400).json({ error: "trip details, travelers, and guest info are required" });
  }

  // Never trust a client-supplied premium — recompute server-side, at purchase time.
  const quote = resolveQuote({
    planId,
    tripType,
    startDate,
    endDate,
    travelerAges: travelers.map((t) => t.age as number),
  });
  if (!quote) return res.status(400).json({ error: "planId, tripType, dates, and travelers are required" });

  if (tripId && !(await verifyTripOwnership(tripId, guest.email))) {
    return res.status(404).json({ error: "Trip not found" });
  }

  const [policy] = await db
    .insert(insurancePolicies)
    .values({
      tripId: tripId ?? null,
      planId: quote.plan.id,
      tripType: quote.tripType,
      destination: destination ?? null,
      startDate: startDate as string,
      endDate: endDate as string,
      travelersJson: JSON.stringify(travelers),
      sumInsuredUsd: String(quote.plan.sumInsuredUsd),
      premiumInr: String(quote.premiumInr),
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      policyReference: crypto.randomUUID().slice(0, 8).toUpperCase(),
      cancelToken: crypto.randomUUID(),
    })
    .returning();

  res.status(201).json({ policy: serializePolicy(policy) });
});

insuranceRouter.get("/policies", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const policies = await db.query.insurancePolicies.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ policies: policies.map(serializePolicy) });
});

insuranceRouter.delete("/policies/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [policy] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, req.params.id));
  if (!policy || policy.cancelToken !== token) {
    return res.status(404).json({ error: "Policy not found" });
  }

  await db.update(insurancePolicies).set({ status: "cancelled" }).where(eq(insurancePolicies.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every insurance policy (mounted behind requireAuth+requireAdmin in index.ts).
insuranceAdminRouter.get("/", async (_req, res) => {
  const policies = await db.query.insurancePolicies.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ policies: policies.map(serializePolicy) });
});
