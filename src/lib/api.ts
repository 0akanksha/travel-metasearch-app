import type { CalendarDay, DestinationDeal, OfferSummary, Place, PriceAlert } from "./types";

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

// --- Admin ---
// Auth itself (login/logout/session) lives in contexts/AuthContext.tsx.

export async function adminListAlerts(): Promise<PriceAlert[]> {
  const { alerts } = await apiFetch<{ alerts: PriceAlert[] }>("/admin/alerts");
  return alerts;
}

export async function adminRecheckAlerts(): Promise<{ checked: number }> {
  return apiFetch<{ checked: number }>("/admin/alerts/recheck", { method: "POST" });
}
