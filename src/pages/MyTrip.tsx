import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, Compass, MapPinned, Search } from "lucide-react";
import { createTrip, listTrips } from "../lib/api";
import type { TripSummary } from "../lib/types";
import { formatDate } from "../lib/format";
import DestinationAutocomplete from "../components/DestinationAutocomplete";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function MyTrip() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  // Arrives from /explore's "Plan a trip here" — prefills the destination
  // field's text; DestinationAutocomplete resolves real matches on mount.
  const destinationQuery = searchParams.get("destinationQuery") ?? undefined;

  const [planEmail, setPlanEmail] = useState("");
  const [planLabel, setPlanLabel] = useState("");
  const [destinationRegionId, setDestinationRegionId] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setTrips(await listTrips(lookupEmail));
  }

  async function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    setPlanError("");
    setPlanning(true);
    const result = await createTrip({
      email: planEmail,
      label: planLabel || (destinationLabel ? `Trip to ${destinationLabel}` : undefined),
      destinationLabel: destinationLabel || undefined,
      destinationRegionId: destinationRegionId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setPlanning(false);
    if (!result.ok) {
      setPlanError(result.error);
      return;
    }
    navigate(`/trip/${result.trip.id}?email=${encodeURIComponent(planEmail)}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <MapPinned className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">My trip</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Plan a trip, then book into it</h1>
      <p className="mb-4 text-sm text-ink-900/60">
        No account needed — start a trip with a destination and dates, then search flights, hotels, and cabs for it.
      </p>
      <Link
        to="/explore"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-pine-600 hover:text-pine-700"
      >
        <Compass className="h-4 w-4" /> Not sure where yet? Explore destinations
      </Link>

      <form onSubmit={handlePlan} className="mb-10 flex flex-col gap-4 rounded-xl border border-ink-900/10 bg-white p-6">
        <h2 className="text-sm font-bold text-ink-950">Plan a new trip</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DestinationAutocomplete
            label="Destination"
            placeholder="City or neighborhood"
            initialLabel={destinationQuery}
            onSelect={(d) => {
              setDestinationRegionId(d.regionId);
              setDestinationLabel(d.label);
            }}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Trip name (optional)</span>
            <input
              value={planLabel}
              onChange={(e) => setPlanLabel(e.target.value)}
              placeholder="e.g. Rome anniversary trip"
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
              <CalendarDays className="h-3.5 w-3.5" /> Start date
            </span>
            <input
              type="date"
              value={startDate}
              min={todayISO()}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
              <CalendarDays className="h-3.5 w-3.5" /> End date
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Your email</span>
            <input
              required
              type="email"
              value={planEmail}
              onChange={(e) => setPlanEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={planning}
          className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
        >
          {planning ? "Starting…" : "Start planning"}
        </button>
        {planError && <p className="text-sm font-medium text-red-600">{planError}</p>}
      </form>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold text-ink-950">Look up an existing trip</h2>
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

        {trips !== null && trips.length === 0 && <p className="text-sm text-ink-900/60">No trips found for that email yet.</p>}

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
                  {trip.destinationLabel ? `${trip.destinationLabel} · ` : ""}
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
