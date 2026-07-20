import cron from "node-cron";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { priceAlerts } from "../db/schema.js";
import { cheapestFare } from "./duffel.js";
import { mapWithConcurrency } from "./concurrency.js";
import { sendPriceDropEmail } from "./email.js";

// Low concurrency deliberately — this can run against every saved alert at
// once, and Duffel's test-mode rate limit is already tight for a single
// page's calendar/everywhere fan-out (see routes/duffel.ts).
const RECHECK_CONCURRENCY = 2;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function recheckAlert(alert: typeof priceAlerts.$inferSelect) {
  if (alert.departureDate < todayISO()) return; // nothing left to watch

  const fare = await cheapestFare(alert.origin, alert.destination, alert.departureDate);
  if (!fare) return;

  const previousPrice = alert.lastCheckedPrice ? Number(alert.lastCheckedPrice) : null;
  const target = alert.targetPrice ? Number(alert.targetPrice) : null;
  const droppedBelowTarget = target !== null && fare.price <= target;
  const droppedFromLast = previousPrice !== null && fare.price < previousPrice;

  await db
    .update(priceAlerts)
    .set({ lastCheckedPrice: String(fare.price), lastCheckedAt: new Date() })
    .where(eq(priceAlerts.id, alert.id));

  if (droppedBelowTarget || droppedFromLast) {
    await sendPriceDropEmail(alert, fare.price, previousPrice);
  }
}

export async function runPriceRecheckOnce(): Promise<{ checked: number }> {
  const alerts = await db.select().from(priceAlerts);
  await mapWithConcurrency(alerts, RECHECK_CONCURRENCY, recheckAlert);
  return { checked: alerts.length };
}

export function startPriceRecheckJob() {
  // Every 3 hours, per the plan — frequent enough to catch a same-day
  // price move without hammering Duffel's test-mode rate limit.
  cron.schedule("0 */3 * * *", () => {
    runPriceRecheckOnce()
      .then(({ checked }) => console.log(`[priceRecheckJob] rechecked ${checked} alert(s)`))
      .catch((err) => console.error("[priceRecheckJob] run failed:", err));
  });
}
