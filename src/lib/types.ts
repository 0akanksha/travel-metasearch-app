// Search results use a simplified, camelCase shape returned by the Express
// API (server/src/routes/duffel.ts) — a thin remap of Duffel's own response.

export interface Place {
  id: string;
  type: "airport" | "city";
  iataCode: string;
  name: string;
  cityName: string;
  countryCode: string;
}

export interface OfferSlice {
  origin: string | null;
  originName: string | null;
  destination: string | null;
  destinationName: string | null;
  departingAt: string | null;
  arrivingAt: string | null;
  duration: string | null;
  stops: number;
}

export interface OfferSummary {
  id: string;
  totalAmount: string;
  totalCurrency: string;
  expiresAt: string;
  owner: { name: string | null; iataCode: string | null };
  passengerCount: number;
  // Where "View deal" sends you — the airline's real site, or a Google
  // Flights search when the airline isn't in the curated map. FareCompass
  // never processes a booking itself.
  redirectUrl: string;
  slices: OfferSlice[];
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  price: number | null;
  currency: string;
}

export interface DestinationDeal {
  iataCode: string;
  cityName: string;
  countryName: string;
  price: number;
  currency: string;
}

export interface PriceAlert {
  id: string;
  email: string;
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
  departureDate: string;
  returnDate?: string;
  targetPrice?: number;
  lastCheckedPrice: number | null;
  lastCheckedAt: string | null;
  createdAt: string;
  unsubscribeToken: string;
}
