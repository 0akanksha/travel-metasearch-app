import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { CabBooking } from "../lib/types";
import { formatMoney } from "../lib/format";

export default function CabConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = (location.state as { booking?: CabBooking } | null)?.booking;

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Booking details not available here</p>
        <p className="mt-1 text-sm text-ink-900/70">
          Look up your ride with your email on the "Manage bookings" page instead.
        </p>
        <button onClick={() => navigate("/cabs/bookings")} className="mt-4 text-pine-600 underline">
          Manage cab bookings
        </button>
      </div>
    );
  }

  const pickupTime = new Date(booking.pickupTime);

  return (
    <div className="mx-auto max-w-xl px-6 py-14 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-pine-600" />
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Ride booked</h1>
      <p className="mb-6 text-sm text-ink-900/60">Look it up any time with your email.</p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <p className="text-sm font-semibold text-ink-950">{booking.pickupLabel}</p>
        <p className="my-1 text-xs text-ink-900/40">&darr;</p>
        <p className="text-sm font-semibold text-ink-950">{booking.dropoffLabel}</p>
        <div className="mt-4 flex items-center justify-between border-t border-ink-900/10 pt-4 text-sm">
          <div>
            <p className="font-semibold text-ink-950">
              {pickupTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
              {pickupTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="text-ink-900/60">{booking.distanceKm.toFixed(1)} km &middot; ~{Math.round(booking.durationMin)} min</p>
          </div>
          <p className="text-xl font-extrabold text-ink-950">{formatMoney(booking.fare, booking.currency)}</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/cabs")}
        className="mt-6 rounded-lg bg-ink-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Book another ride
      </button>
    </div>
  );
}
