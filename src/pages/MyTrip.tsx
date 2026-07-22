import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPinned, Search } from "lucide-react";
import { listTrips } from "../lib/api";
import type { TripSummary } from "../lib/types";
import { formatDate } from "../lib/format";

export default function MyTrip() {
  const [searchParams] = useSearchParams();
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [trips, setTrips] = useState<TripSummary[] | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setTrips(await listTrips(lookupEmail));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <MapPinned className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">My trip</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">See your whole trip in one place</h1>
      <p className="mb-8 text-sm text-ink-900/60">
        No account needed — flights, hotels, and cabs you've saved to a trip, looked up by email.
      </p>

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

        {trips !== null && trips.length === 0 && (
          <p className="text-sm text-ink-900/60">
            No trips found for that email yet — start one by saving a flight, hotel, or cab booking to a trip.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {trips?.map((trip) => (
            <Link
              key={trip.id}
              to={`/trip/${trip.id}?email=${encodeURIComponent(lookupEmail)}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/10 p-4 transition hover:border-ink-900/20 hover:shadow-sm"
            >
              <div>
                <p className="font-semibold text-ink-950">{trip.label}</p>
                <p className="text-xs text-ink-900/60">
                  {trip.flightCount} flight{trip.flightCount === 1 ? "" : "s"} &middot; {trip.hotelCount} hotel
                  {trip.hotelCount === 1 ? "" : "s"} &middot; {trip.cabCount} cab{trip.cabCount === 1 ? "" : "s"} &middot; started{" "}
                  {formatDate(trip.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
