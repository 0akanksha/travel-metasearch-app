import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminListAlerts, adminListCabBookings, adminListHotelBookings, adminRecheckAlerts } from "../lib/api";
import type { CabBooking, HotelBooking, PriceAlert } from "../lib/types";
import { formatDate, formatMoney, formatShortDate } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [cabBookings, setCabBookings] = useState<CabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rechecking, setRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState("");

  useEffect(() => {
    Promise.all([adminListAlerts(), adminListHotelBookings(), adminListCabBookings()])
      .then(([a, h, c]) => {
        setAlerts(a);
        setHotelBookings(h);
        setCabBookings(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  async function handleRecheck() {
    setRechecking(true);
    setRecheckMessage("");
    try {
      const { checked } = await adminRecheckAlerts();
      setRecheckMessage(`Rechecked ${checked} alert${checked === 1 ? "" : "s"}.`);
      setAlerts(await adminListAlerts());
    } catch (err) {
      setRecheckMessage(err instanceof Error ? err.message : "Recheck failed");
    } finally {
      setRechecking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Admin dashboard</h1>
          <p className="text-sm text-ink-900/60">Price alerts, hotel bookings, and cab bookings from travelers.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-ink-900/15 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-950/5"
        >
          Sign out
        </button>
      </div>

      {loading && <p className="text-sm text-ink-900/50">Loading&hellip;</p>}
      {!loading && error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-10">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-950">Price alerts</h2>
              <div className="flex items-center gap-3">
                {recheckMessage && <span className="text-xs text-ink-900/60">{recheckMessage}</span>}
                <button
                  onClick={handleRecheck}
                  disabled={rechecking}
                  className="rounded-lg border border-ink-900/15 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:bg-ink-950/5 disabled:opacity-60"
                >
                  {rechecking ? "Rechecking…" : "Recheck prices now"}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Depart</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Last checked</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">{a.email}</td>
                      <td className="px-4 py-3">
                        {a.origin} &rarr; {a.destination}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(a.departureDate)}
                        {a.returnDate ? ` – ${formatDate(a.returnDate)}` : ""}
                      </td>
                      <td className="px-4 py-3">{a.targetPrice ? formatMoney(a.targetPrice, "USD") : "—"}</td>
                      <td className="px-4 py-3">{a.lastCheckedPrice !== null ? formatMoney(a.lastCheckedPrice, "USD") : "—"}</td>
                      <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
                    </tr>
                  ))}
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                        No price alerts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-950">Hotel bookings</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Hotel</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hotelBookings.map((b) => (
                    <tr key={b.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">
                        {b.guestName}
                        <div className="text-xs text-ink-900/50">{b.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        {b.hotelName}
                        <div className="text-xs text-ink-900/50">{b.cityLabel}</div>
                      </td>
                      <td className="px-4 py-3">
                        {formatShortDate(b.checkInDate)} – {formatShortDate(b.checkOutDate)}
                      </td>
                      <td className="px-4 py-3">{formatMoney(b.totalAmount, b.totalCurrency)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{b.bookingReference}</td>
                      <td className="px-4 py-3 capitalize">{b.status}</td>
                    </tr>
                  ))}
                  {hotelBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                        No hotel bookings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-950">Cab bookings</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Pickup</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Fare</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cabBookings.map((b) => (
                    <tr key={b.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">
                        {b.guestName}
                        <div className="text-xs text-ink-900/50">{b.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        {b.pickupLabel.split(",")[0]} &rarr; {b.dropoffLabel.split(",")[0]}
                      </td>
                      <td className="px-4 py-3">{formatDate(b.pickupTime)}</td>
                      <td className="px-4 py-3 capitalize">{b.cabType}</td>
                      <td className="px-4 py-3">{formatMoney(b.fare, b.currency)}</td>
                      <td className="px-4 py-3 capitalize">{b.status}</td>
                    </tr>
                  ))}
                  {cabBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                        No cab bookings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
