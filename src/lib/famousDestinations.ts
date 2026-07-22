// Curated destination-inspiration content for /explore. A different concern
// from server/src/lib/destinations.ts (a curated *airport* list used
// server-side to fan out live Duffel price lookups for /everywhere) — this
// list is purely editorial (photo, description, highlights), not tied to
// any live pricing call, so it lives client-side with no backend involved.
//
// Photos are real, hotlinked Wikimedia Commons URLs — fetched and verified
// working (real photo, not a placeholder/icon) via Wikipedia's free, keyless,
// CORS-enabled REST summary API during planning. blurb/highlights below are
// original copy, not pulled from Wikipedia's article text.

export interface FamousDestination {
  id: string;
  name: string;
  country: string;
  continent: "Europe" | "Asia" | "Africa" | "North America" | "South America" | "Oceania";
  imageUrl: string;
  blurb: string;
  highlights: string[];
  // Fed into DestinationAutocomplete as initialLabel when jumping to /trip.
  searchQuery: string;
}

export const FAMOUS_DESTINATIONS: FamousDestination[] = [
  {
    id: "paris",
    name: "Paris",
    country: "France",
    continent: "Europe",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/330px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg",
    blurb: "Icons at every turn — the Seine, world-class art, and a café on every corner.",
    highlights: ["Eiffel Tower", "The Louvre", "Montmartre", "Notre-Dame"],
    searchQuery: "Paris",
  },
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    continent: "Europe",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/330px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg",
    blurb: "Three thousand years of history, all walkable between plates of pasta.",
    highlights: ["Colosseum", "Trevi Fountain", "Vatican City", "Roman Forum"],
    searchQuery: "Rome",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    continent: "Asia",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/330px-Skyscrapers_of_Shinjuku_2009_January.jpg",
    blurb: "Neon skylines, ancient shrines, and the best food scene on the planet.",
    highlights: ["Shibuya Crossing", "Senso-ji Temple", "Tsukiji Outer Market", "Shinjuku"],
    searchQuery: "Tokyo",
  },
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    continent: "Asia",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Kyoto%2C_Japan_%2849667780482%29.jpg/330px-Kyoto%2C_Japan_%2849667780482%29.jpg",
    blurb: "Japan's former capital — thousands of temples, gardens, and quiet backstreets.",
    highlights: ["Fushimi Inari Shrine", "Arashiyama Bamboo Grove", "Kinkaku-ji", "Gion district"],
    searchQuery: "Kyoto",
  },
  {
    id: "new-york",
    name: "New York City",
    country: "United States",
    continent: "North America",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/330px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg",
    blurb: "The city that never sleeps — Broadway, world-class museums, and a skyline like no other.",
    highlights: ["Central Park", "Times Square", "Statue of Liberty", "The Met"],
    searchQuery: "New York",
  },
  {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    continent: "Asia",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Pura_Luhur_Uluwatu_2017-08-17_%2834%29.jpg/330px-Pura_Luhur_Uluwatu_2017-08-17_%2834%29.jpg",
    blurb: "Rice terraces, cliffside temples, and surf breaks on every coast.",
    highlights: ["Uluwatu Temple", "Ubud rice terraces", "Seminyak beaches", "Mount Batur sunrise"],
    searchQuery: "Bali",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    continent: "Asia",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Burj_Khalifa_2021.jpg/330px-Burj_Khalifa_2021.jpg",
    blurb: "Record-breaking architecture, desert dunes, and shopping without limits.",
    highlights: ["Burj Khalifa", "Desert safari", "Dubai Mall", "Palm Jumeirah"],
    searchQuery: "Dubai",
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    continent: "Europe",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/330px-London_Skyline_%28125508655%29.jpeg",
    blurb: "Royal history, world-class theatre, and a museum for every interest — most of them free.",
    highlights: ["Big Ben & Westminster", "British Museum", "Tower of London", "West End theatre"],
    searchQuery: "London",
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    continent: "Asia",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/4Y1A1159_Bangkok_%2833536795515%29.jpg/330px-4Y1A1159_Bangkok_%2833536795515%29.jpg",
    blurb: "Golden temples, floating markets, and street food that rivals any restaurant.",
    highlights: ["Grand Palace", "Wat Arun", "Chatuchak Market", "Chao Phraya river"],
    searchQuery: "Bangkok",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    continent: "Europe",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Evening_light_over_Barcelona.jpg/330px-Evening_light_over_Barcelona.jpg",
    blurb: "Gaudí's surreal architecture, Mediterranean beaches, and tapas after dark.",
    highlights: ["Sagrada Familia", "Park Guell", "Las Ramblas", "Gothic Quarter"],
    searchQuery: "Barcelona",
  },
  {
    id: "santorini",
    name: "Santorini",
    country: "Greece",
    continent: "Europe",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Oia_sunset_-_panoramio_%282%29.jpg/330px-Oia_sunset_-_panoramio_%282%29.jpg",
    blurb: "Whitewashed clifftop villages over a volcanic caldera — the classic Greek island sunset.",
    highlights: ["Oia sunset", "Fira caldera views", "Red Beach", "Ancient Akrotiri"],
    searchQuery: "Santorini",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    continent: "Oceania",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/330px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg",
    blurb: "Harbourside icons, world-famous beaches, and a laid-back outdoor pace of life.",
    highlights: ["Sydney Opera House", "Bondi Beach", "Harbour Bridge climb", "Royal Botanic Garden"],
    searchQuery: "Sydney",
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    continent: "Africa",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/330px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg",
    blurb: "The last standing wonder of the ancient world, right on the edge of the city.",
    highlights: ["Pyramids of Giza", "The Sphinx", "Egyptian Museum", "Khan el-Khalili bazaar"],
    searchQuery: "Cairo",
  },
  {
    id: "rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    continent: "South America",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Cidade_Maravilhosa.jpg/330px-Cidade_Maravilhosa.jpg",
    blurb: "Mountains meet ocean meets carnival energy — Rio doesn't do subtle.",
    highlights: ["Christ the Redeemer", "Copacabana Beach", "Sugarloaf Mountain", "Santa Teresa"],
    searchQuery: "Rio de Janeiro",
  },
  {
    id: "marrakesh",
    name: "Marrakesh",
    country: "Morocco",
    continent: "Africa",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Pavillon_Menarag%C3%A4rten.jpg/330px-Pavillon_Menarag%C3%A4rten.jpg",
    blurb: "A maze of souks, palaces, and gardens at the foot of the Atlas Mountains.",
    highlights: ["Jemaa el-Fnaa square", "Majorelle Garden", "Bahia Palace", "The medina souks"],
    searchQuery: "Marrakesh",
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Turkiye",
    continent: "Europe",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/330px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg",
    blurb: "Where Europe meets Asia — domes, bazaars, and the Bosphorus in between.",
    highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Bosphorus cruise"],
    searchQuery: "Istanbul",
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    country: "Peru",
    continent: "South America",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Machu_Picchu%2C_2023_%28012%29.jpg/330px-Machu_Picchu%2C_2023_%28012%29.jpg",
    blurb: "The Inca citadel in the clouds — one of the great treks and views on Earth.",
    highlights: ["Machu Picchu citadel", "Inca Trail", "Sacred Valley", "Cusco's old town"],
    searchQuery: "Machu Picchu",
  },
  {
    id: "venice",
    name: "Venice",
    country: "Italy",
    continent: "Europe",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/330px-Venezia_aerial_view.jpg",
    blurb: "A city built on water, best explored slowly, by canal or on foot.",
    highlights: ["Grand Canal", "St. Mark's Square", "Rialto Bridge", "Murano & Burano islands"],
    searchQuery: "Venice",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    continent: "Europe",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png/330px-Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png",
    blurb: "Canal-ring charm, world-class museums, and the best way to see it all — a bike.",
    highlights: ["Canal Ring", "Van Gogh Museum", "Anne Frank House", "Jordaan district"],
    searchQuery: "Amsterdam",
  },
  {
    id: "reykjavik",
    name: "Reykjavik",
    country: "Iceland",
    continent: "Europe",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg/330px-Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg",
    blurb: "Gateway to glaciers, geysers, and the northern lights — a small city, a huge backyard.",
    highlights: ["Blue Lagoon", "Golden Circle", "Northern Lights", "Hallgrimskirkja"],
    searchQuery: "Reykjavik",
  },
  {
    id: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    continent: "Africa",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Camps_bay_%2853460319478%29_%28cropped%29.jpg/330px-Camps_bay_%2853460319478%29_%28cropped%29.jpg",
    blurb: "Table Mountain, wine country, and coastline in every direction.",
    highlights: ["Table Mountain", "Cape of Good Hope", "Robben Island", "Winelands day trips"],
    searchQuery: "Cape Town",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    continent: "Asia",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Marina_Bay_Singapore-3499.jpg/330px-Marina_Bay_Singapore-3499.jpg",
    blurb: "A futuristic garden city where the food courts are as celebrated as the skyline.",
    highlights: ["Gardens by the Bay", "Marina Bay Sands", "Hawker centres", "Sentosa Island"],
    searchQuery: "Singapore",
  },
  {
    id: "prague",
    name: "Prague",
    country: "Czech Republic",
    continent: "Europe",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/330px-Prague_%286365119737%29.jpg",
    blurb: "Fairy-tale spires and cobblestone lanes, largely untouched by time.",
    highlights: ["Charles Bridge", "Prague Castle", "Old Town Square", "Astronomical Clock"],
    searchQuery: "Prague",
  },
  {
    id: "bora-bora",
    name: "Bora Bora",
    country: "French Polynesia",
    continent: "Oceania",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Bora_Bora_ISS006.jpg/330px-Bora_Bora_ISS006.jpg",
    blurb: "The overwater bungalow, invented here — lagoon blues you have to see to believe.",
    highlights: ["Overwater bungalows", "Mount Otemanu", "Lagoon snorkeling", "Matira Beach"],
    searchQuery: "Bora Bora",
  },
];

export const CONTINENTS = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"] as const;
