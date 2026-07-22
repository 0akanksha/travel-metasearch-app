import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import DestinationAutocomplete from "./DestinationAutocomplete";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export interface HotelSearchFormInitial {
  regionId?: string;
  cityLabel?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
}

export default function HotelSearchForm({ initial }: { initial?: HotelSearchFormInitial }) {
  const navigate = useNavigate();
  const [regionId, setRegionId] = useState(initial?.regionId ?? "");
  const [cityLabel, setCityLabel] = useState(initial?.cityLabel ?? "");
  const [checkInDate, setCheckInDate] = useState(initial?.checkInDate ?? todayISO());
  const [checkOutDate, setCheckOutDate] = useState(initial?.checkOutDate ?? tomorrowISO());
  const [guests, setGuests] = useState(initial?.guests ?? 2);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regionId) {
      setError("Pick a suggestion from the dropdown for your destination.");
      return;
    }
    if (checkOutDate <= checkInDate) {
      setError("Check-out must be after check-in.");
      return;
    }
    const params = new URLSearchParams({ regionId, cityLabel, checkInDate, checkOutDate, guests: String(guests) });
    navigate(`/hotels/results?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl shadow-ink-950/20 md:p-6"
    >
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <DestinationAutocomplete
          label="Destination"
          placeholder="City or neighborhood"
          initialLabel={initial?.cityLabel}
          onSelect={(d) => {
            setRegionId(d.regionId);
            setCityLabel(d.label);
            setError(null);
          }}
        />

        <label className="block text-left">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
            <CalendarDays className="h-3.5 w-3.5" /> Check-in
          </span>
          <input
            required
            type="date"
            value={checkInDate}
            min={todayISO()}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
          />
        </label>

        <label className="block text-left">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
            <CalendarDays className="h-3.5 w-3.5" /> Check-out
          </span>
          <input
            required
            type="date"
            value={checkOutDate}
            min={checkInDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
          />
        </label>

        <label className="block text-left">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
            <Users className="h-3.5 w-3.5" /> Guests
          </span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        Search hotels
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
