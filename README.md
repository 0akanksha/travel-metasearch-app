# FareCompass

A travel metasearch and booking app: search flights, hotels, and cabs, then round out a trip with a forex card, travel insurance, a cruise, or a visa application — all from one place, no account required.

**Live:** [farecompass.onrender.com](https://farecompass.onrender.com)

## What it does

- **Flights** — search, a price calendar, and an "everywhere" browser via [Duffel](https://duffel.com)'s test-mode API. FareCompass is metasearch only for flights: results link out to the airline's own site (or Google Flights) rather than booking in-app.
- **Hotels** — real search/pricing data via a RapidAPI listing; booking is recorded locally (no booking-creation API exists for the data source).
- **Cabs** — real geocoding + driving-route data (RapidAPI geocoding, OSRM routing); fares are computed from a local rate table and booked locally.
- **Forex card** — order a foreign-currency card loaded at a live exchange rate ([frankfurter.dev](https://frankfurter.dev)), re-fetched server-side at order time.
- **Travel insurance** — buy a policy across three coverage tiers; the premium is computed from trip length, traveler ages, and domestic/international status.
- **Cruises** — browse a curated catalog of real cruise lines/ships and book a cabin.
- **Visa services** — browse visa requirements/fees for a curated set of destination countries and submit an application (no document upload — just names and passport numbers).
- **My Trip** — bundle any of the above under a single trip, or plan one ahead of time and get prefilled search links for each vertical.
- **Explore** — a curated destination-inspiration page.
- **Price alerts** — watch a route/date for a price drop, get emailed when it hits your target.
- **24/7 chat assistant** — a Groq-powered widget that can search flights/hotels, estimate cab fares, and look up bookings, then hands off to the site's own forms to complete anything.
- **Admin dashboard** — a single seeded admin account can view price alerts and every booking type across all verticals.

None of the "bookings" above involve real payment or a real reservation with the provider — every vertical beyond flights is a locally recorded order/booking (see [Architecture](#architecture)). There's no user login for travelers: every booking is looked up and managed by email plus a private cancel link/token, the same way a guest checkout works.

## Tech stack

- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Express + TypeScript, running in the same process as the frontend (Vite in middleware mode for dev, static `dist/` in production — one process, one port)
- **Database:** [Neon](https://neon.tech) serverless Postgres via Drizzle ORM
- **Auth:** JWT in an httpOnly cookie, bcrypt password hashing — admin-only; there's no traveler signup
- **Lint:** [oxlint](https://oxc.rs/)

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database (free tier is enough)

### Install

```bash
npm install
npm install --prefix server
```

### Configure environment variables

Copy `server/.env.example` to `server/.env` and fill in the values. At minimum you need:

| Variable | Required for |
|---|---|
| `DATABASE_URL` | Everything — Neon connection string |
| `JWT_SECRET` | Admin login |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeds the one admin account on first run |
| `DUFFEL_API_KEY` | Flight search ([duffel.com](https://duffel.com), test mode) |
| `RESEND_API_KEY` | Price alert emails ([resend.com](https://resend.com)) |
| `RAPIDAPI_KEY` | Hotel search + cab geocoding (shared across two RapidAPI listings — see the comments in `.env.example`) |
| `GROQ_API_KEY` | The chat widget ([console.groq.com](https://console.groq.com), free tier) |

The app will start without every key set, but the corresponding feature won't work until it is. See `server/.env.example` for details on each one.

### Set up the database

```bash
npm run db:push --prefix server
```

### Run it

```bash
npm run dev
```

Serves the full app at **http://localhost:4000** — Express handles the API and runs Vite in middleware mode for the frontend, so there's no separate frontend dev server.

### Other commands

| Command | What it does |
|---|---|
| `npm run build:all` | Build both frontend and backend for production |
| `npm start` | Run the production build (`npm run build:all` first) |
| `npm run lint` | Lint the frontend with oxlint |

There's no automated test suite — verify changes by running `npm run dev` and exercising the flow in a browser.

## Architecture

- **Single process, single port.** Express serves the API under `/api/*` and the frontend for everything else — in dev via Vite middleware mode (HMR included), in production from the built `dist/`.
- **Guest-only trust model.** There's no traveler account system. Every booking record is created with a random cancel token; looking it up or cancelling it later requires knowing both the booking ID and that token (surfaced via the email-lookup flow), the same trust model as an airline's "manage my booking" page.
- **Honest about what's real.** Flights are pure metasearch — nothing is booked or stored beyond a saved-offer snapshot on a trip. Hotels and cabs use real third-party search/pricing/routing data but record the booking itself locally, since neither data source exposes a booking-creation API. Forex card rates are live and re-verified server-side at order time. Insurance premiums and cruise/visa pricing are computed from local rate tables and curated catalogs respectively, since no self-serve API exists for either. Visa applications are the one vertical whose status defaults to "submitted" rather than "confirmed" — a real visa outcome isn't instant or guaranteed.
- **Optional trip attachment.** Every booking type has a nullable `tripId`; a shared `TripPicker` component lets a guest optionally attach a new booking to an existing or new trip, verified server-side against the guest's email.

## Deployment

Deployed to [Render](https://render.com) as a single Web Service, defined by `render.yaml`, health-checked at `/api/health`.

## License

Personal project — no license specified.
