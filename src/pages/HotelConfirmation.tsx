import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { HotelBooking } from "../lib/types";
import { formatMoney, formatShortDate } from "../lib/format";

export default function HotelConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = (location.state as { booking?: HotelBooking } | null)?.booking;

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Booking details not available here</p>
        <p className="mt-1 text-sm text-ink-900/70">
          Look up your reservation with your email on the "Manage bookings" page instead.
        </p>
        <button onClick={() => navigate("/hotels/bookings")} className="mt-4 text-pine-600 underline">
          Manage hotel bookings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-14 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-pine-600" />
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Reservation confirmed</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Confirmation <span className="font-mono font-semibold text-ink-900">{booking.bookingReference}</span> — a copy is
        looked up any time with your email.
      </p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <p className="text-lg font-bold text-ink-950">{booking.hotelName}</p>
        <p className="text-sm text-ink-900/60">{booking.cityLabel}</p>
        <div className="mt-4 flex items-center justify-between border-t border-ink-900/10 pt-4 text-sm">
          <div>
            <p className="font-semibold text-ink-950">
              {formatShortDate(booking.checkInDate)} &ndash; {formatShortDate(booking.checkOutDate)}
            </p>
            <p className="text-ink-900/60">
              {booking.guestCount} guest{booking.guestCount === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-xl font-extrabold text-ink-950">{formatMoney(booking.totalAmount, booking.totalCurrency)}</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/hotels")}
        className="mt-6 rounded-lg bg-ink-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Search more hotels
      </button>
    </div>
  );
}
