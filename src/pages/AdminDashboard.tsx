import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminListAlerts, adminRecheckAlerts } from "../lib/api";
import type { PriceAlert } from "../lib/types";
import { formatDate, formatMoney } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rechecking, setRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState("");

  useEffect(() => {
    adminListAlerts()
      .then(setAlerts)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load alerts"))
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
          <p className="text-sm text-ink-900/60">Price alerts saved by travelers.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-ink-900/15 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-950/5"
        >
          Sign out
        </button>
      </div>

      <div className="mb-4 flex items-center justify-end gap-3">
        {recheckMessage && <span className="text-xs text-ink-900/60">{recheckMessage}</span>}
        <button
          onClick={handleRecheck}
          disabled={rechecking}
          className="rounded-lg border border-ink-900/15 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:bg-ink-950/5 disabled:opacity-60"
        >
          {rechecking ? "Rechecking…" : "Recheck prices now"}
        </button>
      </div>

      {loading && <p className="text-sm text-ink-900/50">Loading&hellip;</p>}
      {!loading && error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {!loading && !error && (
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
      )}
    </div>
  );
}
