import { useEffect, useRef, useState } from "react";
import { searchCabPlaces } from "../lib/api";
import type { GeoPlace } from "../lib/types";

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  initialLabel?: string;
  onSelect: (place: GeoPlace) => void;
}

export default function AddressAutocomplete({ label, placeholder, initialLabel, onSelect }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialLabel ?? "");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    // Slower debounce than PlaceAutocomplete — Nominatim's public instance
    // asks for roughly 1 request/second, not fired on every keystroke.
    debounceRef.current = setTimeout(async () => {
      const places = await searchCabPlaces(query);
      setResults(places);
      setLoading(false);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(p: GeoPlace) {
    setQuery(p.label);
    setResults([]);
    setOpen(false);
    onSelect(p);
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
            results.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(p)}
                  className="w-full px-3 py-2 text-left text-sm text-ink-900 hover:bg-ink-950/5"
                >
                  {p.label}
                </button>
              </li>
            ))}
        </ul>
      )}
    </label>
  );
}
