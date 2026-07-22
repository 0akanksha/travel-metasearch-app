import { BedDouble, MapPinned, ShieldCheck, Star } from "lucide-react";
import HotelSearchForm from "../components/HotelSearchForm";

const PERKS = [
  { icon: MapPinned, title: "Search any destination", desc: "City, neighborhood, or landmark — find hotels wherever you're headed." },
  { icon: Star, title: "Real guest ratings", desc: "See genuine review scores and photos before you book, not marketing copy." },
  { icon: BedDouble, title: "Book in a few taps", desc: "No account needed — reserve with just your name and email." },
  { icon: ShieldCheck, title: "Manage anytime", desc: "Look up or cancel your reservation later with your email, no login." },
];

export default function Hotels() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-28 pt-16 text-white sm:pt-24">
        <BedDouble className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Find your stay
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            A place to <span className="text-coral-400">rest up.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Search real hotels, real prices, real reviews — then book straight through FareCompass.
          </p>
        </div>
        <div className="relative mx-auto mt-10 max-w-5xl px-4 sm:px-6">
          <HotelSearchForm />
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
