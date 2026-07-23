import { useLocation, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import type { VisaApplication } from "../lib/types";
import { formatMoney } from "../lib/format";

export default function VisaConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const application = (location.state as { application?: VisaApplication } | null)?.application;

  if (!application) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Application details not available here</p>
        <p className="mt-1 text-sm text-ink-900/70">
          Look up your application with your email on the "Manage applications" page instead.
        </p>
        <button onClick={() => navigate("/visas/applications")} className="mt-4 text-pine-600 underline">
          Manage visa applications
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-14 text-center">
      <Clock className="mx-auto mb-4 h-12 w-12 text-pine-600" />
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Application submitted</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Reference <span className="font-mono font-semibold text-ink-900">{application.applicationReference}</span> — a
        copy is looked up any time with your email.
      </p>

      <div className="rounded-xl border border-ink-900/10 bg-white p-6 text-left">
        <p className="text-lg font-bold text-ink-950">{application.countryName}</p>
        <p className="text-sm text-ink-900/60">
          {application.visaType} &middot; {application.applicants.length} applicant{application.applicants.length === 1 ? "" : "s"}
        </p>
        <div className="mt-4 border-t border-ink-900/10 pt-4 text-sm">
          <p className="font-semibold text-ink-950">Total paid</p>
          <p className="text-lg font-extrabold text-ink-950">{formatMoney(application.totalFeeInr, "INR")}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-900/50">
        Your application has been submitted for processing — it isn't approved yet. Track its status on the "Manage
        applications" page.
      </p>

      <button
        onClick={() => navigate("/visas")}
        className="mt-6 rounded-lg bg-ink-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Apply for another visa
      </button>
    </div>
  );
}
