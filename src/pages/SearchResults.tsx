import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, Globe2, SearchX } from "lucide-react";
import { searchFlights } from "../lib/api";
import type { OfferSummary } from "../lib/types";
import { formatIsoDuration, formatMoney, formatTime } from "../lib/format";
import SearchForm from "../components/SearchForm";
import LoadingSpinner from "../components/LoadingSpinner";

type SortKey = "price" | "duration" | "departure";
type StopsFilter = "any" | "nonstop" | "1stop";

function totalDurationMinutes(offer: OfferSummary): number {
  return offer.slices.reduce((sum, slice) => {
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(slice.duration ?? "");
    const h = Number(match?.[1] ?? 0);
    const m = Number(match?.[2] ?? 0);
    return sum + h * 60 + m;
  }, 0);
}

function maxStops(offer: OfferSummary): number {
  return Math.max(...offer.slices.map((s) => s.stops));
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [allOffers, setAllOffers] = useState<OfferSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [airlineFilter, setAirlineFilter] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("price");

  const origin = searchParams.get("origin") ?? "";
  const destination = searchParams.get("destination") ?? "";
  const date = searchParams.get("date") ?? "";
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const passengers = Number(searchParams.get("passengers") ?? 1);

  useEffect(() => {
    setLoading(true);
    setError("");
    setAirlineFilter(new Set());
    setStopsFilter("any");
    searchFlights({ origin, destination, date, returnDate, passengers }).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        setAllOffers([]);
        return;
      }
      setAllOffers(result.offers);
    });
  }, [origin, destination, date, returnDate, passengers]);

  const airlines = useMemo(
    () => Array.from(new Set(allOffers.map((o) => o.owner.name ?? "Unknown"))).sort(),
    [allOffers],
  );

  const offers = useMemo(() => {
    let list = allOffers;
    if (stopsFilter === "nonstop") list = list.filter((o) => maxStops(o) === 0);
    if (stopsFilter === "1stop") list = list.filter((o) => maxStops(o) <= 1);
    if (airlineFilter.size > 0) list = list.filter((o) => airlineFilter.has(o.owner.name ?? "Unknown"));

    const sorted = [...list];
    if (sortKey === "price") sorted.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
    if (sortKey === "duration") sorted.sort((a, b) => totalDurationMinutes(a) - totalDurationMinutes(b));
    if (sortKey === "departure") {
      sorted.sort((a, b) => (a.slices[0]?.departingAt ?? "").localeCompare(b.slices[0]?.departingAt ?? ""));
    }
    return sorted;
  }, [allOffers, stopsFilter, airlineFilter, sortKey]);

  function toggleAirline(name: string) {
    setAirlineFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const alertParams = new URLSearchParams({ origin, destination, date });
  if (returnDate) alertParams.set("returnDate", returnDate);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <SearchForm
          initial={{
            origin,
            originLabel: origin,
            destination,
            destinationLabel: destination,
            date,
            returnDate,
            passengers,
            tripType: returnDate ? "roundtrip" : "oneway",
          }}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Globe2 className="h-5 w-5 text-ink-900/50" />
        <h2 className="text-xl font-bold text-ink-950">
          {origin} &rarr; {destination}
          {returnDate && <span className="text-ink-900/50"> &middot; round trip</span>}
        </h2>
        {!loading && <span className="text-sm text-ink-900/60">{offers.length} of {allOffers.length} offers</span>}
        <Link
          to={`/alerts?${alertParams.toString()}`}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-1.5 text-xs font-bold text-coral-600 transition hover:bg-coral-500/20"
        >
          <Bell className="h-3.5 w-3.5" />
          Set a price alert
        </Link>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {!loading && !error && allOffers.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink-900/15 py-16 text-center text-ink-900/60">
          <SearchX className="h-8 w-8" />
          <p className="font-semibold text-ink-950">No offers found for this route/date</p>
          <p className="text-sm">Try a different date, or double-check the route.</p>
        </div>
      )}

      {!loading && allOffers.length > 0 && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-900/60">Stops</h3>
              <div className="flex flex-col gap-1.5">
                {([
                  ["any", "Any"],
                  ["nonstop", "Nonstop only"],
                  ["1stop", "1 stop or fewer"],
                ] as [StopsFilter, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setStopsFilter(key)}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      stopsFilter === key ? "bg-ink-950 text-white" : "bg-white text-ink-900/70 hover:bg-ink-950/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-900/60">Airlines</h3>
              <div className="flex flex-col gap-1.5">
                {airlines.map((name) => (
                  <label key={name} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-900/80 hover:bg-white">
                    <input
                      type="checkbox"
                      checked={airlineFilter.has(name)}
                      onChange={() => toggleAirline(name)}
                      className="h-3.5 w-3.5 accent-pine-600"
                    />
                    {name}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm font-medium text-ink-900 focus:border-pine-500 focus:outline-none"
              >
                <option value="price">Sort: Cheapest first</option>
                <option value="duration">Sort: Shortest first</option>
                <option value="departure">Sort: Earliest departure</option>
              </select>
            </div>

            {offers.length === 0 && (
              <p className="rounded-xl border border-dashed border-ink-900/15 py-10 text-center text-sm text-ink-900/60">
                No offers match these filters.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col gap-4 rounded-xl border border-ink-900/10 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/60">{offer.owner.name}</p>
                    {offer.slices.map((slice, i) => (
                      <div key={i} className="mt-1 flex flex-wrap items-center gap-3">
                        <p className="text-lg font-bold text-ink-950">
                          {formatTime(slice.departingAt ?? "")} {slice.origin} &rarr; {formatTime(slice.arrivingAt ?? "")}{" "}
                          {slice.destination}
                        </p>
                        <span className="text-xs text-ink-900/50">
                          {formatIsoDuration(slice.duration)} &middot;{" "}
                          {slice.stops === 0 ? "Nonstop" : `${slice.stops} stop${slice.stops > 1 ? "s" : ""}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                    <p className="text-2xl font-extrabold text-ink-950">{formatMoney(offer.totalAmount, offer.totalCurrency)}</p>
                    <Link
                      to={`/redirect/${offer.id}`}
                      className="shrink-0 rounded-lg bg-ink-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
                    >
                      View deal &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
