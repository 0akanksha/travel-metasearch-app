import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { VISA_COUNTRIES } from "../lib/visaCountries";
import { applyForVisa, createTrip } from "../lib/api";
import type { TripSelection, VisaApplicant } from "../lib/types";
import { formatMoney } from "../lib/format";
import TripPicker from "../components/TripPicker";

export default function VisaDetail() {
  const { countryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const country = VISA_COUNTRIES.find((c) => c.id === countryId);

  const [travelDate, setTravelDate] = useState(searchParams.get("travelDate") ?? "");
  const [applicants, setApplicants] = useState<VisaApplicant[]>([{ name: "", passportNumber: "" }]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [tripSelection, setTripSelection] = useState<TripSelection>({ mode: "none" });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!country) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-lg font-semibold text-ink-950">Country not found</p>
        <button onClick={() => navigate("/visas")} className="mt-4 text-pine-600 underline">
          Back to visa services
        </button>
      </div>
    );
  }

  const feePerApplicant = country.govFeeInr + country.serviceFeeInr;
  const total = feePerApplicant * applicants.length;

  function updateApplicant(index: number, patch: Partial<VisaApplicant>) {
    setApplicants((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function addApplicant() {
    if (applicants.length >= 6) return;
    setApplicants((prev) => [...prev, { name: "", passportNumber: "" }]);
  }

  function removeApplicant(index: number) {
    setApplicants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!country) return;
    setError("");
    setSubmitting(true);

    let tripId: string | undefined;
    if (tripSelection.mode === "existing") {
      tripId = tripSelection.tripId;
    } else if (tripSelection.mode === "new") {
      const tripResult = await createTrip({ email, label: tripSelection.label });
      if (!tripResult.ok) {
        setSubmitting(false);
        setError(tripResult.error);
        return;
      }
      tripId = tripResult.trip.id;
    }

    const result = await applyForVisa({
      countryId: country.id,
      travelDate: travelDate || undefined,
      applicants,
      guest: { name, email, phone },
      tripId,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/visas/confirmation/${result.application.id}`, { state: { application: result.application } });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{country.flag}</span>
        <h1 className="text-2xl font-bold text-ink-950">{country.countryName}</h1>
      </div>
      <p className="mt-1 text-sm font-semibold text-pine-700">{country.visaType}</p>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-ink-900/10 bg-white p-5 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">Processing</p>
          <p className="font-semibold text-ink-950">
            {country.processingDays} day{country.processingDays === 1 ? "" : "s"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">Validity</p>
          <p className="font-semibold text-ink-950">{country.validity}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">Entry</p>
          <p className="font-semibold text-ink-950">{country.entryType}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">Fee</p>
          <p className="font-semibold text-ink-950">{formatMoney(feePerApplicant, "INR")}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-bold text-ink-950">You'll need</p>
        <div className="flex flex-wrap gap-2">
          {country.requiredDocuments.map((d) => (
            <span key={d} className="rounded-full bg-ink-950/5 px-3 py-1 text-xs font-medium text-ink-900/70">
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-ink-900/10 bg-white p-6">
        <form onSubmit={handleApply} className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Travel date (optional)</h2>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-950">Applicants</h2>
              <button
                type="button"
                onClick={addApplicant}
                disabled={applicants.length >= 6}
                className="flex items-center gap-1 text-xs font-bold text-pine-700 hover:text-pine-800 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Add applicant
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {applicants.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Full name</span>
                    <input
                      required
                      value={a.name}
                      onChange={(e) => updateApplicant(i, { name: e.target.value })}
                      className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Passport number</span>
                    <input
                      required
                      value={a.passportNumber}
                      onChange={(e) => updateApplicant(i, { passportNumber: e.target.value })}
                      className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                    />
                  </label>
                  {applicants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeApplicant(i)}
                      aria-label="Remove applicant"
                      className="rounded-lg p-2.5 text-ink-900/40 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-y border-ink-900/10 py-4">
            <p className="text-sm font-semibold text-ink-900/70">
              {formatMoney(feePerApplicant, "INR")} &times; {applicants.length} applicant{applicants.length === 1 ? "" : "s"}
            </p>
            <p className="text-2xl font-extrabold text-ink-950">{formatMoney(total, "INR")}</p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-ink-950">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Full name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Phone</span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-900/60">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-ink-900/15 px-3 py-2.5 focus:border-pine-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <TripPicker email={email} onChange={setTripSelection} />

          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-lg bg-gradient-to-r from-coral-600 to-coral-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : `Submit application for ${formatMoney(total, "INR")}`}
          </button>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
