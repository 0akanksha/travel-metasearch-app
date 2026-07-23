import crypto from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { visaApplications } from "../db/schema.js";
import { VISA_COUNTRIES } from "../lib/visaCountries.js";
import { verifyTripOwnership } from "./trips.js";

export const visasRouter = Router();
export const visasAdminRouter = Router();

function serializeApplication(app: typeof visaApplications.$inferSelect) {
  return {
    id: app.id,
    tripId: app.tripId,
    countryId: app.countryId,
    countryName: app.countryName,
    visaType: app.visaType,
    travelDate: app.travelDate,
    applicants: JSON.parse(app.applicantsJson) as { name: string; passportNumber: string }[],
    govFeeInr: Number(app.govFeeInr),
    serviceFeeInr: Number(app.serviceFeeInr),
    totalFeeInr: Number(app.totalFeeInr),
    guestName: app.guestName,
    guestEmail: app.guestEmail,
    guestPhone: app.guestPhone,
    status: app.status,
    applicationReference: app.applicationReference,
    cancelToken: app.cancelToken,
    createdAt: app.createdAt.toISOString(),
  };
}

visasRouter.post("/application", async (req, res) => {
  const { countryId, travelDate, applicants, guest, tripId } = req.body as {
    countryId?: string;
    travelDate?: string;
    applicants?: { name?: string; passportNumber?: string }[];
    guest?: { name?: string; email?: string; phone?: string };
    tripId?: string;
  };

  const country = VISA_COUNTRIES.find((c) => c.id === countryId);

  if (
    !country ||
    !Array.isArray(applicants) ||
    applicants.length === 0 ||
    applicants.length > 6 ||
    applicants.some((a) => !a.name || !a.passportNumber) ||
    !guest?.name ||
    !guest?.email ||
    !guest?.phone
  ) {
    return res.status(400).json({ error: "country, applicants, and guest info are required" });
  }

  if (tripId && !(await verifyTripOwnership(tripId, guest.email))) {
    return res.status(404).json({ error: "Trip not found" });
  }

  // Never trust a client-supplied total — compute server-side from the catalog fees.
  const totalFeeInr = (country.govFeeInr + country.serviceFeeInr) * applicants.length;

  const [app] = await db
    .insert(visaApplications)
    .values({
      tripId: tripId ?? null,
      countryId: country.id,
      countryName: country.countryName,
      visaType: country.visaType,
      travelDate: travelDate ?? null,
      applicantsJson: JSON.stringify(applicants),
      govFeeInr: String(country.govFeeInr),
      serviceFeeInr: String(country.serviceFeeInr),
      totalFeeInr: String(totalFeeInr),
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      applicationReference: crypto.randomUUID().slice(0, 8).toUpperCase(),
      cancelToken: crypto.randomUUID(),
    })
    .returning();

  res.status(201).json({ application: serializeApplication(app) });
});

visasRouter.get("/applications", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email) return res.status(400).json({ error: "email is required" });

  const applications = await db.query.visaApplications.findMany({
    where: (t, { eq: eqOp, sql }) => eqOp(sql`lower(${t.guestEmail})`, email.toLowerCase()),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ applications: applications.map(serializeApplication) });
});

visasRouter.delete("/applications/:id", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required" });

  const [app] = await db.select().from(visaApplications).where(eq(visaApplications.id, req.params.id));
  if (!app || app.cancelToken !== token) {
    return res.status(404).json({ error: "Application not found" });
  }

  await db.update(visaApplications).set({ status: "cancelled" }).where(eq(visaApplications.id, req.params.id));
  res.status(204).end();
});

// Admin-only: every visa application (mounted behind requireAuth+requireAdmin in index.ts).
visasAdminRouter.get("/", async (_req, res) => {
  const applications = await db.query.visaApplications.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  res.json({ applications: applications.map(serializeApplication) });
});
