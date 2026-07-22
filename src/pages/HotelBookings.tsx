import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BedDouble, Search, Trash2 } from "lucide-react";
import { cancelHotelBooking, getHotelBookingsByEmail } from "../lib/api";
import type { HotelBooking } from "../lib/types";
import { formatMoney, formatShortDate } from "../lib/format";

export default function HotelBookings() {
  const [searchParams] = useSearchParams();
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [bookings, setBookings] = useState<HotelBooking[] | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setBookings(await getHotelBookingsByEmail(lookupEmail));
  }

  async function handleCancel(booking: HotelBooking) {
    const ok = await cancelHotelBooking(booking.id, booking.cancelToken);
    if (ok) setBookings((prev) => prev?.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)) ?? null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <BedDouble className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">Hotel bookings</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Manage your reservations</h1>
      <p className="mb-8 text-sm text-ink-900/60">No account needed — look up bookings with the email you booked with.</p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6">
        <form onSubmit={handleLookup} className="mb-4 flex gap-2">
          <input
            required
            type="email"
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            <Search className="h-4 w-4" /> Look up
          </button>
        </form>

        {bookings !== null && bookings.length === 0 && (
          <p className="text-sm text-ink-900/60">No bookings found for that email.</p>
        )}

        <div className="flex flex-col gap-3">
          {bookings?.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/10 p-4">
              <div>
                <p className="font-semibold text-ink-950">
                  {booking.hotelName}
                  {booking.status === "cancelled" && <span className="ml-2 text-xs font-normal text-red-600">Cancelled</span>}
                </p>
                <p className="text-xs text-ink-900/60">
                  {formatShortDate(booking.checkInDate)} &ndash; {formatShortDate(booking.checkOutDate)} &middot;{" "}
                  {formatMoney(booking.totalAmount, booking.totalCurrency)} &middot; {booking.bookingReference}
                </p>
              </div>
              {booking.status !== "cancelled" && (
                <button
                  onClick={() => handleCancel(booking)}
                  aria-label="Cancel booking"
                  className="shrink-0 rounded-lg p-2 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
