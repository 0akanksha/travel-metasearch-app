import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Anchor, MapPin, Ship } from "lucide-react";
import { CRUISE_ITINERARIES, CRUISE_REGIONS } from "../lib/cruiseItineraries";

type RegionFilter = "All" | (typeof CRUISE_REGIONS)[number];

export default function Cruises() {
  const [region, setRegion] = useState<RegionFilter>("All");

  const itineraries = useMemo(
    () => (region === "All" ? CRUISE_ITINERARIES : CRUISE_ITINERARIES.filter((i) => i.region === region)),
    [region],
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-16 pt-16 text-white sm:pt-24">
        <Ship className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Set sail
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Find your <span className="text-coral-400">cruise.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">Real ships, real itineraries — pick a region and book a cabin.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          {(["All", ...CRUISE_REGIONS] as RegionFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                region === r ? "bg-ink-950 text-white" : "bg-ink-950/5 text-ink-900/60 hover:bg-ink-950/10"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((it) => {
            const fromPrice = Math.min(...it.cabinTiers.map((t) => t.pricePerPersonUsd));
            return (
              <Link
                key={it.id}
                to={`/cruises/${it.id}`}
                className="flex flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-video w-full bg-ink-950/5">
                  <img src={it.imageUrl} alt={it.shipName} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                    <MapPin className="h-3.5 w-3.5" /> {it.departurePort}
                  </p>
                  <h2 className="text-lg font-bold text-ink-950">{it.title}</h2>
                  <p className="text-sm text-ink-900/70">
                    {it.cruiseLine} &middot; {it.shipName}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-900/60">
                    <Anchor className="h-3.5 w-3.5" /> {it.nights} nights &middot; {it.ports.length} ports
                  </p>
                  <p className="mt-auto text-lg font-extrabold text-ink-950">
                    from ${fromPrice.toLocaleString()}
                    <span className="text-xs font-medium text-ink-900/50"> /person</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
