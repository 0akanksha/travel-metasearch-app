import { useSearchParams } from "react-router-dom";
import { Bell, CalendarRange, Compass, Globe2 } from "lucide-react";
import SearchForm from "../components/SearchForm";

const PERKS = [
  { icon: Compass, title: "Compare across airlines", desc: "One search sweeps our full airline network so you see every fare, not just one carrier's." },
  { icon: CalendarRange, title: "Flexible date calendar", desc: "No fixed date? See the cheapest day to fly across a whole month at a glance." },
  { icon: Globe2, title: "Everywhere search", desc: "Only know your budget, not your destination? Browse the cheapest places to go right now." },
  { icon: Bell, title: "Price alerts", desc: "Save a route and we'll watch the fare for you — no account needed, just an email." },
];

export default function Home() {
  const [searchParams] = useSearchParams();
  // Carried through from a trip's "Search flights for this trip" CTA (see
  // TripDetail.tsx) — soft-prefill only, since flights use Duffel IATA
  // codes, a different namespace than a trip's saved destinationRegionId.
  const destinationLabel = searchParams.get("destinationLabel") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const email = searchParams.get("email") ?? undefined;

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-28 pt-16 text-white sm:pt-24">
        <Compass className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Find your cheapest way there
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Search, compare, <span className="text-coral-400">and go.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Search a specific route, browse a whole month of prices, or explore everywhere your budget can take you.
          </p>
        </div>
        <div className="relative mx-auto mt-10 max-w-5xl px-4 sm:px-6">
          <SearchForm initial={{ destinationLabel, date, returnDate, email }} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-ink-900/10 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-pine-500/15 text-pine-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink-950">{title}</h3>
              <p className="mt-1 text-sm text-ink-900/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
