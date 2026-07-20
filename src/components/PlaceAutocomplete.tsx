import { useEffect, useRef, useState } from "react";
import { Globe2 } from "lucide-react";
import { searchPlaces } from "../lib/api";
import type { Place } from "../lib/types";

interface PlaceAutocompleteProps {
  label: string;
  placeholder: string;
  initialLabel?: string;
  allowEverywhere?: boolean;
  onSelect: (place: { iataCode: string; label: string }) => void;
}

function formatPlace(p: Place) {
  const primary = p.name ?? p.cityName ?? p.iataCode;
  return p.type === "airport" && p.cityName && p.cityName !== p.name ? `${primary}, ${p.cityName}` : primary;
}

export default function PlaceAutocomplete({
  label,
  placeholder,
  initialLabel,
  allowEverywhere,
  onSelect,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState(initialLabel ?? "");
  const [results, setResults] = useState<Place[]>([]);
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
      const places = await searchPlaces(query);
      setResults(places);
      setLoading(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(p: Place) {
    const label = `${formatPlace(p)} (${p.iataCode})`;
    setQuery(label);
    setResults([]);
    setOpen(false);
    onSelect({ iataCode: p.iataCode, label });
  }

  function handleSelectEverywhere() {
    setQuery("Everywhere");
    setResults([]);
    setOpen(false);
    onSelect({ iataCode: "EVERYWHERE", label: "Everywhere" });
  }

  const showEverywhere = allowEverywhere && query.trim().length < 2;

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
      {open && (showEverywhere || loading || results.length > 0) && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-900/10 bg-white shadow-lg">
          {showEverywhere && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSelectEverywhere}
                className="flex w-full items-center gap-2 border-b border-ink-900/5 px-3 py-2 text-left text-sm hover:bg-pine-700/5"
              >
                <Globe2 className="h-4 w-4 text-pine-600" />
                <span className="font-medium text-ink-900">Everywhere</span>
                <span className="ml-auto text-xs text-ink-900/50">See the cheapest destinations</span>
              </button>
            </li>
          )}
          {loading && <li className="px-3 py-2 text-sm text-ink-900/50">Searching…</li>}
          {!loading &&
            results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(p)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-ink-950/5"
                >
                  <span>
                    <span className="font-medium text-ink-900">{formatPlace(p)}</span>
                    {p.type === "city" && <span className="ml-1.5 text-ink-900/50">City &amp; nearby airports</span>}
                  </span>
                  <span className="shrink-0 rounded bg-ink-950/5 px-1.5 py-0.5 font-mono text-xs text-ink-900/70">
                    {p.iataCode}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </label>
  );
}
