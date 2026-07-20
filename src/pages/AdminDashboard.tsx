import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminListAlerts, adminListOrders, adminRecheckAlerts } from "../lib/api";
import type { BookingOrder, PriceAlert } from "../lib/types";
import { formatDate, formatMoney, formatTime } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";

type Tab = "bookings" | "alerts";

function BookingsTable({ orders }: { orders: BookingOrder[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-900/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-900/50">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Passenger</th>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Departs</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Booked</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-ink-900/5 last:border-0">
              <td className="px-4 py-3 font-mono font-semibold text-ink-950">{o.bookingReference}</td>
              <td className="px-4 py-3">
                {o.passengers.map((p) => `${p.givenName} ${p.familyName}`).join(", ")}
                <div className="text-xs text-ink-900/50">{o.passengers[0]?.email}</div>
              </td>
              <td className="px-4 py-3">{o.slices.map((s) => `${s.origin} → ${s.destination}`).join(" · ")}</td>
              <td className="px-4 py-3">
                {o.slices[0]?.departingAt && (
                  <>
                    {formatDate(o.slices[0].departingAt)}, {formatTime(o.slices[0].departingAt)}
                  </>
                )}
              </td>
              <td className="px-4 py-3">{formatMoney(o.totalAmount, o.totalCurrency)}</td>
              <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-ink-900/50">
                No bookings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTable({ alerts }: { alerts: PriceAlert[] }) {
  return (
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
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>("bookings");
  const [orders, setOrders] = useState<BookingOrder[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rechecking, setRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState("");

  useEffect(() => {
    Promise.all([adminListOrders(), adminListAlerts()])
      .then(([o, a]) => {
        setOrders(o);
        setAlerts(a);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load admin data"))
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
          <p className="text-sm text-ink-900/60">Bookings and price alerts, all in one place.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-ink-900/15 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-950/5"
        >
          Sign out
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {(["bookings", "alerts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                tab === t ? "bg-ink-950 text-white" : "bg-ink-950/5 text-ink-900/60 hover:bg-ink-950/10"
              }`}
            >
              {t === "bookings" ? `Bookings (${orders.length})` : `Alerts (${alerts.length})`}
            </button>
          ))}
        </div>
        {tab === "alerts" && (
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
        )}
      </div>

      {loading && <p className="text-sm text-ink-900/50">Loading&hellip;</p>}
      {!loading && error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {!loading && !error && (tab === "bookings" ? <BookingsTable orders={orders} /> : <AlertsTable alerts={alerts} />)}
    </div>
  );
}
