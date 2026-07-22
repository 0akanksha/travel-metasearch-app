import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BedDouble, SearchX, Star } from "lucide-react";
import { searchHotels } from "../lib/api";
import type { HotelSummary } from "../lib/types";
import { formatMoney } from "../lib/format";
import HotelSearchForm from "../components/HotelSearchForm";
import LoadingSpinner from "../components/LoadingSpinner";

export default function HotelResults() {
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState<HotelSummary[]>([]);
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const regionId = searchParams.get("regionId") ?? "";
  const cityLabel = searchParams.get("cityLabel") ?? "";
  const checkInDate = searchParams.get("checkInDate") ?? "";
  const checkOutDate = searchParams.get("checkOutDate") ?? "";
  const guests = Number(searchParams.get("guests") ?? 2);

  useEffect(() => {
    setLoading(true);
    setError("");
    searchHotels({ regionId, cityLabel, checkInDate, checkOutDate, guests }).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        setHotels([]);
        return;
      }
      setSearchId(result.searchId);
      setHotels(result.hotels);
    });
  }, [regionId, cityLabel, checkInDate, checkOutDate, guests]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <HotelSearchForm initial={{ regionId, cityLabel, checkInDate, checkOutDate, guests }} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-ink-950">
          Hotels in {cityLabel || "your destination"}
        </h2>
        {!loading && <span className="text-sm text-ink-900/60">{hotels.length} properties</span>}
        <Link
          to="/hotels/bookings"
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-1.5 text-xs font-bold text-coral-600 transition hover:bg-coral-500/20"
        >
          <BedDouble className="h-3.5 w-3.5" />
          Manage my bookings
        </Link>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {!loading && !error && hotels.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink-900/15 py-16 text-center text-ink-900/60">
          <SearchX className="h-8 w-8" />
          <p className="font-semibold text-ink-950">No hotels found</p>
          <p className="text-sm">Try a different destination or dates.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <Link
            key={hotel.id}
            to={`/hotels/${hotel.id}?searchId=${encodeURIComponent(searchId)}`}
            className="flex flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="aspect-video w-full bg-ink-950/5">
              {hotel.photoUrl && (
                <img src={hotel.photoUrl} alt={hotel.name} className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <p className="font-bold text-ink-950">{hotel.name}</p>
              {hotel.subtitle && <p className="text-xs text-ink-900/60">{hotel.subtitle}</p>}
              {hotel.rating !== null && (
                <p className="flex items-center gap-1 text-xs text-ink-900/70">
                  <Star className="h-3.5 w-3.5 fill-coral-500 text-coral-500" />
                  {hotel.rating.toFixed(1)} &middot; {hotel.reviewCount} review{hotel.reviewCount === 1 ? "" : "s"}
                </p>
              )}
              <div className="mt-auto pt-2 text-right">
                {hotel.price ? (
                  <p className="text-lg font-extrabold text-ink-950">{formatMoney(hotel.price.amount, hotel.price.currency)}</p>
                ) : (
                  <p className="text-sm text-ink-900/50">Price unavailable</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
