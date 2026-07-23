import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { CruiseBooking } from "../lib/types";
import { formatMoney, formatShortDate } from "../lib/format";

export default function CruiseConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = (location.state as { booking?: CruiseBooking } | null)?.booking;

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Booking details not available here</p>
        <p className="mt-1 text-sm text-ink-900/70">
          Look up your booking with your email on the "Manage bookings" page instead.
        </p>
        <button onClick={() => navigate("/cruises/bookings")} className="mt-4 text-pine-600 underline">
          Manage cruise bookings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-14 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-pine-600" />
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Cruise booked</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Booking <span className="font-mono font-semibold text-ink-900">{booking.bookingReference}</span> — a copy is
        looked up any time with your email.
      </p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <p className="text-lg font-bold text-ink-950">{booking.itineraryTitle}</p>
        <p className="text-sm text-ink-900/60">
          {booking.shipName} &middot; Departs {booking.departurePort} &middot; {formatShortDate(booking.sailDate)}
        </p>
        <p className="mt-2 text-sm text-ink-900/60">
          {booking.cabinLabel} cabin &middot; {booking.guestCount} guest{booking.guestCount === 1 ? "" : "s"}
        </p>
        <div className="mt-4 border-t border-ink-900/10 pt-4 text-sm">
          <p className="font-semibold text-ink-950">Total paid</p>
          <p className="text-lg font-extrabold text-ink-950">{formatMoney(booking.totalUsd, "USD")}</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/cruises")}
        className="mt-6 rounded-lg bg-ink-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Browse more cruises
      </button>
    </div>
  );
}
