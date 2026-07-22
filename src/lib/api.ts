import type {
  CabBooking,
  CabEstimate,
  CalendarDay,
  DestinationDeal,
  GeoPlace,
  HotelBooking,
  HotelDestination,
  HotelDetail,
  HotelSummary,
  OfferSummary,
  Place,
  PriceAlert,
  TripDetail,
  TripFlight,
  TripSummary,
} from "./types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  try {
    const { places } = await apiFetch<{ places: Place[] }>(`/duffel/places?query=${encodeURIComponent(query)}`);
    return places;
  } catch {
    return [];
  }
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  passengers: number;
}

export async function searchFlights(
  params: FlightSearchParams,
): Promise<{ ok: true; offers: OfferSummary[] } | { ok: false; error: string }> {
  try {
    const { offers } = await apiFetch<{ offers: OfferSummary[] }>("/duffel/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return { ok: true, offers };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Search failed" };
  }
}

export async function getOffer(offerId: string): Promise<OfferSummary | undefined> {
  try {
    const { offer } = await apiFetch<{ offer: OfferSummary }>(`/duffel/offers/${encodeURIComponent(offerId)}`);
    return offer;
  } catch {
    return undefined;
  }
}

export async function getCalendar(
  origin: string,
  destination: string,
  month: string,
): Promise<{ ok: true; days: CalendarDay[] } | { ok: false; error: string }> {
  try {
    const { days } = await apiFetch<{ days: CalendarDay[] }>(
      `/duffel/calendar?origin=${origin}&destination=${destination}&month=${month}`,
    );
    return { ok: true, days };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Calendar search failed" };
  }
}

export async function getEverywhere(
  origin: string,
  date: string,
): Promise<{ ok: true; destinations: DestinationDeal[] } | { ok: false; error: string }> {
  try {
    const { destinations } = await apiFetch<{ destinations: DestinationDeal[] }>(
      `/duffel/everywhere?origin=${origin}&date=${date}`,
    );
    return { ok: true, destinations };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Everywhere search failed" };
  }
}

export interface CreateAlertInput {
  email: string;
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
  departureDate: string;
  returnDate?: string;
  targetPrice?: number;
}

export async function createAlert(
  input: CreateAlertInput,
): Promise<{ ok: true; alert: PriceAlert } | { ok: false; error: string }> {
  try {
    const { alert } = await apiFetch<{ alert: PriceAlert }>("/alerts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, alert };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create alert" };
  }
}

export async function getAlertsByEmail(email: string): Promise<PriceAlert[]> {
  try {
    const { alerts } = await apiFetch<{ alerts: PriceAlert[] }>(`/alerts?email=${encodeURIComponent(email)}`);
    return alerts;
  } catch {
    return [];
  }
}

