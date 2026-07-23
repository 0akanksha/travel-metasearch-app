import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { ForexOrder } from "../lib/types";
import { formatMoney } from "../lib/format";

export default function ForexConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = (location.state as { order?: ForexOrder } | null)?.order;

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Order details not available here</p>
        <p className="mt-1 text-sm text-ink-900/70">
          Look up your order with your email on the "Manage orders" page instead.
        </p>
        <button onClick={() => navigate("/forex/orders")} className="mt-4 text-pine-600 underline">
          Manage forex orders
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-14 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-pine-600" />
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Forex card ordered</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Order <span className="font-mono font-semibold text-ink-900">{order.orderReference}</span> — a copy is looked
        up any time with your email.
      </p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <p className="text-lg font-bold text-ink-950">
          {order.toCurrency} {order.amountForeign.toLocaleString()}
        </p>
        <p className="text-sm text-ink-900/60">
          At {formatMoney(order.exchangeRate, "INR")}/{order.toCurrency} — {formatMoney(order.amountInr, "INR")} total
        </p>
        <div className="mt-4 border-t border-ink-900/10 pt-4 text-sm">
          <p className="font-semibold text-ink-950">Delivering to</p>
          <p className="text-ink-900/60">
            {order.deliveryAddress}, {order.deliveryCity} {order.deliveryPostalCode}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/forex")}
        className="mt-6 rounded-lg bg-ink-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Order another card
      </button>
    </div>
  );
}
