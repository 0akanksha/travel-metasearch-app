import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react";
import { getCalendar } from "../lib/api";
import type { CalendarDay } from "../lib/types";
import { formatMoney, formatMonthYear } from "../lib/format";
import LoadingSpinner from "../components/LoadingSpinner";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PriceCalendar() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get("origin") ?? "";
  const destination = searchParams.get("destination") ?? "";
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    // This fans out ~30 individual date searches against Duffel server-side —
    // expect this to take noticeably longer than a normal one-shot search.
    getCalendar(origin, destination, month).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        setDays([]);
        return;
      }
      setDays(result.days);
    });
  }, [origin, destination, month]);

  const prices = days.map((d) => d.price).filter((p): p is number => p !== null);
  const cheapest = prices.length > 0 ? Math.min(...prices) : null;
  const firstWeekday = new Date(`${month}-01T12:00:00Z`).getUTCDay();

  function monthLink(delta: number) {
    return `/calendar?origin=${origin}&destination=${destination}&month=${shiftMonth(month, delta)}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/60">Price calendar</p>
          <h1 className="text-2xl font-bold text-ink-950">
            {origin} &rarr; {destination}
          </h1>
        </div>
        {cheapest !== null && (
          <div className="flex items-center gap-1.5 rounded-full bg-pine-500/10 px-4 py-1.5 text-sm font-bold text-pine-700">
            <TrendingDown className="h-4 w-4" />
            From {formatMoney(cheapest, "USD")}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-ink-900/10 bg-white px-4 py-3">
        <Link to={monthLink(-1)} className="rounded-lg p-1.5 text-ink-900/60 hover:bg-ink-950/5" aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="font-bold text-ink-950">{formatMonthYear(`${month}-01`)}</p>
        <Link to={monthLink(1)} className="rounded-lg p-1.5 text-ink-900/60 hover:bg-ink-950/5" aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      ) : cheapest === null ? (
        <p className="rounded-lg border border-dashed border-ink-900/15 px-4 py-8 text-center text-sm text-ink-900/60">
          Couldn't find fares for {origin} &rarr; {destination} this month — this view searches every day at once and
          can occasionally get rate-limited. Try again in a moment.
        </p>
      ) : (
        <div className="rounded-xl border border-ink-900/10 bg-white p-3">
          <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-900/50">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const isCheapest = day.price !== null && day.price === cheapest;
              const dayNum = Number(day.date.slice(-2));
              return day.price === null ? (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-0.5 rounded-lg border border-ink-900/5 bg-ink-950/[0.02] px-1 py-2 text-center"
                >
                  <span className="text-xs text-ink-900/40">{dayNum}</span>
                  <span className="text-[10px] text-ink-900/30">&mdash;</span>
                </div>
              ) : (
                <Link
                  key={day.date}
                  to={`/search?origin=${origin}&destination=${destination}&date=${day.date}&passengers=1`}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                    isCheapest
                      ? "border-coral-500 bg-coral-500/10"
                      : "border-ink-900/10 bg-white hover:border-pine-400"
                  }`}
                >
                  <span className="text-xs text-ink-900/60">{dayNum}</span>
                  <span className={`text-xs font-bold ${isCheapest ? "text-coral-600" : "text-ink-950"}`}>
                    {formatMoney(day.price, "USD")}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
