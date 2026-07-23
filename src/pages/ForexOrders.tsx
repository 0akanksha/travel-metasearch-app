import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Search, Trash2 } from "lucide-react";
import { cancelForexOrder, getForexOrdersByEmail } from "../lib/api";
import type { ForexOrder } from "../lib/types";
import { formatMoney } from "../lib/format";

export default function ForexOrders() {
  const [searchParams] = useSearchParams();
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [orders, setOrders] = useState<ForexOrder[] | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setOrders(await getForexOrdersByEmail(lookupEmail));
  }

  async function handleCancel(order: ForexOrder) {
    const ok = await cancelForexOrder(order.id, order.cancelToken);
    if (ok) setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)) ?? null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <CreditCard className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">Forex orders</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Manage your forex card orders</h1>
      <p className="mb-8 text-sm text-ink-900/60">No account needed — look up orders with the email you ordered with.</p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6">
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

        {orders !== null && orders.length === 0 && <p className="text-sm text-ink-900/60">No orders found for that email.</p>}

        <div className="flex flex-col gap-3">
          {orders?.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/10 p-4">
              <div>
                <p className="font-semibold text-ink-950">
                  {order.toCurrency} {order.amountForeign.toLocaleString()}
                  {order.status === "cancelled" && <span className="ml-2 text-xs font-normal text-red-600">Cancelled</span>}
                </p>
                <p className="text-xs text-ink-900/60">
                  {formatMoney(order.amountInr, "INR")} &middot; {order.deliveryCity} &middot; {order.orderReference}
                </p>
              </div>
              {order.status !== "cancelled" && (
                <button
                  onClick={() => handleCancel(order)}
                  aria-label="Cancel order"
                  className="shrink-0 rounded-lg p-2 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
