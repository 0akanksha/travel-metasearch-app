// Curated cruise-itinerary content for /cruises — same spirit as
// famousDestinations.ts: real cruise line/ship names and real per-tier
// pricing patterns (researched via web search: Caribbean sailings from
// ~$199/person, Alaska $899-$5,500/person by cabin tier), but the specific
// sailings/dates are invented since no cruise line offers a self-serve
// inventory API. Photos are real, hotlinked Wikimedia Commons URLs, sourced
// through Wikipedia's free/keyless REST summary API and verified to be
// actual photos (not a map/icon) during planning, same as famousDestinations.ts.
//
// Kept in sync manually with server/src/lib/cruiseItineraries.ts, which
// duplicates the pricing-relevant fields as the server-side source of truth
// for validating a booking's price (server can't import this file — it
// lives outside the server package's tsconfig rootDir).

export interface CabinTier {
  id: string;
  label: string;
  pricePerPersonUsd: number;
  description: string;
}

export const CABIN_TIER_TEMPLATE: { id: string; label: string; description: string }[] = [
  { id: "interior", label: "Interior", description: "Cozy and budget-friendly, no window." },
  { id: "oceanview", label: "Ocean View", description: "A real window or porthole with sea views." },
  { id: "balcony", label: "Balcony", description: "Private balcony to enjoy the ocean air." },
  { id: "suite", label: "Suite", description: "Extra space, upgraded amenities, priority boarding." },
];

export interface CruiseItinerary {
  id: string;
  title: string;
  cruiseLine: string;
  shipName: string;
  region: "Caribbean" | "Mediterranean" | "Alaska" | "Northern Europe";
  nights: number;
  departurePort: string;
  ports: string[];
  imageUrl: string;
  description: string;
  sailDates: string[];
  cabinTiers: CabinTier[];
}

function tiers(prices: [number, number, number, number]): CabinTier[] {
  return CABIN_TIER_TEMPLATE.map((t, i) => ({ ...t, pricePerPersonUsd: prices[i] }));
}

