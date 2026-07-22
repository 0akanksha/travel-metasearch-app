import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MapPin } from "lucide-react";
import { CONTINENTS, FAMOUS_DESTINATIONS } from "../lib/famousDestinations";

type ContinentFilter = "All" | (typeof CONTINENTS)[number];

export default function Explore() {
  const navigate = useNavigate();
  const [continent, setContinent] = useState<ContinentFilter>("All");

  const destinations = useMemo(
    () => (continent === "All" ? FAMOUS_DESTINATIONS : FAMOUS_DESTINATIONS.filter((d) => d.continent === continent)),
    [continent],
  );

  function planTripHere(searchQuery: string) {
    navigate(`/trip?destinationQuery=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-16 pt-16 text-white sm:pt-24">
        <Compass className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Need inspiration?
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Explore <span className="text-coral-400">the world.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Famous places worth building a trip around — pick one to start planning.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          {(["All", ...CONTINENTS] as ContinentFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setContinent(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                continent === c ? "bg-ink-950 text-white" : "bg-ink-950/5 text-ink-900/60 hover:bg-ink-950/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <div
              key={d.id}
              className="flex flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video w-full bg-ink-950/5">
                <img src={d.imageUrl} alt={d.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div>
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                    <MapPin className="h-3.5 w-3.5" /> {d.country}
                  </p>
                  <h2 className="text-lg font-bold text-ink-950">{d.name}</h2>
                </div>
                <p className="text-sm text-ink-900/70">{d.blurb}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.highlights.map((h) => (
                    <span key={h} className="rounded-full bg-ink-950/5 px-2.5 py-1 text-[11px] font-medium text-ink-900/70">
                      {h}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => planTripHere(d.searchQuery)}
                  className="mt-auto self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-coral-500/30 transition hover:brightness-105"
                >
                  Plan a trip here
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
