import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Info } from "lucide-react";
import { getOffer } from "../lib/api";
import type { OfferSummary } from "../lib/types";
import { formatDate, formatIsoDuration, formatMoney, formatTime } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Redirect() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<OfferSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!offerId) return;
    getOffer(offerId).then((found) => {
      setOffer(found ?? null);
      setLoading(false);
    });
  }, [offerId]);

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
    </div>
  );
}
