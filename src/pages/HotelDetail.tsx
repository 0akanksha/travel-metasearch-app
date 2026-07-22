import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { bookHotel, getHotel } from "../lib/api";
import type { HotelDetail as HotelDetailType } from "../lib/types";
import { formatMoney, formatShortDate } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";

export default function HotelDetail() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const searchId = searchParams.get("searchId") ?? "";
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<HotelDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) return;
    getHotel(hotelId, searchId).then((found) => {
      setHotel(found ?? null);
      setLoading(false);
    });
  }, [hotelId, searchId]);

  if (loading) return <LoadingSpinner />;

  if (!hotel) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Hotel not found or search expired</p>
        <p className="mt-1 text-sm text-ink-900/70">Try searching again.</p>
        <button onClick={() => navigate("/hotels")} className="mt-4 text-pine-600 underline">
          Back to hotel search
        </button>
      </div>
    );
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!hotel || !hotel.price) return;
    setError("");
    setBooking(true);
    const result = await bookHotel({
      hotelId: hotel.id,
      hotelName: hotel.name,
      cityLabel: hotel.cityLabel,
      price: hotel.price.amount,
      currency: hotel.price.currency,
      checkInDate: hotel.checkInDate,
      checkOutDate: hotel.checkOutDate,
      guests: hotel.guests,
      guest: { name, email },
    });
    setBooking(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/hotels/confirmation/${result.booking.id}`, { state: { booking: result.booking } });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {hotel.photos.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
          {hotel.photos.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" className="h-40 w-full object-cover" loading="lazy" />
          ))}
        </div>
      )}

      <h1 className="text-2xl font-bold text-ink-950">{hotel.name}</h1>
      {hotel.subtitle && <p className="mt-1 text-sm text-ink-900/70">{hotel.subtitle}</p>}
      {hotel.rating !== null && (
        <p className="mt-2 flex items-center gap-1 text-sm text-ink-900/70">
          <Star className="h-4 w-4 fill-coral-500 text-coral-500" />
          {hotel.rating.toFixed(1)} &middot; {hotel.reviewCount} review{hotel.reviewCount === 1 ? "" : "s"}
        </p>
      )}

      {hotel.amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hotel.amenities.map((a) => (
            <span key={a} className="rounded-full bg-ink-950/5 px-3 py-1 text-xs font-medium text-ink-900/70">
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-ink-900/10 bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-ink-900/10 pb-4">
          <div>
            <p className="text-sm font-semibold text-ink-950">
              {formatShortDate(hotel.checkInDate)} &ndash; {formatShortDate(hotel.checkOutDate)}
            </p>
            <p className="text-xs text-ink-900/60">
              {hotel.guests} guest{hotel.guests === 1 ? "" : "s"}
            </p>
          </div>
          {hotel.price && (
            <p className="text-2xl font-extrabold text-ink-950">{formatMoney(hotel.price.amount, hotel.price.currency)}</p>
          )}
        </div>

        <form onSubmit={handleBook} className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink-950">Your details</h2>
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
          <button
            type="submit"
            disabled={booking || !hotel.price}
            className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {booking ? "Booking…" : "Confirm reservation"}
          </button>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
