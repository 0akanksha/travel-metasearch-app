// Static per-day rate table, same shape as lib/cabRates.ts — there is no
// self-serve insurer quoting API to call, so premiums are computed locally
// against real trip inputs (dates, traveler ages, domestic/international).
export interface InsurancePlan {
  id: string;
  label: string;
  sumInsuredUsd: number;
  perDayRate: number; // INR, per traveler per day, domestic baseline
  description: string;
  features: string[];
}

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: "basic",
    label: "Basic",
    sumInsuredUsd: 50000,
    perDayRate: 35,
    description: "Essential medical cover for short trips.",
    features: ["Emergency medical expenses", "Baggage loss", "Trip delay"],
  },
  {
    id: "standard",
    label: "Standard",
    sumInsuredUsd: 100000,
    perDayRate: 55,
    description: "Higher medical cover plus trip cancellation.",
    features: ["Emergency medical expenses", "Baggage loss", "Trip delay", "Trip cancellation", "Passport loss"],
  },
  {
    id: "premium",
    label: "Premium",
    sumInsuredUsd: 250000,
    perDayRate: 85,
    description: "Maximum cover for longer or higher-risk trips.",
    features: [
      "Emergency medical expenses",
      "Baggage loss",
      "Trip delay",
      "Trip cancellation",
      "Passport loss",
      "Adventure sports cover",
      "Cashless hospitalisation",
    ],
  },
];

function ageMultiplier(age: number): number {
  if (age < 18) return 0.6;
  if (age <= 45) return 1;
  if (age <= 60) return 1.3;
  return 1.8;
}

export function estimatePremium(
  plan: InsurancePlan,
  tripType: "domestic" | "international",
  travelerAges: number[],
  days: number,
): number {
  const tripTypeMultiplier = tripType === "international" ? 1.3 : 1;
  const base = plan.perDayRate * days * tripTypeMultiplier;
  const total = travelerAges.reduce((sum, age) => sum + base * ageMultiplier(age), 0);
  return Math.round(total * 100) / 100;
}
