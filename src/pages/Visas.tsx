import { Link } from "react-router-dom";
import { Clock, FileCheck2, Stamp } from "lucide-react";
import { VISA_COUNTRIES } from "../lib/visaCountries";

const PERKS = [
  { icon: FileCheck2, title: "No documents to scan", desc: "We just need names and passport numbers — nothing to upload." },
  { icon: Clock, title: "Real processing times", desc: "Know how long each visa type actually takes before you apply." },
  { icon: Stamp, title: "Manage anytime", desc: "Look up or withdraw your application later with your email, no login." },
];

export default function Visas() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-pine-700 pb-16 pt-16 text-white sm:pt-24">
        <Stamp className="animate-drift pointer-events-none absolute top-24 h-10 w-10 text-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,179,160,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-pine-400">
            Before you go
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Sort your <span className="text-coral-400">visa.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Visa services for Indian passport holders — pick a destination and see the fee.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VISA_COUNTRIES.map((c) => (
            <Link
              key={c.id}
              to={`/visas/${c.id}`}
              className="flex flex-col gap-2 rounded-xl border border-ink-900/10 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.flag}</span>
                <h2 className="text-lg font-bold text-ink-950">{c.countryName}</h2>
              </div>
              <p className="text-sm font-semibold text-pine-700">{c.visaType}</p>
              <p className="text-xs text-ink-900/60">
                {c.processingDays} day{c.processingDays === 1 ? "" : "s"} processing &middot; Valid {c.validity}
              </p>
              <p className="mt-auto text-lg font-extrabold text-ink-950">
                from ₹{(c.govFeeInr + c.serviceFeeInr).toLocaleString("en-IN")}
                <span className="text-xs font-medium text-ink-900/50"> /applicant</span>
              </p>
            </Link>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-ink-900/10 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-pine-500/15 text-pine-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink-950">{title}</h3>
              <p className="mt-1 text-sm text-ink-900/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
