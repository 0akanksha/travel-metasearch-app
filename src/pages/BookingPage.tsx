import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createOrder, getOffer } from "../lib/api";
import type { OfferDetail, PassengerInput } from "../lib/types";
import { formatDate, formatIsoDuration, formatMoney, formatTime } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";

const TITLES = ["mr", "mrs", "ms", "miss", "dr"];

function emptyPassenger(): PassengerInput {
  return { title: "mr", gender: "m", givenName: "", familyName: "", bornOn: "", email: "", phoneNumber: "" };
}

export default function BookingPage() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [passengers, setPassengers] = useState<PassengerInput[]>([]);

  useEffect(() => {
    if (!offerId) return;
    getOffer(offerId).then((found) => {
      setOffer(found ?? null);
      if (found) setPassengers(found.passengers.map(() => emptyPassenger()));
      setLoading(false);
    });
  }, [offerId]);

  function updatePassenger(index: number, patch: Partial<PassengerInput>) {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offerId) return;
    setError("");
    setSubmitting(true);
    const result = await createOrder(offerId, passengers);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/booking/success", { state: { order: result.order } });
  }

  if (loading) return <LoadingSpinner />;

  if (!offer) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Offer not found or expired</p>
        <p className="mt-1 text-sm text-ink-900/70">Fares expire quickly — try searching again.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-pine-600 underline">
          Back to search
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-ink-950">Passenger details</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {passengers.map((p, i) => (
            <fieldset key={i} className="flex flex-col gap-4 rounded-xl border border-ink-900/10 bg-white p-6">
              <legend className="px-1 text-sm font-bold text-ink-950">Passenger {i + 1}</legend>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Title</span>
                  <select
                    value={p.title}
                    onChange={(e) => updatePassenger(i, { title: e.target.value })}
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  >
                    {TITLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Gender</span>
                  <select
                    value={p.gender}
                    onChange={(e) => updatePassenger(i, { gender: e.target.value as "m" | "f" })}
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Date of birth</span>
                  <input
                    required
                    type="date"
                    value={p.bornOn}
                    onChange={(e) => updatePassenger(i, { bornOn: e.target.value })}
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Given name</span>
                  <input
                    required
                    value={p.givenName}
                    onChange={(e) => updatePassenger(i, { givenName: e.target.value })}
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Family name</span>
                  <input
                    required
                    value={p.familyName}
                    onChange={(e) => updatePassenger(i, { familyName: e.target.value })}
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Email</span>
                  <input
                    required
                    type="email"
                    value={p.email}
                    onChange={(e) => updatePassenger(i, { email: e.target.value })}
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Phone</span>
                  <input
                    required
                    type="tel"
                    value={p.phoneNumber}
                    onChange={(e) => updatePassenger(i, { phoneNumber: e.target.value })}
                    placeholder="+442080160509"
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                  />
                </label>
              </div>
            </fieldset>
          ))}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-3 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Booking (test mode)…" : `Book with test balance — ${formatMoney(offer.totalAmount, offer.totalCurrency)}`}
          </button>
        </form>
      </div>

      <aside className="h-fit rounded-xl border border-ink-900/10 bg-white p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">{offer.owner.name}</p>
        {offer.slices.map((slice, i) => (
          <div key={i} className="mb-4 border-b border-ink-900/10 pb-4 last:mb-0 last:border-0 last:pb-0">
            <h2 className="text-lg font-bold text-ink-950">
              {slice.origin} &rarr; {slice.destination}
            </h2>
            <p className="text-sm text-ink-900/70">{formatDate(slice.departingAt ?? "")}</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-ink-950">{formatTime(slice.departingAt ?? "")}</p>
                <p className="text-ink-900/60">{slice.origin}</p>
              </div>
              <div className="text-xs text-ink-900/50">{formatIsoDuration(slice.duration)}</div>
              <div className="text-right">
                <p className="font-bold text-ink-950">{formatTime(slice.arrivingAt ?? "")}</p>
                <p className="text-ink-900/60">{slice.destination}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-ink-900/10 pt-2 text-base font-bold text-ink-950">
          <span>Total</span>
          <span>{formatMoney(offer.totalAmount, offer.totalCurrency)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-900/50">Test mode — no real charge is made.</p>
      </aside>
    </div>
  );
}
