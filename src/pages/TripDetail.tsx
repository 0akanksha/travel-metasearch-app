import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, BedDouble, Car, ExternalLink, Plane, Trash2 } from "lucide-react";
import { cancelCabBooking, cancelHotelBooking, getTrip } from "../lib/api";
import type { CabBooking, HotelBooking, TripDetail as TripDetailType, TripFlight } from "../lib/types";
import { formatDate, formatMoney, formatShortDate } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";

type TimelineItem =
  | { type: "flight"; date: string; flight: TripFlight }
  | { type: "hotel"; date: string; hotel: HotelBooking }
  | { type: "cab"; date: string; cab: CabBooking };

export default function TripDetail() {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [trip, setTrip] = useState<TripDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId || !email) {
      setLoading(false);
      return;
    }
    getTrip(tripId, email).then((found) => {
      setTrip(found ?? null);
      setLoading(false);
    });
  }, [tripId, email]);

  if (loading) return <LoadingSpinner />;

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Trip not found</p>
        <p className="mt-1 text-sm text-ink-900/70">Check the link, or look it up again with your email.</p>
      </div>
    );
  }

  async function handleCancelHotel(booking: HotelBooking) {
    const ok = await cancelHotelBooking(booking.id, booking.cancelToken);
    if (ok && trip) {
      setTrip({ ...trip, hotels: trip.hotels.map((h) => (h.id === booking.id ? { ...h, status: "cancelled" } : h)) });
    }
  }

  async function handleCancelCab(booking: CabBooking) {
    const ok = await cancelCabBooking(booking.id, booking.cancelToken);
    if (ok && trip) {
      setTrip({ ...trip, cabs: trip.cabs.map((c) => (c.id === booking.id ? { ...c, status: "cancelled" } : c)) });
    }
  }

  const timeline: TimelineItem[] = [
    ...trip.flights.map((flight): TimelineItem => ({ type: "flight", date: flight.departureDate, flight })),
    ...trip.hotels.map((hotel): TimelineItem => ({ type: "hotel", date: hotel.checkInDate, hotel })),
    ...trip.cabs.map((cab): TimelineItem => ({ type: "cab", date: cab.pickupTime, cab })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-ink-950">{trip.trip.label}</h1>
      <p className="mb-8 text-sm text-ink-900/60">Started {formatDate(trip.trip.createdAt)}</p>

      {timeline.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-900/15 py-10 text-center text-sm text-ink-900/60">
          Nothing saved to this trip yet.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {timeline.map((item, i) => {
          if (item.type === "flight") {
            const { flight } = item;
            const expired = flight.offerExpiresAt !== null && new Date(flight.offerExpiresAt) < new Date();
            return (
              <div key={`flight-${i}`} className="rounded-xl border border-ink-900/10 bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                  <Plane className="h-3.5 w-3.5" /> Flight
                </div>
                <p className="font-bold text-ink-950">
                  {flight.originLabel} &rarr; {flight.destinationLabel}
                </p>
                <p className="text-sm text-ink-900/70">
                  {formatShortDate(flight.departureDate)}
                  {flight.returnDate ? ` – ${formatShortDate(flight.returnDate)}` : ""}
                  {flight.ownerName ? ` · ${flight.ownerName}` : ""}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-extrabold text-ink-950">{formatMoney(flight.totalAmount, flight.totalCurrency)}</p>
                  <a
                    href={flight.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-ink-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-800"
                  >
                    Continue to airline <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                {expired && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-coral-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> This fare may have changed since it was saved.
                  </p>
                )}
              </div>
            );
          }

          if (item.type === "hotel") {
            const { hotel } = item;
            return (
              <div key={`hotel-${i}`} className="rounded-xl border border-ink-900/10 bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                  <BedDouble className="h-3.5 w-3.5" /> Hotel
                </div>
                <p className="font-bold text-ink-950">
                  {hotel.hotelName}
                  {hotel.status === "cancelled" && <span className="ml-2 text-xs font-normal text-red-600">Cancelled</span>}
                </p>
                <p className="text-sm text-ink-900/70">
                  {formatShortDate(hotel.checkInDate)} – {formatShortDate(hotel.checkOutDate)} &middot; {hotel.cityLabel}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-extrabold text-ink-950">{formatMoney(hotel.totalAmount, hotel.totalCurrency)}</p>
                  {hotel.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancelHotel(hotel)}
                      aria-label="Cancel hotel booking"
                      className="rounded-lg p-2 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          }

          const { cab } = item;
          return (
            <div key={`cab-${i}`} className="rounded-xl border border-ink-900/10 bg-white p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                <Car className="h-3.5 w-3.5" /> Cab
              </div>
              <p className="font-bold text-ink-950">
                {cab.pickupLabel.split(",")[0]} &rarr; {cab.dropoffLabel.split(",")[0]}
                {cab.status === "cancelled" && <span className="ml-2 text-xs font-normal text-red-600">Cancelled</span>}
              </p>
              <p className="text-sm text-ink-900/70">
                {new Date(cab.pickupTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-extrabold text-ink-950">{formatMoney(cab.fare, cab.currency)}</p>
                {cab.status !== "cancelled" && (
                  <button
                    onClick={() => handleCancelCab(cab)}
                    aria-label="Cancel cab booking"
                    className="rounded-lg p-2 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
