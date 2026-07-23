import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { InsurancePolicy } from "../lib/types";
import { formatMoney, formatShortDate } from "../lib/format";

export default function InsuranceConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const policy = (location.state as { policy?: InsurancePolicy } | null)?.policy;

  if (!policy) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Policy details not available here</p>
        <p className="mt-1 text-sm text-ink-900/70">
          Look up your policy with your email on the "Manage policies" page instead.
        </p>
        <button onClick={() => navigate("/insurance/policies")} className="mt-4 text-pine-600 underline">
          Manage insurance policies
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-14 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-pine-600" />
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Travel insurance purchased</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Policy <span className="font-mono font-semibold text-ink-900">{policy.policyReference}</span> — a copy is
        looked up any time with your email.
      </p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <p className="text-lg font-bold text-ink-950 capitalize">
          {policy.planId} plan &middot; {policy.tripType}
        </p>
        <p className="text-sm text-ink-900/60">
          {formatShortDate(policy.startDate)} – {formatShortDate(policy.endDate)}
          {policy.destination ? ` · ${policy.destination}` : ""}
        </p>
        <p className="mt-2 text-sm text-ink-900/60">
          Sum insured ${policy.sumInsuredUsd.toLocaleString()} &middot; {policy.travelers.length} traveler
          {policy.travelers.length === 1 ? "" : "s"}
        </p>
        <div className="mt-4 border-t border-ink-900/10 pt-4 text-sm">
          <p className="font-semibold text-ink-950">Premium paid</p>
          <p className="text-lg font-extrabold text-ink-950">{formatMoney(policy.premiumInr, "INR")}</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/insurance")}
        className="mt-6 rounded-lg bg-ink-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Buy another policy
      </button>
    </div>
  );
}
