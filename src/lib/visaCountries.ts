// Curated visa-services catalog for /visas — same duplication pattern as
// cruiseItineraries.ts: no visa-processor or government API exists for
// self-serve requirements/fee lookup, so this is curated content, framed
// for Indian passport holders (this app is already INR-denominated for
// forex/insurance). Flags are emoji, same lightweight treatment forex uses
// for its currency list, rather than a hotlinked photo — a paperwork
// product doesn't need scenery.
//
// Kept in sync manually with server/src/lib/visaCountries.ts, which
// duplicates the pricing-relevant fields as the server-side source of
// truth for computing an application's fee (server can't import this file
// — it lives outside the server package's tsconfig rootDir).

export interface VisaCountry {
  id: string;
  countryName: string;
  flag: string;
  visaType: "e-Visa" | "Visa on Arrival" | "Embassy Visa";
  processingDays: number;
  validity: string;
  entryType: "Single" | "Double" | "Multiple";
  govFeeInr: number;
  serviceFeeInr: number;
  requiredDocuments: string[];
}

const PASSPORT_PHOTO = "Passport-size photograph";
const PASSPORT_COPY = "Passport with 6+ months validity";
const RETURN_TICKET = "Return flight ticket";
const HOTEL_PROOF = "Hotel booking confirmation";
const BANK_STATEMENT = "Last 3 months' bank statement";

export const VISA_COUNTRIES: VisaCountry[] = [
  {
    id: "uae",
    countryName: "United Arab Emirates",
    flag: "🇦🇪",
    visaType: "e-Visa",
    processingDays: 4,
    validity: "30 days",
    entryType: "Single",
    govFeeInr: 6500,
    serviceFeeInr: 1500,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET, HOTEL_PROOF],
  },
  {
    id: "thailand",
    countryName: "Thailand",
    flag: "🇹🇭",
    visaType: "Visa on Arrival",
    processingDays: 1,
    validity: "15 days",
    entryType: "Single",
    govFeeInr: 2000,
    serviceFeeInr: 800,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET, BANK_STATEMENT],
  },
  {
    id: "singapore",
    countryName: "Singapore",
    flag: "🇸🇬",
    visaType: "e-Visa",
    processingDays: 3,
    validity: "30 days",
    entryType: "Multiple",
    govFeeInr: 2500,
    serviceFeeInr: 1200,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET],
  },
  {
    id: "vietnam",
    countryName: "Vietnam",
    flag: "🇻🇳",
    visaType: "e-Visa",
    processingDays: 3,
    validity: "30 days",
    entryType: "Single",
    govFeeInr: 2200,
    serviceFeeInr: 900,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO],
  },
  {
    id: "indonesia",
    countryName: "Indonesia",
    flag: "🇮🇩",
    visaType: "Visa on Arrival",
    processingDays: 1,
    validity: "30 days",
    entryType: "Single",
    govFeeInr: 2700,
    serviceFeeInr: 800,
    requiredDocuments: [PASSPORT_COPY, RETURN_TICKET],
  },
  {
    id: "malaysia",
    countryName: "Malaysia",
    flag: "🇲🇾",
    visaType: "e-Visa",
    processingDays: 3,
    validity: "30 days",
    entryType: "Single",
    govFeeInr: 1200,
    serviceFeeInr: 800,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET],
  },
  {
    id: "sri-lanka",
    countryName: "Sri Lanka",
    flag: "🇱🇰",
    visaType: "e-Visa",
    processingDays: 1,
    validity: "30 days",
    entryType: "Double",
    govFeeInr: 2000,
    serviceFeeInr: 700,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO],
  },
  {
    id: "turkey",
    countryName: "Turkey",
    flag: "🇹🇷",
    visaType: "e-Visa",
    processingDays: 1,
    validity: "90 days",
    entryType: "Multiple",
    govFeeInr: 4300,
    serviceFeeInr: 1000,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET],
  },
  {
    id: "egypt",
    countryName: "Egypt",
    flag: "🇪🇬",
    visaType: "e-Visa",
    processingDays: 4,
    validity: "30 days",
    entryType: "Single",
    govFeeInr: 2200,
    serviceFeeInr: 900,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET],
  },
  {
    id: "south-korea",
    countryName: "South Korea",
    flag: "🇰🇷",
    visaType: "e-Visa",
    processingDays: 3,
    validity: "90 days",
    entryType: "Multiple",
    govFeeInr: 1800,
    serviceFeeInr: 900,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, BANK_STATEMENT],
  },
  {
    id: "japan",
    countryName: "Japan",
    flag: "🇯🇵",
    visaType: "Embassy Visa",
    processingDays: 6,
    validity: "90 days",
    entryType: "Single",
    govFeeInr: 2000,
    serviceFeeInr: 2500,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET, HOTEL_PROOF, BANK_STATEMENT, "Itinerary letter"],
  },
  {
    id: "schengen",
    countryName: "Schengen (Europe)",
    flag: "🇪🇺",
    visaType: "Embassy Visa",
    processingDays: 15,
    validity: "90 days",
    entryType: "Multiple",
    govFeeInr: 7200,
    serviceFeeInr: 3000,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET, HOTEL_PROOF, BANK_STATEMENT, "Travel insurance"],
  },
  {
    id: "united-kingdom",
    countryName: "United Kingdom",
    flag: "🇬🇧",
    visaType: "Embassy Visa",
    processingDays: 20,
    validity: "180 days",
    entryType: "Multiple",
    govFeeInr: 12000,
    serviceFeeInr: 3000,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, RETURN_TICKET, BANK_STATEMENT, "Proof of employment"],
  },
  {
    id: "united-states",
    countryName: "United States",
    flag: "🇺🇸",
    visaType: "Embassy Visa",
    processingDays: 30,
    validity: "10 years",
    entryType: "Multiple",
    govFeeInr: 15500,
    serviceFeeInr: 3500,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, "DS-160 confirmation", BANK_STATEMENT, "Proof of employment"],
  },
  {
    id: "australia",
    countryName: "Australia",
    flag: "🇦🇺",
    visaType: "e-Visa",
    processingDays: 20,
    validity: "1 year",
    entryType: "Multiple",
    govFeeInr: 9000,
    serviceFeeInr: 2000,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, BANK_STATEMENT, "Proof of employment"],
  },
  {
    id: "canada",
    countryName: "Canada",
    flag: "🇨🇦",
    visaType: "Embassy Visa",
    processingDays: 25,
    validity: "10 years",
    entryType: "Multiple",
    govFeeInr: 6500,
    serviceFeeInr: 2500,
    requiredDocuments: [PASSPORT_COPY, PASSPORT_PHOTO, BANK_STATEMENT, "Proof of employment", "Travel history"],
  },
];
