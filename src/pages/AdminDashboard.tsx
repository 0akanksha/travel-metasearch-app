import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminListAlerts,
  adminListCabBookings,
  adminListCruiseBookings,
  adminListForexOrders,
  adminListHotelBookings,
  adminListInsurancePolicies,
  adminListVisaApplications,
  adminRecheckAlerts,
} from "../lib/api";
import type {
  CabBooking,
  CruiseBooking,
  ForexOrder,
  HotelBooking,
  InsurancePolicy,
  PriceAlert,
  VisaApplication,
} from "../lib/types";
import { formatDate, formatMoney, formatShortDate } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [cabBookings, setCabBookings] = useState<CabBooking[]>([]);
  const [forexOrders, setForexOrders] = useState<ForexOrder[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [cruiseBookings, setCruiseBookings] = useState<CruiseBooking[]>([]);
  const [visaApplications, setVisaApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rechecking, setRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState("");

  useEffect(() => {
    Promise.all([
      adminListAlerts(),
      adminListHotelBookings(),
      adminListCabBookings(),
      adminListForexOrders(),
      adminListInsurancePolicies(),
      adminListCruiseBookings(),
      adminListVisaApplications(),
    ])
      .then(([a, h, c, f, i, cr, v]) => {
        setAlerts(a);
        setHotelBookings(h);
        setCabBookings(c);
        setForexOrders(f);
        setInsurancePolicies(i);
        setCruiseBookings(cr);
        setVisaApplications(v);
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
          <p className="text-sm text-ink-900/60">
            Price alerts, hotel bookings, cab bookings, forex orders, insurance policies, cruise bookings, and visa
            applications from travelers.
          </p>
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

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-950">Forex orders</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Currency &amp; amount</th>
                    <th className="px-4 py-3">INR total</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {forexOrders.map((o) => (
                    <tr key={o.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">
                        {o.guestName}
                        <div className="text-xs text-ink-900/50">{o.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        {o.toCurrency} {o.amountForeign.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{formatMoney(o.amountInr, "INR")}</td>
                      <td className="px-4 py-3">{o.deliveryCity}</td>
                      <td className="px-4 py-3 font-mono text-xs">{o.orderReference}</td>
                      <td className="px-4 py-3 capitalize">{o.status}</td>
                    </tr>
                  ))}
                  {forexOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                        No forex orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-950">Insurance policies</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Plan &amp; travelers</th>
                    <th className="px-4 py-3">Premium (INR)</th>
                    <th className="px-4 py-3">Trip dates</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {insurancePolicies.map((p) => (
                    <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">
                        {p.guestName}
                        <div className="text-xs text-ink-900/50">{p.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {p.planId} &middot; {p.travelers.length} traveler{p.travelers.length === 1 ? "" : "s"}
                      </td>
                      <td className="px-4 py-3">{formatMoney(p.premiumInr, "INR")}</td>
                      <td className="px-4 py-3">
                        {formatShortDate(p.startDate)} – {formatShortDate(p.endDate)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{p.policyReference}</td>
                      <td className="px-4 py-3 capitalize">{p.status}</td>
                    </tr>
                  ))}
                  {insurancePolicies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                        No insurance policies yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-950">Cruise bookings</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Ship &amp; itinerary</th>
                    <th className="px-4 py-3">Cabin</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Total (USD)</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cruiseBookings.map((b) => (
                    <tr key={b.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">
                        {b.guestName}
                        <div className="text-xs text-ink-900/50">{b.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        {b.shipName}
                        <div className="text-xs text-ink-900/50">{b.itineraryTitle}</div>
                      </td>
                      <td className="px-4 py-3">{b.cabinLabel}</td>
                      <td className="px-4 py-3">{b.guestCount}</td>
                      <td className="px-4 py-3">{formatMoney(b.totalUsd, "USD")}</td>
                      <td className="px-4 py-3 font-mono text-xs">{b.bookingReference}</td>
                      <td className="px-4 py-3 capitalize">{b.status}</td>
                    </tr>
                  ))}
                  {cruiseBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-900/50">
                        No cruise bookings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-950">Visa applications</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Country &amp; type</th>
                    <th className="px-4 py-3">Applicants</th>
                    <th className="px-4 py-3">Total (INR)</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visaApplications.map((a) => (
                    <tr key={a.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="px-4 py-3">
                        {a.guestName}
                        <div className="text-xs text-ink-900/50">{a.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        {a.countryName}
                        <div className="text-xs text-ink-900/50">{a.visaType}</div>
                      </td>
                      <td className="px-4 py-3">{a.applicants.length}</td>
                      <td className="px-4 py-3">{formatMoney(a.totalFeeInr, "INR")}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.applicationReference}</td>
                      <td className="px-4 py-3 capitalize">{a.status}</td>
                    </tr>
                  ))}
                  {visaApplications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                        No visa applications yet.
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
