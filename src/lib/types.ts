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

// --- Hotels (server/src/routes/stays.ts) ---

export interface HotelDestination {
  regionId: string;
  type: string;
  label: string;
  secondaryLabel: string;
}

export interface HotelPrice {
  amount: number;
  currency: string;
}

export interface HotelSummary {
  id: string;
  name: string;
  subtitle: string | null;
  rating: number | null;
  reviewCount: number;
  photoUrl: string | null;
  price: HotelPrice | null;
}

export interface HotelDetail extends HotelSummary {
  cityLabel: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  photos: string[];
  amenities: string[];
}

export interface HotelBooking {
  id: string;
  providerHotelId: string;
  bookingReference: string;
  hotelName: string;
  cityLabel: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalAmount: number;
  totalCurrency: string;
  guestName: string;
  guestEmail: string;
  status: string;
  cancelToken: string;
  createdAt: string;
}

// --- Cabs (server/src/routes/cabs.ts) ---

export interface GeoPlace {
  label: string;
  lat: number;
  lng: number;
}

export interface CabFareOption {
  cabType: string;
  label: string;
  seats: number;
  fare: number;
}

export interface CabEstimate {
  distanceKm: number;
  durationMin: number;
  options: CabFareOption[];
}

export interface CabBooking {
  id: string;
  pickupLabel: string;
  dropoffLabel: string;
  distanceKm: number;
  durationMin: number;
  cabType: string;
  fare: number;
  currency: string;
  pickupTime: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: string;
  cancelToken: string;
  createdAt: string;
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
