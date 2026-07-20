import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, Sparkles, Users } from "lucide-react";
import PlaceAutocomplete from "./PlaceAutocomplete";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export type TripType = "oneway" | "roundtrip";

export interface SearchFormInitial {
  origin?: string;
  originLabel?: string;
  destination?: string;
  destinationLabel?: string;
  date?: string;
  returnDate?: string;
  passengers?: number;
  tripType?: TripType;
}

export default function SearchForm({ initial }: { initial?: SearchFormInitial }) {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "oneway");
  const [origin, setOrigin] = useState(initial?.origin ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? "");
  const [passengers, setPassengers] = useState(initial?.passengers ?? 1);
  const [flexible, setFlexible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEverywhere = destination === "EVERYWHERE";

  function swap() {
    if (isEverywhere) return;
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) {
      setError("Pick a suggestion from the dropdown for both From and To.");
      return;
    }

    if (isEverywhere) {
      navigate(`/everywhere?origin=${origin}&date=${date}`);
      return;
    }

    if (flexible) {
      const month = date.slice(0, 7);
      navigate(`/calendar?origin=${origin}&destination=${destination}&month=${month}`);
      return;
    }

    if (tripType === "roundtrip" && !returnDate) {
      setError("Pick a return date, or switch to one-way.");
      return;
    }
    const params = new URLSearchParams({ origin, destination, date, passengers: String(passengers) });
    if (tripType === "roundtrip") params.set("returnDate", returnDate);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl shadow-ink-950/20 md:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        {(["oneway", "roundtrip"] as TripType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTripType(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              tripType === t ? "bg-ink-950 text-white" : "bg-ink-950/5 text-ink-900/60 hover:bg-ink-950/10"
            }`}
          >
            {t === "oneway" ? "One-way" : "Round trip"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFlexible((f) => !f)}
          disabled={isEverywhere}
          className={`ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${
            flexible ? "bg-coral-500 text-white" : "bg-ink-950/5 text-ink-900/60 hover:bg-ink-950/10"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Flexible dates
        </button>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
        <PlaceAutocomplete
          label="From"
          placeholder="City, airport, or country"
          initialLabel={initial?.originLabel}
          onSelect={(p) => {
            setOrigin(p.iataCode);
            setError(null);
          }}
        />

        <button
          type="button"
          onClick={swap}
          disabled={isEverywhere}
          aria-label="Swap origin and destination"
          className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-900/10 text-ink-900 transition hover:bg-ink-950/5 disabled:cursor-not-allowed disabled:opacity-40 md:mb-1"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <PlaceAutocomplete
          label="To"
          placeholder="City, airport, or 'Everywhere'"
          initialLabel={initial?.destinationLabel}
          allowEverywhere
          onSelect={(p) => {
            setDestination(p.iataCode);
            setError(null);
          }}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[140px] flex-1 text-left">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
            <CalendarDays className="h-3.5 w-3.5" /> {flexible ? "Any date in month" : "Depart"}
          </span>
          <input
            required
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
          />
        </label>

        {tripType === "roundtrip" && !flexible && !isEverywhere && (
          <label className="block min-w-[140px] flex-1 text-left">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
              <CalendarDays className="h-3.5 w-3.5" /> Return
            </span>
            <input
              required
              type="date"
              value={returnDate}
              min={date || todayISO()}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
            />
          </label>
        )}

        {!isEverywhere && (
          <label className="block min-w-[140px] flex-1 text-left">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
              <Users className="h-3.5 w-3.5" /> Passengers
            </span>
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "passenger" : "passengers"}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 active:scale-[0.98]"
        >
          {isEverywhere ? "Explore destinations" : flexible ? "See price calendar" : "Search flights"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
