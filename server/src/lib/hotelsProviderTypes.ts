// Minimal shapes for the fields this app actually reads from the
// "Hotels.com Provider" RapidAPI listing (host hotels-com-provider.p.rapidapi.com,
// backed by Expedia Group's own gaiaId region system) — not a full mirror of
// its response. Confirmed against live responses during planning; see
// server/src/lib/hotelsProvider.ts for the calls that produce these.

export interface HotelsProviderRegion {
  gaiaId: string;
  type: "CITY" | "NEIGHBORHOOD" | "AIRPORT" | "POI" | string;
  regionNames: {
    fullName: string;
    displayName: string;
    primaryDisplayName: string;
    secondaryDisplayName: string;
  };
  coordinates: { lat: string; long: string } | null;
}

export interface HotelsProviderRegionsResponse {
  query: string;
  data: HotelsProviderRegion[];
}

interface HotelsProviderDisplayPrice {
  type: "DisplayPrice" | "LodgingEnrichedMessage";
  role: "STRIKEOUT" | "LEAD" | null;
  price: { formatted: string } | null;
}

export interface HotelsProviderProperty {
  id: string;
  name: string;
  messages: string[];
  guestRating: { rating: number | null; totalReviews: number; starRating: number | null } | null;
  mediaSection: { media: { id: string; url: string; description: string }[] } | null;
  price: {
    priceSummary: {
      displayPrices: HotelsProviderDisplayPrice[];
    };
  } | null;
}

export interface HotelsProviderSearchResponse {
  data: { properties: HotelsProviderProperty[] };
}
