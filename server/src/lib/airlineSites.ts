import type { DuffelOffer } from "./duffelTypes.js";

// Curated real official homepages for the major airlines realistically seen
// in Duffel's test-mode panel. Real per-flight deep links into an airline's
// own booking flow require a partner/affiliate agreement FareCompass
// doesn't have — this is a straightforward "go book with them" entry point,
// not a pre-filled itinerary. Airlines not in this map (including Duffel's
// fictional test-only "ZZ" carrier) fall back to a Google Flights search.
const AIRLINE_HOMEPAGES: Record<string, string> = {
  AA: "https://www.aa.com",
  BA: "https://www.britishairways.com",
  IB: "https://www.iberia.com",
  DL: "https://www.delta.com",
  UA: "https://www.united.com",
  LH: "https://www.lufthansa.com",
  AF: "https://www.airfrance.com",
  KL: "https://www.klm.com",
  EK: "https://www.emirates.com",
  QR: "https://www.qatarairways.com",
  EY: "https://www.etihad.com",
  TK: "https://www.turkishairlines.com",
  SV: "https://www.saudia.com",
  SQ: "https://www.singaporeair.com",
  CX: "https://www.cathaypacific.com",
  NH: "https://www.ana.co.jp",
  JL: "https://www.jal.co.jp",
  QF: "https://www.qantas.com",
  AC: "https://www.aircanada.com",
  VS: "https://www.virginatlantic.com",
  AZ: "https://www.ita-airways.com",
  LX: "https://www.swiss.com",
  OS: "https://www.austrian.com",
  SK: "https://www.flysas.com",
  AY: "https://www.finnair.com",
  TP: "https://www.flytap.com",
  EI: "https://www.aerlingus.com",
  FR: "https://www.ryanair.com",
  U2: "https://www.easyjet.com",
  W6: "https://wizzair.com",
  B6: "https://www.jetblue.com",
  WN: "https://www.southwest.com",
  AS: "https://www.alaskaair.com",
};

function googleFlightsUrl(offer: DuffelOffer): string {
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];
  const origin = outbound?.origin.iata_code ?? "";
  const destination = outbound?.destination.iata_code ?? "";
  const departDate = outbound?.segments[0]?.departing_at.slice(0, 10) ?? "";

  let query = `Flights from ${origin} to ${destination} on ${departDate}`;
  if (inbound) {
    const returnDate = inbound.segments[0]?.departing_at.slice(0, 10) ?? "";
    if (returnDate) query += ` returning ${returnDate}`;
  }

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

export function resolveRedirectUrl(offer: DuffelOffer): string {
  const iataCode = offer.owner.iata_code;
  if (iataCode && AIRLINE_HOMEPAGES[iataCode]) {
    return AIRLINE_HOMEPAGES[iataCode];
  }
  return googleFlightsUrl(offer);
}
