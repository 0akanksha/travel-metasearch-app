import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { BookingOrder } from "../lib/types";
import { formatDate, formatMoney, formatTime } from "../lib/format";

interface LocationState {
  order: BookingOrder;
}

export default function BookingSuccess() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (!state?.order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">No booking to show</p>
        <p className="mt-1 text-sm text-ink-900/70">Look up an existing booking with your reference code and email.</p>
        <Link to="/manage" className="mt-4 inline-block font-semibold text-pine-600 underline">
          Manage a booking
        </Link>
      </div>
    );
  }

  const { order } = state;

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-pine-500" />
      <h1 className="mt-4 text-2xl font-bold text-ink-950">Booking confirmed</h1>
      <p className="mt-1 text-ink-900/70">Confirmed in test mode — no real payment was made.</p>

      <div className="mt-8 rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-ink-900/15 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/60">Booking reference</p>
            <p className="text-2xl font-extrabold tracking-widest text-ink-950">{order.bookingReference}</p>
          </div>
          <span className="rounded-full bg-pine-500/10 px-3 py-1 text-xs font-bold uppercase text-pine-700">Confirmed</span>
        </div>

        {order.slices.map((slice, i) => (
          <div key={i} className="mb-4 border-b border-ink-900/10 pb-4 last:mb-0 last:border-0 last:pb-0">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-lg font-bold text-ink-950">{slice.origin}</p>
                <p className="text-ink-900/60">{formatTime(slice.departingAt ?? "")}</p>
              </div>
              <div className="self-center text-ink-900/40">&rarr;</div>
              <div className="text-right">
                <p className="text-lg font-bold text-ink-950">{slice.destination}</p>
                <p className="text-ink-900/60">{formatTime(slice.arrivingAt ?? "")}</p>
              </div>
            </div>
            <p className="mt-1 text-sm text-ink-900/70">{formatDate(slice.departingAt ?? "")}</p>
          </div>
        ))}

        {order.passengers.map((p) => (
          <div key={p.id} className="mt-3 border-t border-ink-900/10 pt-3 first:mt-0 first:border-0 first:pt-0">
            <p className="font-semibold text-ink-900">
              {p.givenName} {p.familyName}
            </p>
          </div>
        ))}

        <p className="mt-4 border-t border-ink-900/10 pt-4 text-base font-bold text-ink-950">
          {formatMoney(order.totalAmount, order.totalCurrency)} paid (test mode)
        </p>
      </div>

      <Link to="/" className="mt-6 inline-block font-semibold text-pine-600 underline">
        Search another flight
      </Link>
    </div>
  );
}
