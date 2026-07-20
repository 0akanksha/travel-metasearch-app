import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, CheckCircle2, Search, Trash2 } from "lucide-react";
import { createAlert, deleteAlert, getAlertsByEmail } from "../lib/api";
import type { PriceAlert } from "../lib/types";
import { formatDate, formatMoney } from "../lib/format";
import PlaceAutocomplete from "../components/PlaceAutocomplete";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Alerts() {
  const [searchParams] = useSearchParams();
  const originParam = searchParams.get("origin") ?? "";
  const destinationParam = searchParams.get("destination") ?? "";

  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState(originParam);
  const [originLabel, setOriginLabel] = useState(originParam);
  const [destination, setDestination] = useState(destinationParam);
  const [destinationLabel, setDestinationLabel] = useState(destinationParam);
  const [departureDate, setDepartureDate] = useState(searchParams.get("date") ?? todayISO());
  const [returnDate, setReturnDate] = useState(searchParams.get("returnDate") ?? "");
  const [targetPrice, setTargetPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [created, setCreated] = useState(false);

  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [alerts, setAlerts] = useState<PriceAlert[] | null>(null);
  const [unsubscribed, setUnsubscribed] = useState(false);

  // Both links in alert emails (lib/email.ts) land here: `?email=` from
  // "Manage your alerts" runs the lookup automatically, and
  // `?unsubscribe=<id>&token=<token>` deletes that one alert on load.
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      getAlertsByEmail(emailParam).then(setAlerts);
    }

    const unsubscribeId = searchParams.get("unsubscribe");
    const token = searchParams.get("token");
    if (unsubscribeId && token) {
      deleteAlert(unsubscribeId, token).then((ok) => {
        if (ok) {
          setUnsubscribed(true);
          setAlerts((prev) => prev?.filter((a) => a.id !== unsubscribeId) ?? null);
        }
      });
    }
    // Intentionally runs once, off whatever the page was loaded with — not
    // on every keystroke in the lookup input below.
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
    setCreateError("");
    setCreating(true);
    const result = await createAlert({
      email,
      origin,
      originLabel,
      destination,
      destinationLabel,
      departureDate,
      returnDate: returnDate || undefined,
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
    });
    setCreating(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setCreated(true);
    if (lookupEmail.toLowerCase() === email.toLowerCase()) {
      setAlerts(await getAlertsByEmail(email));
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setAlerts(await getAlertsByEmail(lookupEmail));
  }

  async function handleDelete(alert: PriceAlert) {
    const ok = await deleteAlert(alert.id, alert.unsubscribeToken);
    if (ok) setAlerts((prev) => prev?.filter((a) => a.id !== alert.id) ?? null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <Bell className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">Price alerts</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Get notified when a fare drops</h1>
      <p className="mb-8 text-sm text-ink-900/60">
        No account needed — just an email. We'll email you if the price drops (checked periodically).
      </p>

      {unsubscribed && (
        <p className="mb-6 flex items-center gap-2 rounded-lg bg-pine-500/10 px-4 py-3 text-sm font-medium text-pine-700">
          <CheckCircle2 className="h-4 w-4" /> You've been unsubscribed from that alert.
        </p>
      )}

      <form onSubmit={handleCreate} className="mb-10 flex flex-col gap-4 rounded-xl border border-ink-900/10 bg-white p-6">
        <h2 className="text-sm font-bold text-ink-950">Create an alert</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <PlaceAutocomplete
            label="From"
            placeholder="City or airport"
            initialLabel={origin}
            onSelect={(p) => {
              setOrigin(p.iataCode);
              setOriginLabel(p.label);
            }}
          />
          <PlaceAutocomplete
            label="To"
            placeholder="City or airport"
            initialLabel={destination}
            onSelect={(p) => {
              setDestination(p.iataCode);
              setDestinationLabel(p.label);
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Depart</span>
            <input
              required
              type="date"
              value={departureDate}
              min={todayISO()}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Return (optional)</span>
            <input
              type="date"
              value={returnDate}
              min={departureDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Target price (optional)</span>
            <input
              type="number"
              min={0}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 250"
              className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Your email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
        >
          {creating ? "Saving…" : "Create alert"}
        </button>
        {createError && <p className="text-sm font-medium text-red-600">{createError}</p>}
        {created && <p className="text-sm font-medium text-pine-700">Alert saved — we'll watch this route for you.</p>}
      </form>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold text-ink-950">View my alerts</h2>
        <form onSubmit={handleLookup} className="mb-4 flex gap-2">
          <input
            required
            type="email"
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            <Search className="h-4 w-4" /> Look up
          </button>
        </form>

        {alerts !== null && alerts.length === 0 && (
          <p className="text-sm text-ink-900/60">No alerts found for that email.</p>
        )}

        <div className="flex flex-col gap-3">
          {alerts?.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/10 p-4">
              <div>
                <p className="font-semibold text-ink-950">
                  {alert.originLabel} &rarr; {alert.destinationLabel}
                </p>
                <p className="text-xs text-ink-900/60">
                  {formatDate(alert.departureDate)}
                  {alert.returnDate ? ` – ${formatDate(alert.returnDate)}` : ""}
                  {alert.targetPrice ? ` · alert below ${formatMoney(alert.targetPrice, "USD")}` : ""}
                </p>
                {alert.lastCheckedPrice !== null && (
                  <p className="mt-1 text-xs text-ink-900/50">
                    Last checked: {formatMoney(alert.lastCheckedPrice, "USD")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(alert)}
                aria-label="Delete alert"
                className="shrink-0 rounded-lg p-2 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
