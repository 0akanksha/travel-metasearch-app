// Curated fan-out target list for "everywhere" search. Duffel has no live
// "every destination on Earth" endpoint, so this app approximates it by
// searching a fixed set of major airports and ranking by price — see the
// "Known limitation" note in the project plan. City/country names are kept
// here rather than read off the Duffel response, since Duffel's offer
// payload only gives the airport name, not the city.
export interface Destination {
  iataCode: string;
  cityName: string;
  countryName: string;
}

export const EVERYWHERE_DESTINATIONS: Destination[] = [
  { iataCode: "LHR", cityName: "London", countryName: "United Kingdom" },
  { iataCode: "CDG", cityName: "Paris", countryName: "France" },
  { iataCode: "NRT", cityName: "Tokyo", countryName: "Japan" },
  { iataCode: "HND", cityName: "Tokyo", countryName: "Japan" },
  { iataCode: "DXB", cityName: "Dubai", countryName: "United Arab Emirates" },
  { iataCode: "SIN", cityName: "Singapore", countryName: "Singapore" },
  { iataCode: "SYD", cityName: "Sydney", countryName: "Australia" },
  { iataCode: "BCN", cityName: "Barcelona", countryName: "Spain" },
  { iataCode: "FCO", cityName: "Rome", countryName: "Italy" },
  { iataCode: "AMS", cityName: "Amsterdam", countryName: "Netherlands" },
  { iataCode: "BKK", cityName: "Bangkok", countryName: "Thailand" },
  { iataCode: "IST", cityName: "Istanbul", countryName: "Turkiye" },
  { iataCode: "GRU", cityName: "Sao Paulo", countryName: "Brazil" },
  { iataCode: "MEX", cityName: "Mexico City", countryName: "Mexico" },
  { iataCode: "CPT", cityName: "Cape Town", countryName: "South Africa" },
  { iataCode: "LAX", cityName: "Los Angeles", countryName: "United States" },
  { iataCode: "SFO", cityName: "San Francisco", countryName: "United States" },
  { iataCode: "MIA", cityName: "Miami", countryName: "United States" },
  { iataCode: "ORD", cityName: "Chicago", countryName: "United States" },
  { iataCode: "YYZ", cityName: "Toronto", countryName: "Canada" },
  { iataCode: "ICN", cityName: "Seoul", countryName: "South Korea" },
  { iataCode: "HKG", cityName: "Hong Kong", countryName: "Hong Kong" },
  { iataCode: "DEL", cityName: "Delhi", countryName: "India" },
  { iataCode: "BOM", cityName: "Mumbai", countryName: "India" },
  { iataCode: "LIS", cityName: "Lisbon", countryName: "Portugal" },
  { iataCode: "ATH", cityName: "Athens", countryName: "Greece" },
  { iataCode: "VIE", cityName: "Vienna", countryName: "Austria" },
  { iataCode: "CUN", cityName: "Cancun", countryName: "Mexico" },
  { iataCode: "DPS", cityName: "Bali", countryName: "Indonesia" },
  { iataCode: "AKL", cityName: "Auckland", countryName: "New Zealand" },
  { iataCode: "CAI", cityName: "Cairo", countryName: "Egypt" },
  { iataCode: "KEF", cityName: "Reykjavik", countryName: "Iceland" },
  { iataCode: "ZRH", cityName: "Zurich", countryName: "Switzerland" },
  { iataCode: "MUC", cityName: "Munich", countryName: "Germany" },
  { iataCode: "JFK", cityName: "New York", countryName: "United States" },
  { iataCode: "EWR", cityName: "Newark", countryName: "United States" },
  { iataCode: "SEA", cityName: "Seattle", countryName: "United States" },
  { iataCode: "DEN", cityName: "Denver", countryName: "United States" },
  { iataCode: "AUS", cityName: "Austin", countryName: "United States" },
  { iataCode: "BOS", cityName: "Boston", countryName: "United States" },
  { iataCode: "MAD", cityName: "Madrid", countryName: "Spain" },
  { iataCode: "MXP", cityName: "Milan", countryName: "Italy" },
  { iataCode: "DUB", cityName: "Dublin", countryName: "Ireland" },
  { iataCode: "PRG", cityName: "Prague", countryName: "Czechia" },
  { iataCode: "CPH", cityName: "Copenhagen", countryName: "Denmark" },
];
