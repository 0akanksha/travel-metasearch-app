import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Stamp, Trash2 } from "lucide-react";
import { cancelVisaApplication, getVisaApplicationsByEmail } from "../lib/api";
import type { VisaApplication } from "../lib/types";
import { formatMoney } from "../lib/format";

export default function VisaApplications() {
  const [searchParams] = useSearchParams();
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") ?? "");
  const [applications, setApplications] = useState<VisaApplication[] | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setApplications(await getVisaApplicationsByEmail(lookupEmail));
  }

  async function handleWithdraw(application: VisaApplication) {
    const ok = await cancelVisaApplication(application.id, application.cancelToken);
    if (ok) setApplications((prev) => prev?.map((a) => (a.id === application.id ? { ...a, status: "cancelled" } : a)) ?? null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-ink-900/60">
        <Stamp className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-wide">Visa applications</p>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Manage your visa applications</h1>
      <p className="mb-8 text-sm text-ink-900/60">No account needed — look up applications with the email you applied with.</p>

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

        {applications !== null && applications.length === 0 && (
          <p className="text-sm text-ink-900/60">No applications found for that email.</p>
        )}

        <div className="flex flex-col gap-3">
          {applications?.map((application) => (
            <div key={application.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/10 p-4">
              <div>
                <p className="font-semibold text-ink-950">
                  {application.countryName} &middot; {application.visaType}
                  {application.status === "cancelled" && <span className="ml-2 text-xs font-normal text-red-600">Withdrawn</span>}
                  {application.status === "submitted" && (
                    <span className="ml-2 text-xs font-normal text-pine-700">Submitted</span>
                  )}
                </p>
                <p className="text-xs text-ink-900/60">
                  {application.applicants.length} applicant{application.applicants.length === 1 ? "" : "s"} &middot;{" "}
                  {formatMoney(application.totalFeeInr, "INR")} &middot; {application.applicationReference}
                </p>
              </div>
              {application.status !== "cancelled" && (
                <button
                  onClick={() => handleWithdraw(application)}
                  aria-label="Withdraw application"
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
