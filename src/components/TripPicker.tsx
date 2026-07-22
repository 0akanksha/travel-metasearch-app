import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { listTrips } from "../lib/api";
import type { TripSelection, TripSummary } from "../lib/types";

interface TripPickerProps {
  email: string;
  onChange: (selection: TripSelection) => void;
}

// Collapsed-by-default "add this to a trip" toggle, shared by HotelDetail,
// CabEstimate, and Redirect's booking/save forms. Never creates a trip
// itself (see createTrip in lib/api.ts) — only reports a selection back, so
// the host page can create the trip (if "new") right before its own
// booking/save call. That way opening this and abandoning the form never
// leaves an orphan trip behind.
export default function TripPicker({ email, onChange }: TripPickerProps) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [choice, setChoice] = useState<"none" | "new" | string>("none");
  const [newLabel, setNewLabel] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open || !email.includes("@")) {
      setTrips([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      listTrips(email).then(setTrips);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [open, email]);

  useEffect(() => {
    if (choice === "none") onChange({ mode: "none" });
    else if (choice === "new") onChange({ mode: "new", label: newLabel });
    else onChange({ mode: "existing", tripId: choice });
    // Only re-run when the meaningful inputs change, not on every onChange identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, newLabel]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 self-start text-xs font-semibold text-pine-600 hover:text-pine-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add this to a trip (optional)
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-ink-900/10 bg-ink-950/[0.03] p-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Add to a trip (optional)</span>
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-pine-500 focus:outline-none"
        >
          <option value="none">Don't add to a trip</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} ({t.flightCount + t.hotelCount + t.cabCount} item{t.flightCount + t.hotelCount + t.cabCount === 1 ? "" : "s"})
            </option>
          ))}
          <option value="new">+ Start a new trip</option>
        </select>
      </label>
      {choice === "new" && (
        <label className="mt-2 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Trip name (optional)</span>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Paris getaway"
            className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-pine-500 focus:outline-none"
          />
        </label>
      )}
      {!email.includes("@") && (
        <p className="mt-2 text-xs text-ink-900/50">Enter your email above to see your existing trips.</p>
      )}
    </div>
  );
}
