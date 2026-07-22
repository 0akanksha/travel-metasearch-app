import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Clock } from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";
import type { GeoPlace } from "../lib/types";

function nowLocalISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function CabSearchForm() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState<GeoPlace | null>(null);
  const [dropoff, setDropoff] = useState<GeoPlace | null>(null);
  const [pickupTime, setPickupTime] = useState(nowLocalISO());
  const [error, setError] = useState<string | null>(null);

  function swap() {
    setPickup(dropoff);
    setDropoff(pickup);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff) {
      setError("Pick a suggestion from the dropdown for both pickup and drop-off.");
      return;
    }
    const params = new URLSearchParams({
      pickupLabel: pickup.label,
      pickupLat: String(pickup.lat),
      pickupLng: String(pickup.lng),
      dropoffLabel: dropoff.label,
      dropoffLat: String(dropoff.lat),
      dropoffLng: String(dropoff.lng),
      pickupTime,
    });
    navigate(`/cabs/estimate?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl shadow-ink-950/20 md:p-6"
    >
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
        <AddressAutocomplete label="Pickup" placeholder="Pickup address" onSelect={setPickup} />

        <button
          type="button"
          onClick={swap}
          aria-label="Swap pickup and drop-off"
          className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-900/10 text-ink-900 transition hover:bg-ink-950/5 md:mb-1"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <AddressAutocomplete label="Drop-off" placeholder="Drop-off address" onSelect={setDropoff} />
      </div>

      <label className="block min-w-[180px] max-w-xs text-left">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">
          <Clock className="h-3.5 w-3.5" /> Pickup time
        </span>
        <input
          required
          type="datetime-local"
          value={pickupTime}
          min={nowLocalISO()}
          onChange={(e) => setPickupTime(e.target.value)}
          className="w-full rounded-lg border border-ink-900/10 bg-ink-950/5 px-3 py-2.5 font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        See fare options
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
