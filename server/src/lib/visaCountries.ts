// Server-side source of truth for visa fee validation — mirrors the
// pricing-relevant fields of src/lib/visaCountries.ts (the frontend's
// browse/detail catalog, which also carries required-documents copy the
// server doesn't need). Kept in sync manually, same pattern as
// server/src/lib/cruiseItineraries.ts.
export interface VisaCountry {
  id: string;
  countryName: string;
  visaType: string;
  govFeeInr: number;
  serviceFeeInr: number;
}

export const VISA_COUNTRIES: VisaCountry[] = [
  { id: "uae", countryName: "United Arab Emirates", visaType: "e-Visa", govFeeInr: 6500, serviceFeeInr: 1500 },
  { id: "thailand", countryName: "Thailand", visaType: "Visa on Arrival", govFeeInr: 2000, serviceFeeInr: 800 },
  { id: "singapore", countryName: "Singapore", visaType: "e-Visa", govFeeInr: 2500, serviceFeeInr: 1200 },
  { id: "vietnam", countryName: "Vietnam", visaType: "e-Visa", govFeeInr: 2200, serviceFeeInr: 900 },
  { id: "indonesia", countryName: "Indonesia", visaType: "Visa on Arrival", govFeeInr: 2700, serviceFeeInr: 800 },
  { id: "malaysia", countryName: "Malaysia", visaType: "e-Visa", govFeeInr: 1200, serviceFeeInr: 800 },
  { id: "sri-lanka", countryName: "Sri Lanka", visaType: "e-Visa", govFeeInr: 2000, serviceFeeInr: 700 },
  { id: "turkey", countryName: "Turkey", visaType: "e-Visa", govFeeInr: 4300, serviceFeeInr: 1000 },
  { id: "egypt", countryName: "Egypt", visaType: "e-Visa", govFeeInr: 2200, serviceFeeInr: 900 },
  { id: "south-korea", countryName: "South Korea", visaType: "e-Visa", govFeeInr: 1800, serviceFeeInr: 900 },
  { id: "japan", countryName: "Japan", visaType: "Embassy Visa", govFeeInr: 2000, serviceFeeInr: 2500 },
  { id: "schengen", countryName: "Schengen (Europe)", visaType: "Embassy Visa", govFeeInr: 7200, serviceFeeInr: 3000 },
  { id: "united-kingdom", countryName: "United Kingdom", visaType: "Embassy Visa", govFeeInr: 12000, serviceFeeInr: 3000 },
  { id: "united-states", countryName: "United States", visaType: "Embassy Visa", govFeeInr: 15500, serviceFeeInr: 3500 },
  { id: "australia", countryName: "Australia", visaType: "e-Visa", govFeeInr: 9000, serviceFeeInr: 2000 },
  { id: "canada", countryName: "Canada", visaType: "Embassy Visa", govFeeInr: 6500, serviceFeeInr: 2500 },
];
