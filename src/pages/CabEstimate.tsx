import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Car, Clock, Route } from "lucide-react";
import { bookCab, createTrip, estimateCab } from "../lib/api";
import type { CabEstimate as CabEstimateType, CabFareOption, GeoPlace, TripSelection } from "../lib/types";
import { formatMoney } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";
import TripPicker from "../components/TripPicker";

export default function CabEstimate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pickup: GeoPlace = {
    label: searchParams.get("pickupLabel") ?? "",
    lat: Number(searchParams.get("pickupLat")),
    lng: Number(searchParams.get("pickupLng")),
  };
  const dropoff: GeoPlace = {
    label: searchParams.get("dropoffLabel") ?? "",
    lat: Number(searchParams.get("dropoffLat")),
    lng: Number(searchParams.get("dropoffLng")),
  };
  const pickupTime = searchParams.get("pickupTime") ?? "";

  const [estimate, setEstimate] = useState<CabEstimateType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CabFareOption | null>(null);
  const [name, setName] = useState("");
  // Pre-filled when arriving from a trip's "Search cabs for this trip" CTA
  // (see TripDetail.tsx / Cabs.tsx / CabSearchForm.tsx).
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [tripSelection, setTripSelection] = useState<TripSelection>({ mode: "none" });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    estimateCab(pickup, dropoff).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEstimate(result.estimate);
      setSelected(result.estimate.options[0] ?? null);
    });
    // Deliberately keyed off the raw query string, not the pickup/dropoff
    // objects above (those are new object literals every render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!estimate || !selected) return;
    setBookError("");
    setBooking(true);

    let tripId: string | undefined;
    if (tripSelection.mode === "existing") {
      tripId = tripSelection.tripId;
    } else if (tripSelection.mode === "new") {
      const tripResult = await createTrip({ email, label: tripSelection.label });
      if (!tripResult.ok) {
        setBooking(false);
        setBookError(tripResult.error);
        return;
      }
      tripId = tripResult.trip.id;
    }

    const result = await bookCab({
      pickup,
      dropoff,
      distanceKm: estimate.distanceKm,
      durationMin: estimate.durationMin,
      cabType: selected.cabType,
      fare: selected.fare,
      pickupTime,
      guest: { name, email, phone },
      tripId,
    });
    setBooking(false);
    if (!result.ok) {
      setBookError(result.error);
      return;
    }
    navigate(`/cabs/confirmation/${result.booking.id}`, { state: { booking: result.booking } });
  }

  if (loading) return <LoadingSpinner />;

  if (error || !estimate) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Couldn't estimate this route</p>
        <p className="mt-1 text-sm text-ink-900/70">{error || "Try a different pickup or drop-off."}</p>
        <button onClick={() => navigate("/cabs")} className="mt-4 text-pine-600 underline">
          Back to cab search
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-950">
          {pickup.label.split(",")[0]} &rarr; {dropoff.label.split(",")[0]}
        </h1>
        <Link
          to="/cabs/bookings"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-1.5 text-xs font-bold text-coral-600 transition hover:bg-coral-500/20"
        >
          <Car className="h-3.5 w-3.5" />
          Manage my bookings
        </Link>
      </div>
      <p className="mb-6 flex items-center gap-3 text-sm text-ink-900/60">
        <span className="flex items-center gap-1">
          <Route className="h-3.5 w-3.5" /> {estimate.distanceKm.toFixed(1)} km
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> ~{Math.round(estimate.durationMin)} min
        </span>
      </p>

      <div className="mb-6 flex flex-col gap-3">
        {estimate.options.map((option) => (
          <button
            key={option.cabType}
            type="button"
            onClick={() => setSelected(option)}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
              selected?.cabType === option.cabType
                ? "border-pine-500 bg-pine-500/5 ring-1 ring-pine-500"
                : "border-ink-900/10 bg-white hover:border-ink-900/20"
            }`}
          >
            <div>
              <p className="font-bold text-ink-950">{option.label}</p>
              <p className="text-xs text-ink-900/60">Up to {option.seats} seats</p>
            </div>
            <p className="text-xl font-extrabold text-ink-950">{formatMoney(option.fare, "USD")}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleBook} className="rounded-xl border border-ink-900/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold text-ink-950">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Full name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Phone</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4">
          <TripPicker email={email} onChange={setTripSelection} />
        </div>
        <button
          type="submit"
          disabled={booking || !selected}
          className="mt-4 self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
        >
          {booking ? "Booking…" : `Book ${selected?.label ?? "ride"}`}
        </button>
        {bookError && <p className="mt-2 text-sm font-medium text-red-600">{bookError}</p>}
      </form>
    </div>
  );
}
