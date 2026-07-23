import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck, Trash2 } from "lucide-react";
import { cancelInsurancePolicy, getInsurancePoliciesByEmail } from "../lib/api";
import type { InsurancePolicy } from "../lib/types";
import { formatMoney, formatShortDate } from "../lib/format";

export default function InsurancePolicies() {
  const [searchParams] = useSearchParams();
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [policies, setPolicies] = useState<InsurancePolicy[] | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setPolicies(await getInsurancePoliciesByEmail(lookupEmail));
  }

  async function handleCancel(policy: InsurancePolicy) {
    const ok = await cancelInsurancePolicy(policy.id, policy.cancelToken);
    if (ok) setPolicies((prev) => prev?.map((p) => (p.id === policy.id ? { ...p, status: "cancelled" } : p)) ?? null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <ShieldCheck className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">Travel insurance</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Manage your insurance policies</h1>
      <p className="mb-8 text-sm text-ink-900/60">No account needed — look up policies with the email you bought with.</p>

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

        {policies !== null && policies.length === 0 && <p className="text-sm text-ink-900/60">No policies found for that email.</p>}

        <div className="flex flex-col gap-3">
          {policies?.map((policy) => (
            <div key={policy.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/10 p-4">
              <div>
                <p className="font-semibold capitalize text-ink-950">
                  {policy.planId} plan &middot; {policy.tripType}
                  {policy.status === "cancelled" && <span className="ml-2 text-xs font-normal text-red-600">Cancelled</span>}
                </p>
                <p className="text-xs text-ink-900/60">
                  {formatShortDate(policy.startDate)} – {formatShortDate(policy.endDate)} &middot; {formatMoney(policy.premiumInr, "INR")}{" "}
                  &middot; {policy.policyReference}
                </p>
              </div>
              {policy.status !== "cancelled" && (
                <button
                  onClick={() => handleCancel(policy)}
                  aria-label="Cancel policy"
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
