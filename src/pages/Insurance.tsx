import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Plane, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { buyInsurancePolicy, createTrip, getInsuranceQuote, listInsurancePlans } from "../lib/api";
import type { InsurancePlan, InsuranceTraveler, TripSelection } from "../lib/types";
import { formatMoney } from "../lib/format";
import TripPicker from "../components/TripPicker";

const PERKS = [
  { icon: ShieldCheck, title: "Real trip pricing", desc: "Premiums computed from your actual dates and travelers, not a flat fee." },
  { icon: Plane, title: "Domestic or international", desc: "Cover a weekend trip at home or a month abroad." },
  { icon: CheckCircle2, title: "Three coverage tiers", desc: "Pick the sum insured and features that fit your trip." },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Insurance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [planId, setPlanId] = useState("standard");
  const [tripType, setTripType] = useState<"domestic" | "international">("international");
  const [destination, setDestination] = useState(searchParams.get("travelDestination") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("travelDate") ?? todayISO());
  const [endDate, setEndDate] = useState(searchParams.get("travelDate") ?? todayISO());
  const [travelers, setTravelers] = useState<InsuranceTraveler[]>([{ name: "", age: 30 }]);

  const [premiums, setPremiums] = useState<Record<string, number>>({});
  const [quoting, setQuoting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [tripSelection, setTripSelection] = useState<TripSelection>({ mode: "none" });

  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listInsurancePlans().then(setPlans);
  }, []);

  useEffect(() => {
    if (plans.length === 0 || !startDate || !endDate) return;
    const ages = travelers.map((t) => t.age);
    if (ages.some((a) => !a || a < 0)) return;

    setQuoting(true);
    const debounce = setTimeout(() => {
      Promise.all(
        plans.map((p) =>
          getInsuranceQuote({ planId: p.id, tripType, startDate, endDate, travelerAges: ages }).then((r) => [
            p.id,
            r.ok ? r.premiumInr : null,
          ]),
        ),
      ).then((results) => {
        setQuoting(false);
        setPremiums(Object.fromEntries(results.filter(([, v]) => v !== null)) as Record<string, number>);
      });
    }, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, tripType, startDate, endDate, JSON.stringify(travelers.map((t) => t.age))]);

  function updateTraveler(index: number, patch: Partial<InsuranceTraveler>) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTraveler() {
    if (travelers.length >= 6) return;
    setTravelers((prev) => [...prev, { name: "", age: 30 }]);
  }

  function removeTraveler(index: number) {
    setTravelers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBuying(true);

    let tripId: string | undefined;
    if (tripSelection.mode === "existing") {
      tripId = tripSelection.tripId;
    } else if (tripSelection.mode === "new") {
      const tripResult = await createTrip({ email, label: tripSelection.label });
      if (!tripResult.ok) {
        setBuying(false);
        setError(tripResult.error);
        return;
      }
      tripId = tripResult.trip.id;
    }

    const result = await buyInsurancePolicy({
      planId,
      tripType,
      destination: destination || undefined,
      startDate,
      endDate,
      travelers,
      guest: { name, email, phone },
      tripId,
    });
    setBuying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/insurance/confirmation/${result.policy.id}`, { state: { policy: result.policy } });
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-16 pt-16 text-white sm:pt-24">
        <ShieldCheck className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Before you go
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Get <span className="text-coral-400">travel insurance.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Priced off your actual trip — dates, destination, and travelers.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <form onSubmit={handleBuy} className="flex flex-col gap-6 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Trip details</h2>
            <div className="mb-4 flex gap-2">
              {(["domestic", "international"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold capitalize transition ${
                    tripType === t
                      ? "border-pine-500 bg-pine-500/10 text-pine-800"
                      : "border-ink-900/15 text-ink-800 hover:bg-ink-950/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">
                  Destination {tripType === "domestic" ? "(optional)" : ""}
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Tokyo"
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Start date</span>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">End date</span>
                <input
                  required
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-950">Travelers</h2>
              <button
                type="button"
                onClick={addTraveler}
                disabled={travelers.length >= 6}
                className="flex items-center gap-1 text-xs font-bold text-pine-700 hover:text-pine-800 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Add traveler
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {travelers.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_auto] items-end gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Name</span>
                    <input
                      required
                      value={t.name}
                      onChange={(e) => updateTraveler(i, { name: e.target.value })}
                      className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Age</span>
                    <input
                      required
                      type="number"
                      min="0"
                      max="120"
                      value={t.age}
                      onChange={(e) => updateTraveler(i, { age: Number(e.target.value) })}
                      className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                    />
                  </label>
                  {travelers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTraveler(i)}
                      aria-label="Remove traveler"
                      className="rounded-lg p-2.5 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Coverage plan</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition ${
                    planId === p.id ? "border-pine-500 bg-pine-500/10" : "border-ink-900/15 hover:bg-ink-950/5"
                  }`}
                >
                  <p className="font-bold text-ink-950">{p.label}</p>
                  <p className="text-xs text-ink-900/60">Sum insured ${p.sumInsuredUsd.toLocaleString()}</p>
                  <p className="text-lg font-extrabold text-ink-950">
                    {quoting || premiums[p.id] === undefined ? "…" : formatMoney(premiums[p.id], "INR")}
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-ink-900/70">
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f}>&bull; {f}</li>
                    ))}
                  </ul>
                </button>
              ))}
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
            disabled={buying || premiums[planId] === undefined}
            className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {buying ? "Buying…" : `Buy for ${premiums[planId] !== undefined ? formatMoney(premiums[planId], "INR") : "..."}`}
          </button>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </form>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
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
