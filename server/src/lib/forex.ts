// Real live exchange rates via api.frankfurter.dev — free, keyless,
// ECB-based, confirmed working during planning. INR is the fixed base
// currency throughout (this feature is framed like MakeMyTrip's forex
// card: a traveler loading foreign currency before leaving India).

export interface ForexCurrency {
  code: string;
  name: string;
  flag: string;
}

// Curated to the currencies frankfurter.dev actually supports, picked for
// overlap with src/lib/famousDestinations.ts's destination list.
export const CURRENCIES: ForexCurrency[] = [
  { code: "USD", name: "US Dollar", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "EUR", name: "Euro", flag: "\u{1F1EA}\u{1F1FA}" },
  { code: "GBP", name: "British Pound", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "JPY", name: "Japanese Yen", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "AUD", name: "Australian Dollar", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "SGD", name: "Singapore Dollar", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "THB", name: "Thai Baht", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "CHF", name: "Swiss Franc", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "CAD", name: "Canadian Dollar", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "\u{1F1ED}\u{1F1F0}" },
  { code: "NZD", name: "New Zealand Dollar", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "KRW", name: "South Korean Won", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "ZAR", name: "South African Rand", flag: "\u{1F1FF}\u{1F1E6}" },
];

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// INR cost of 1 unit of toCurrency.
export async function getRate(toCurrency: string): Promise<number> {
  const url = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(toCurrency)}&symbols=INR`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Exchange rate lookup failed (${res.status})`);
  const body = (await res.json()) as FrankfurterResponse;
  const rate = body.rates?.INR;
  if (typeof rate !== "number") throw new Error(`No rate available for ${toCurrency}`);
  return rate;
}
