import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Globe2, MapPin } from "lucide-react";
import { getEverywhere } from "../lib/api";
import type { DestinationDeal } from "../lib/types";
import { formatMoney } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";
import PlaceAutocomplete from "../components/PlaceAutocomplete";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Everywhere() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const origin = searchParams.get("origin") ?? "";
  const date = searchParams.get("date") ?? todayISO();

  const [deals, setDeals] = useState<DestinationDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [promptOrigin, setPromptOrigin] = useState("");
  const [promptDate, setPromptDate] = useState(todayISO());

  useEffect(() => {
    if (!origin) return;
    setLoading(true);
    setError("");
    // Fans out one search per destination in a curated ~40-50 airport list
    // server-side — there's no live "every destination" data source.
    getEverywhere(origin, date).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        setDeals([]);
        return;
      }
      setDeals(result.destinations);
    });
  }, [origin, date]);

  if (!origin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-14">
        <div className="mb-2 flex items-center gap-2 text-ink-900/60">
          <Globe2 className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-wide">Everywhere</p>
        </div>
        <h1 className="mb-1 text-2xl font-bold text-ink-950">Where are you flying from?</h1>
        <p className="mb-6 text-sm text-ink-900/60">Pick an origin to see the cheapest destinations right now.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!promptOrigin) return;
            navigate(`/everywhere?origin=${promptOrigin}&date=${promptDate}`);
          }}
          className="flex flex-col gap-4 rounded-xl border border-ink-900/10 bg-white p-6"
        >
          <PlaceAutocomplete label="From" placeholder="City or airport" onSelect={(p) => setPromptOrigin(p.iataCode)} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Around this date</span>
            <input
              required
              type="date"
              value={promptDate}
              min={todayISO()}
              onChange={(e) => setPromptDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!promptOrigin}
            className="rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-50"
          >
            Explore destinations
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <Globe2 className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">Everywhere from {origin}</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Cheapest places to fly from {origin}</h1>
      <p className="mb-8 text-sm text-ink-900/60">
        Around {new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric" })} &middot; sorted by price
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      ) : deals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink-900/15 px-4 py-8 text-center text-sm text-ink-900/60">
          Couldn't find fares from {origin} right now — this route searches ~45 airports at once and can occasionally
          get rate-limited. Try again in a moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal, i) => (
            <Link
              key={deal.iataCode}
              to={`/search?origin=${origin}&destination=${deal.iataCode}&date=${date}&passengers=1`}
              className="group flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                    <MapPin className="h-3.5 w-3.5" />
                    {deal.countryName}
                  </p>
                  <h2 className="text-lg font-bold text-ink-950 group-hover:text-pine-700">{deal.cityName}</h2>
                </div>
                {i < 3 && (
                  <span className="shrink-0 rounded-full bg-coral-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-coral-600">
                    Great deal
                  </span>
                )}
              </div>
              <div className="mt-auto flex items-end justify-between">
                <span className="font-mono text-xs text-ink-900/50">{deal.iataCode}</span>
                <p className="text-xl font-extrabold text-ink-950">{formatMoney(deal.price, deal.currency)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