export async function deleteAlert(id: string, token: string): Promise<boolean> {
  try {
    await apiFetch(`/alerts/${id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// --- Hotels ---

export async function searchHotelDestinations(query: string): Promise<HotelDestination[]> {
  if (query.trim().length < 2) return [];
  try {
    const { places } = await apiFetch<{ places: HotelDestination[] }>(`/stays/places?query=${encodeURIComponent(query)}`);
    return places;
  } catch {
    return [];
  }
}

export interface HotelSearchParams {
  regionId: string;
  cityLabel: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
}

export async function searchHotels(
  params: HotelSearchParams,
): Promise<{ ok: true; searchId: string; hotels: HotelSummary[] } | { ok: false; error: string }> {
  try {
    const { searchId, hotels } = await apiFetch<{ searchId: string; hotels: HotelSummary[] }>("/stays/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return { ok: true, searchId, hotels };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Hotel search failed" };
  }
}

export async function getHotel(hotelId: string, searchId: string): Promise<HotelDetail | undefined> {
  try {
    const { hotel } = await apiFetch<{ hotel: HotelDetail }>(
      `/stays/hotel/${encodeURIComponent(hotelId)}?searchId=${encodeURIComponent(searchId)}`,
    );
    return hotel;
  } catch {
    return undefined;
  }
}

export interface BookHotelInput {
  hotelId: string;
  hotelName: string;
  cityLabel: string;
  price: number;
  currency: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  guest: { name: string; email: string };
  tripId?: string;
}

export async function bookHotel(
  input: BookHotelInput,
): Promise<{ ok: true; booking: HotelBooking } | { ok: false; error: string }> {
  try {
    const { booking } = await apiFetch<{ booking: HotelBooking }>("/stays/book", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, booking };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Booking failed" };
  }
}

export async function getHotelBookingsByEmail(email: string): Promise<HotelBooking[]> {
  try {
    const { bookings } = await apiFetch<{ bookings: HotelBooking[] }>(`/stays/bookings?email=${encodeURIComponent(email)}`);
    return bookings;
  } catch {
    return [];
  }
}

export async function cancelHotelBooking(id: string, token: string): Promise<boolean> {
  try {
    await apiFetch(`/stays/bookings/${id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// --- Cabs ---

export async function searchCabPlaces(query: string): Promise<GeoPlace[]> {
  if (query.trim().length < 3) return [];
  try {
    const { places } = await apiFetch<{ places: GeoPlace[] }>(`/cabs/places?query=${encodeURIComponent(query)}`);
    return places;
  } catch {
    return [];
  }
}

export async function estimateCab(
  pickup: GeoPlace,
  dropoff: GeoPlace,
): Promise<{ ok: true; estimate: CabEstimate } | { ok: false; error: string }> {
  try {
    const estimate = await apiFetch<CabEstimate>("/cabs/estimate", {
      method: "POST",
      body: JSON.stringify({ pickup, dropoff }),
    });
    return { ok: true, estimate };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fare estimate failed" };
  }
}

export interface BookCabInput {
  pickup: GeoPlace;
  dropoff: GeoPlace;
  distanceKm: number;
  durationMin: number;
  cabType: string;
  fare: number;
  pickupTime: string;
  guest: { name: string; email: string; phone: string };
  tripId?: string;
}

export async function bookCab(
  input: BookCabInput,
): Promise<{ ok: true; booking: CabBooking } | { ok: false; error: string }> {
  try {
    const { booking } = await apiFetch<{ booking: CabBooking }>("/cabs/book", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, booking };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Booking failed" };
  }
}

export async function getCabBookingsByEmail(email: string): Promise<CabBooking[]> {
  try {
    const { bookings } = await apiFetch<{ bookings: CabBooking[] }>(`/cabs/bookings?email=${encodeURIComponent(email)}`);
    return bookings;
  } catch {
    return [];
  }
}

export async function cancelCabBooking(id: string, token: string): Promise<boolean> {
  try {
    await apiFetch(`/cabs/bookings/${id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// --- Trips ---

export async function listTrips(email: string): Promise<TripSummary[]> {
  try {
    const { trips } = await apiFetch<{ trips: TripSummary[] }>(`/trips?email=${encodeURIComponent(email)}`);
    return trips;
  } catch {
    return [];
  }
}

export interface CreateTripInput {
  email: string;
  label?: string;
  destinationLabel?: string;
  destinationRegionId?: string;
  startDate?: string;
  endDate?: string;
}

export async function createTrip(
  input: CreateTripInput,
): Promise<{ ok: true; trip: TripSummary } | { ok: false; error: string }> {
  try {
    const { trip } = await apiFetch<{ trip: TripSummary }>("/trips", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, trip };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start a trip" };
  }
}

export async function getTrip(tripId: string, email: string): Promise<TripDetail | undefined> {
  try {
    return await apiFetch<TripDetail>(`/trips/${encodeURIComponent(tripId)}?email=${encodeURIComponent(email)}`);
  } catch {
    return undefined;
  }
}

export interface SaveFlightToTripInput {
  email: string;
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
  departureDate: string;
  returnDate?: string;
  ownerName?: string;
  totalAmount: number;
  totalCurrency: string;
  redirectUrl: string;
  offerExpiresAt?: string;
}

export async function saveFlightToTrip(
  tripId: string,
  input: SaveFlightToTripInput,
): Promise<{ ok: true; flight: TripFlight } | { ok: false; error: string }> {
  try {
    const { flight } = await apiFetch<{ flight: TripFlight }>(`/trips/${encodeURIComponent(tripId)}/flights`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, flight };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save flight to trip" };
  }
}

// --- Admin ---
// Auth itself (login/logout/session) lives in contexts/AuthContext.tsx.

export async function adminListAlerts(): Promise<PriceAlert[]> {
  const { alerts } = await apiFetch<{ alerts: PriceAlert[] }>("/admin/alerts");
  return alerts;
}

export async function adminRecheckAlerts(): Promise<{ checked: number }> {
  return apiFetch<{ checked: number }>("/admin/alerts/recheck", { method: "POST" });
}

export async function adminListHotelBookings(): Promise<HotelBooking[]> {
  const { bookings } = await apiFetch<{ bookings: HotelBooking[] }>("/admin/stays");
  return bookings;
}

export async function adminListCabBookings(): Promise<CabBooking[]> {
  const { bookings } = await apiFetch<{ bookings: CabBooking[] }>("/admin/cabs");
  return bookings;
}
