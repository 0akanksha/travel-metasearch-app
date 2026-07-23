// Server-side source of truth for cruise pricing/validation — mirrors the
// pricing-relevant fields of src/lib/cruiseItineraries.ts (the frontend's
// browse/detail catalog, which also carries photos/descriptions the server
// doesn't need). The server can't import that file directly since it lives
// outside this package's tsconfig rootDir, so this is kept in sync manually,
// same pattern as serializeForexOrder/serializeInsurancePolicy in routes/trips.ts.
export interface CabinTier {
  id: string;
  label: string;
  pricePerPersonUsd: number;
}

export interface CruiseItinerary {
  id: string;
  title: string;
  shipName: string;
  departurePort: string;
  nights: number;
  sailDates: string[];
  cabinTiers: CabinTier[];
}

function tiers(prices: [number, number, number, number]): CabinTier[] {
  const labels = ["Interior", "Ocean View", "Balcony", "Suite"];
  const ids = ["interior", "oceanview", "balcony", "suite"];
  return ids.map((id, i) => ({ id, label: labels[i], pricePerPersonUsd: prices[i] }));
}

export const CRUISE_ITINERARIES: CruiseItinerary[] = [
  {
    id: "eastern-caribbean",
    title: "7-Night Eastern Caribbean",
    shipName: "Icon of the Seas",
    departurePort: "Miami, USA",
    nights: 7,
    sailDates: ["2026-08-15", "2026-09-12", "2026-10-10"],
    cabinTiers: tiers([649, 799, 999, 1799]),
  },
  {
    id: "western-caribbean",
    title: "7-Night Western Caribbean",
    shipName: "Wonder of the Seas",
    departurePort: "Fort Lauderdale, USA",
    nights: 7,
    sailDates: ["2026-08-22", "2026-09-19", "2026-11-07"],
    cabinTiers: tiers([599, 749, 949, 1699]),
  },
  {
    id: "bahamas-getaway",
    title: "4-Night Bahamas Getaway",
    shipName: "Allure of the Seas",
    departurePort: "Miami, USA",
    nights: 4,
    sailDates: ["2026-08-06", "2026-09-03", "2026-10-01"],
    cabinTiers: tiers([299, 399, 549, 999]),
  },
  {
    id: "western-mediterranean",
    title: "7-Night Western Mediterranean",
    shipName: "MSC Meraviglia",
    departurePort: "Barcelona, Spain",
    nights: 7,
    sailDates: ["2026-08-29", "2026-09-26", "2026-10-24"],
    cabinTiers: tiers([899, 1099, 1399, 2499]),
  },
  {
    id: "greek-isles",
    title: "7-Night Greek Isles",
    shipName: "Celebrity Edge",
    departurePort: "Rome (Civitavecchia), Italy",
    nights: 7,
    sailDates: ["2026-09-05", "2026-10-03", "2026-10-31"],
    cabinTiers: tiers([999, 1199, 1499, 2699]),
  },
  {
    id: "alaska-inside-passage",
    title: "7-Night Alaska Inside Passage",
    shipName: "Norwegian Bliss",
    departurePort: "Seattle, USA",
    nights: 7,
    sailDates: ["2026-08-09", "2026-08-30"],
    cabinTiers: tiers([899, 1199, 1599, 2999]),
  },
  {
    id: "alaska-glacier-discovery",
    title: "7-Night Alaska Glacier Discovery",
    shipName: "Discovery Princess",
    departurePort: "Vancouver, Canada",
    nights: 7,
    sailDates: ["2026-08-16", "2026-09-06"],
    cabinTiers: tiers([949, 1249, 1649, 3099]),
  },
  {
    id: "norwegian-fjords",
    title: "7-Night Norwegian Fjords",
    shipName: "Anthem of the Seas",
    departurePort: "Southampton, UK",
    nights: 7,
    sailDates: ["2026-08-12", "2026-09-09"],
    cabinTiers: tiers([1099, 1349, 1699, 2999]),
  },
];
