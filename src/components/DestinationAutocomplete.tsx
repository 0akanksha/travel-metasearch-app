import { useEffect, useRef, useState } from "react";
import { searchHotelDestinations } from "../lib/api";
import type { HotelDestination } from "../lib/types";

interface DestinationAutocompleteProps {
  label: string;
  placeholder: string;
  initialLabel?: string;
  onSelect: (destination: { regionId: string; label: string }) => void;
}

export default function DestinationAutocomplete({
  label,
  placeholder,
  initialLabel,
  onSelect,
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(initialLabel ?? "");
  const [results, setResults] = useState<HotelDestination[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const destinations = await searchHotelDestinations(query);
      setResults(destinations);
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(d: HotelDestination) {
    setQuery(d.label);
    setResults([]);
    setOpen(false);
    onSelect({ regionId: d.regionId, label: d.label });
  }

  return (
    <label className="relative block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">{label}</span>
      <input
        required
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 placeholder:text-ink-900/40 focus:border-pine-500 focus:outline-none"
      />
      {open && (loading || results.length > 0) && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-900/10 bg-white shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-ink-900/50">Searching…</li>}
          {!loading &&
            results.map((d, i) => (
              <li key={`${d.regionId}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(d)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-ink-950/5"
                >
                  <span className="font-medium text-ink-900">{d.label}</span>
                  <span className="shrink-0 text-xs text-ink-900/50">{d.secondaryLabel}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </label>
  );
}
