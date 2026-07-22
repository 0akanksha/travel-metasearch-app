import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Info, Plus } from "lucide-react";
import { createTrip, getOffer, saveFlightToTrip } from "../lib/api";
import type { OfferSummary, TripSelection } from "../lib/types";
import { formatDate, formatIsoDuration, formatMoney, formatTime } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";
import TripPicker from "../components/TripPicker";

export default function Redirect() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<OfferSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [savingOpen, setSavingOpen] = useState(false);
  const [saveEmail, setSaveEmail] = useState("");
  const [tripSelection, setTripSelection] = useState<TripSelection>({ mode: "none" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!offerId) return;
    getOffer(offerId).then((found) => {
      setOffer(found ?? null);
      setLoading(false);
    });
  }, [offerId]);

  async function handleSaveToTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!offer) return;
    setSaveError("");
    setSaving(true);

    let tripId: string | undefined;
    if (tripSelection.mode === "existing") {
      tripId = tripSelection.tripId;
    } else if (tripSelection.mode === "new") {
      const tripResult = await createTrip(saveEmail, tripSelection.label);
      if (!tripResult.ok) {
        setSaving(false);
        setSaveError(tripResult.error);
        return;
      }
      tripId = tripResult.trip.id;
    }
    if (!tripId) {
      setSaving(false);
      setSaveError("Pick or start a trip first.");
      return;
    }

    const firstSlice = offer.slices[0];
    const returnSlice = offer.slices[1];
    const result = await saveFlightToTrip(tripId, {
      email: saveEmail,
      origin: firstSlice?.origin ?? "",
      originLabel: firstSlice?.originName ?? firstSlice?.origin ?? "",
      destination: firstSlice?.destination ?? "",
      destinationLabel: firstSlice?.destinationName ?? firstSlice?.destination ?? "",
      departureDate: (firstSlice?.departingAt ?? "").slice(0, 10),
      returnDate: returnSlice?.departingAt ? returnSlice.departingAt.slice(0, 10) : undefined,
      ownerName: offer.owner.name ?? undefined,
      totalAmount: Number(offer.totalAmount),
      totalCurrency: offer.totalCurrency,
      redirectUrl: offer.redirectUrl,
      offerExpiresAt: offer.expiresAt,
    });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setSaved(true);
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
    <div className="mx-auto max-w-xl px-6 py-14">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-900/60">{offer.owner.name}</p>
      <h1 className="mb-6 text-2xl font-bold text-ink-950">Ready to book this fare</h1>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6">
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
          <span>Fare shown by FareCompass</span>
          <span>{formatMoney(offer.totalAmount, offer.totalCurrency)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2 rounded-lg bg-ink-950/[0.04] p-4 text-sm text-ink-900/70">
        <Info className="h-4 w-4 shrink-0 translate-y-0.5" />
        <p>
          FareCompass compares fares — it doesn't sell tickets. You'll complete booking and payment directly on{" "}
          {offer.owner.name ?? "the airline"}'s own site. Prices and availability can change between here and there.
        </p>
      </div>

      <a
        href={offer.redirectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-3 text-center font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105"
      >
        Continue to {offer.owner.name ?? "airline site"} <ExternalLink className="h-4 w-4" />
      </a>

      {/* Entirely optional and separate from the primary CTA above — booking
          on the airline's site never depends on anything here. */}
      <div className="mt-6 border-t border-ink-900/10 pt-6">
        {saved ? (
          <p className="text-sm font-medium text-pine-700">Saved to your trip.</p>
        ) : savingOpen ? (
          <form onSubmit={handleSaveToTrip} className="flex flex-col gap-3 rounded-lg border border-ink-900/10 bg-white p-4">
            <h2 className="text-sm font-bold text-ink-950">Save this flight to a trip</h2>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Your email</span>
              <input
                required
                type="email"
                value={saveEmail}
                onChange={(e) => setSaveEmail(e.target.value)}
                className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
              />
            </label>
            <TripPicker email={saveEmail} onChange={setTripSelection} />
            <button
              type="submit"
              disabled={saving || tripSelection.mode === "none"}
              className="self-start rounded-lg bg-ink-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save to trip"}
            </button>
            {saveError && <p className="text-sm font-medium text-red-600">{saveError}</p>}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSavingOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-pine-600 hover:text-pine-700"
          >
            <Plus className="h-3.5 w-3.5" /> Save this flight to a trip (optional)
          </button>
        )}
      </div>
    </div>
  );
}
