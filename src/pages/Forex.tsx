import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Banknote, CreditCard, Globe2, ShieldCheck } from "lucide-react";
import { createTrip, getForexRate, listForexCurrencies, orderForexCard } from "../lib/api";
import type { ForexCurrency, TripSelection } from "../lib/types";
import { formatMoney } from "../lib/format";
import TripPicker from "../components/TripPicker";

const PERKS = [
  { icon: Globe2, title: "15 currencies", desc: "Load the currency you actually need for your destination." },
  { icon: Banknote, title: "Real exchange rates", desc: "Priced off live rates, not a made-up markup." },
  { icon: CreditCard, title: "Use it like a debit card", desc: "Swipe, tap, or withdraw abroad on a locked-in rate." },
  { icon: ShieldCheck, title: "Manage anytime", desc: "Look up or cancel your order later with your email, no login." },
];

export default function Forex() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currencies, setCurrencies] = useState<ForexCurrency[]>([]);
  const [toCurrency, setToCurrency] = useState("USD");
  const [amountForeign, setAmountForeign] = useState("500");
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const [travelDestination, setTravelDestination] = useState(searchParams.get("travelDestination") ?? "");
  const [travelDate, setTravelDate] = useState(searchParams.get("travelDate") ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [tripSelection, setTripSelection] = useState<TripSelection>({ mode: "none" });

  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listForexCurrencies().then(setCurrencies);
  }, []);

  useEffect(() => {
    if (!toCurrency) return;
    setRateLoading(true);
    const debounce = setTimeout(() => {
      getForexRate(toCurrency).then((result) => {
        setRateLoading(false);
        if (result.ok) setRate(result.rate);
      });
    }, 200);
    return () => clearTimeout(debounce);
  }, [toCurrency]);

  const amountInr = rate !== null ? Number(amountForeign || 0) * rate : null;

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrdering(true);

    let tripId: string | undefined;
    if (tripSelection.mode === "existing") {
      tripId = tripSelection.tripId;
    } else if (tripSelection.mode === "new") {
      const tripResult = await createTrip({ email, label: tripSelection.label });
      if (!tripResult.ok) {
        setOrdering(false);
        setError(tripResult.error);
        return;
      }
      tripId = tripResult.trip.id;
    }

    const result = await orderForexCard({
      toCurrency,
      amountForeign: Number(amountForeign),
      travelDestination: travelDestination || undefined,
      travelDate: travelDate || undefined,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      guest: { name, email, phone },
      tripId,
    });
    setOrdering(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/forex/confirmation/${result.order.id}`, { state: { order: result.order } });
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-16 pt-16 text-white sm:pt-24">
        <CreditCard className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Before you go
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Get a <span className="text-coral-400">forex card.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Load foreign currency at today's real rate, delivered before you fly.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <form onSubmit={handleOrder} className="flex flex-col gap-6 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Currency &amp; amount</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Currency</span>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">
                  Amount to load ({toCurrency})
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  value={amountForeign}
                  onChange={(e) => setAmountForeign(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
            </div>
            <p className="mt-3 rounded-lg bg-pine-500/10 px-4 py-3 text-sm text-pine-800">
              {rateLoading || rate === null
                ? "Loading today's rate…"
                : `Load ${toCurrency} ${amountForeign || 0} — about ${formatMoney(amountInr ?? 0, "INR")} at today's rate of ${formatMoney(rate, "INR")}/${toCurrency}`}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Trip details (optional)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Travel destination</span>
                <input
                  value={travelDestination}
                  onChange={(e) => setTravelDestination(e.target.value)}
                  placeholder="e.g. Tokyo"
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Travel date</span>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Address</span>
                <input
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">City</span>
                <input
                  required
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Postal code</span>
                <input
                  required
                  value={deliveryPostalCode}
                  onChange={(e) => setDeliveryPostalCode(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Full name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Phone</span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <TripPicker email={email} onChange={setTripSelection} />

          <button
            type="submit"
            disabled={ordering || rate === null}
            className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {ordering ? "Placing order…" : "Order forex card"}
          </button>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </form>
      </div>

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