export const CRUISE_ITINERARIES: CruiseItinerary[] = [
  {
    id: "eastern-caribbean",
    title: "7-Night Eastern Caribbean",
    cruiseLine: "Royal Caribbean",
    shipName: "Icon of the Seas",
    region: "Caribbean",
    nights: 7,
    departurePort: "Miami, USA",
    ports: ["Nassau, Bahamas", "Perfect Day at CocoCay", "Charlotte Amalie, St. Thomas"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Icon_of_the_Seas_Puerto_Rico_2025_%28cropped%29.jpg/330px-Icon_of_the_Seas_Puerto_Rico_2025_%28cropped%29.jpg",
    description: "The world's largest cruise ship sails the Eastern Caribbean, with a private island stop at CocoCay.",
    sailDates: ["2026-08-15", "2026-09-12", "2026-10-10"],
    cabinTiers: tiers([649, 799, 999, 1799]),
  },
  {
    id: "western-caribbean",
    title: "7-Night Western Caribbean",
    cruiseLine: "Royal Caribbean",
    shipName: "Wonder of the Seas",
    region: "Caribbean",
    nights: 7,
    departurePort: "Fort Lauderdale, USA",
    ports: ["Cozumel, Mexico", "Costa Maya, Mexico", "George Town, Grand Cayman"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Wonder_of_the_Seas_Jan_30_2025.jpg/330px-Wonder_of_the_Seas_Jan_30_2025.jpg",
    description: "Mexican beaches and Cayman diving on one of the world's biggest ships.",
    sailDates: ["2026-08-22", "2026-09-19", "2026-11-07"],
    cabinTiers: tiers([599, 749, 949, 1699]),
  },
  {
    id: "bahamas-getaway",
    title: "4-Night Bahamas Getaway",
    cruiseLine: "Royal Caribbean",
    shipName: "Allure of the Seas",
    region: "Caribbean",
    nights: 4,
    departurePort: "Miami, USA",
    ports: ["Nassau, Bahamas", "Perfect Day at CocoCay"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Allure_of_the_Seas_%28ship%2C_2009%29_001.jpg/330px-Allure_of_the_Seas_%28ship%2C_2009%29_001.jpg",
    description: "A short, easy first cruise — Nassau and a private-island beach day.",
    sailDates: ["2026-08-06", "2026-09-03", "2026-10-01"],
    cabinTiers: tiers([299, 399, 549, 999]),
  },
  {
    id: "western-mediterranean",
    title: "7-Night Western Mediterranean",
    cruiseLine: "MSC Cruises",
    shipName: "MSC Meraviglia",
    region: "Mediterranean",
    nights: 7,
    departurePort: "Barcelona, Spain",
    ports: ["Marseille, France", "Genoa, Italy", "Naples, Italy", "Palma de Mallorca, Spain"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/MSC_Meraviglia_Grand_Harbour_Malta_20180307_03_%28cropped%29.jpg/330px-MSC_Meraviglia_Grand_Harbour_Malta_20180307_03_%28cropped%29.jpg",
    description: "Spain, France, and Italy's coastlines in one week, round-trip from Barcelona.",
    sailDates: ["2026-08-29", "2026-09-26", "2026-10-24"],
    cabinTiers: tiers([899, 1099, 1399, 2499]),
  },
  {
    id: "greek-isles",
    title: "7-Night Greek Isles",
    cruiseLine: "Celebrity Cruises",
    shipName: "Celebrity Edge",
    region: "Mediterranean",
    nights: 7,
    departurePort: "Rome (Civitavecchia), Italy",
    ports: ["Santorini, Greece", "Mykonos, Greece", "Athens, Greece"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Oia_sunset_-_panoramio_%282%29.jpg/330px-Oia_sunset_-_panoramio_%282%29.jpg",
    description: "Whitewashed cliffside villages and the Greek Isles' most famous sunsets.",
    sailDates: ["2026-09-05", "2026-10-03", "2026-10-31"],
    cabinTiers: tiers([999, 1199, 1499, 2699]),
  },
  {
    id: "alaska-inside-passage",
    title: "7-Night Alaska Inside Passage",
    cruiseLine: "Norwegian Cruise Line",
    shipName: "Norwegian Bliss",
    region: "Alaska",
    nights: 7,
    departurePort: "Seattle, USA",
    ports: ["Ketchikan, Alaska", "Juneau, Alaska", "Skagway, Alaska"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Norwegian_Bliss_SE.jpg/330px-Norwegian_Bliss_SE.jpg",
    description: "Glaciers, wildlife, and the historic Gold Rush towns of Southeast Alaska.",
    sailDates: ["2026-08-09", "2026-08-30"],
    cabinTiers: tiers([899, 1199, 1599, 2999]),
  },
  {
    id: "alaska-glacier-discovery",
    title: "7-Night Alaska Glacier Discovery",
    cruiseLine: "Princess Cruises",
    shipName: "Discovery Princess",
    region: "Alaska",
    nights: 7,
    departurePort: "Vancouver, Canada",
    ports: ["Skagway, Alaska", "Glacier Bay National Park", "Ketchikan, Alaska"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/A045%2C_Glacier_Bay_National_Park%2C_Alaska%2C_USA%2C_Johns_Hopkins_Glacier%2C_2002.jpg/330px-A045%2C_Glacier_Bay_National_Park%2C_Alaska%2C_USA%2C_Johns_Hopkins_Glacier%2C_2002.jpg",
    description: "Sail right up to tidewater glaciers in Glacier Bay National Park.",
    sailDates: ["2026-08-16", "2026-09-06"],
    cabinTiers: tiers([949, 1249, 1649, 3099]),
  },
  {
    id: "norwegian-fjords",
    title: "7-Night Norwegian Fjords",
    cruiseLine: "Royal Caribbean",
    shipName: "Anthem of the Seas",
    region: "Northern Europe",
    nights: 7,
    departurePort: "Southampton, UK",
    ports: ["Bergen, Norway", "Geiranger, Norway", "Ålesund, Norway"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Geirangerfjord_.jpg/330px-Geirangerfjord_.jpg",
    description: "Dramatic fjords and waterfalls along Norway's western coast.",
    sailDates: ["2026-08-12", "2026-09-09"],
    cabinTiers: tiers([1099, 1349, 1699, 2999]),
  },
];

export const CRUISE_REGIONS = ["Caribbean", "Mediterranean", "Alaska", "Northern Europe"] as const;
