import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Anchor, MapPin, Minus, Plus } from "lucide-react";
import { CRUISE_ITINERARIES } from "../lib/cruiseItineraries";
import { bookCruise, createTrip } from "../lib/api";
import type { TripSelection } from "../lib/types";
import TripPicker from "../components/TripPicker";

export default function CruiseDetail() {
  const { itineraryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const itinerary = CRUISE_ITINERARIES.find((i) => i.id === itineraryId);

  const [sailDate, setSailDate] = useState(itinerary?.sailDates[0] ?? "");
  const [cabinTier, setCabinTier] = useState(itinerary?.cabinTiers[1]?.id ?? "");
  const [guestCount, setGuestCount] = useState(2);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [tripSelection, setTripSelection] = useState<TripSelection>({ mode: "none" });

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  if (!itinerary) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Itinerary not found</p>
        <button onClick={() => navigate("/cruises")} className="mt-4 text-pine-600 underline">
          Back to cruises
        </button>
      </div>
    );
  }

  const tier = itinerary.cabinTiers.find((t) => t.id === cabinTier) ?? itinerary.cabinTiers[0];
  const total = tier.pricePerPersonUsd * guestCount;

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!itinerary) return;
    setError("");
    setBooking(true);

    let tripId: string | undefined;
    if (tripSelection.mode === "existing") {
      tripId = tripSelection.tripId;
    } else if (tripSelection.mode === "new") {
      const tripResult = await createTrip({ email, label: tripSelection.label });
      if (!tripResult.ok) {
        setBooking(false);
        setError(tripResult.error);
        return;
      }
      tripId = tripResult.trip.id;
    }

    const result = await bookCruise({
      itineraryId: itinerary.id,
      cabinTier,
      sailDate,
      guestCount,
      guest: { name, email, phone },
      tripId,
    });
    setBooking(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/cruises/confirmation/${result.booking.id}`, { state: { booking: result.booking } });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 aspect-[21/9] w-full overflow-hidden rounded-xl">
        <img src={itinerary.imageUrl} alt={itinerary.shipName} className="h-full w-full object-cover" />
      </div>

      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
        <MapPin className="h-3.5 w-3.5" /> Departs {itinerary.departurePort}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink-950">{itinerary.title}</h1>
      <p className="mt-1 text-sm text-ink-900/70">
        {itinerary.cruiseLine} &middot; {itinerary.shipName}
      </p>
      <p className="mt-3 text-sm text-ink-900/70">{itinerary.description}</p>

      <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink-900/80">
        <Anchor className="h-4 w-4" /> {itinerary.nights} nights &middot; {itinerary.ports.join(" · ")}
      </p>

      <div className="mt-8 rounded-xl border border-ink-900/10 bg-white p-6">
        <form onSubmit={handleBook} className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Sail date &amp; guests</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Sail date</span>
                <select
                  value={sailDate}
                  onChange={(e) => setSailDate(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                >
                  {itinerary.sailDates.map((d) => (
                    <option key={d} value={d}>
                      {new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Guests</span>
                <div className="flex items-center gap-3 rounded-lg border border-ink-900/15 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                    className="rounded-md p-1 text-ink-900/60 hover:bg-ink-950/5"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center font-semibold text-ink-950">{guestCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.min(8, g + 1))}
                    className="rounded-md p-1 text-ink-900/60 hover:bg-ink-950/5"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </label>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Cabin type</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {itinerary.cabinTiers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCabinTier(t.id)}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition ${
                    cabinTier === t.id ? "border-pine-500 bg-pine-500/10" : "border-ink-900/15 hover:bg-ink-950/5"
                  }`}
                >
                  <p className="font-bold text-ink-950">{t.label}</p>
                  <p className="text-xs text-ink-900/60">{t.description}</p>
                  <p className="text-sm font-extrabold text-ink-950">${t.pricePerPersonUsd.toLocaleString()}/person</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-y border-ink-900/10 py-4">
            <p className="text-sm font-semibold text-ink-900/70">
              {tier.label} &times; {guestCount} guest{guestCount === 1 ? "" : "s"}
            </p>
            <p className="text-2xl font-extrabold text-ink-950">${total.toLocaleString()}</p>
          </div>

          <div>
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
          </div>

          <TripPicker email={email} onChange={setTripSelection} />

          <button
            type="submit"
            disabled={booking}
            className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {booking ? "Booking…" : `Book for $${total.toLocaleString()}`}
          </button>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
