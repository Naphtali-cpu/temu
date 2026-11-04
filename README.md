# Temu Estates — Addis Ababa

A complete real-estate website and admin console for **Temu Estates** (ተሙ ኤስቴት):
residential and commercial portfolios, an interactive map, a VIP client portal,
an inquiry inbox, and a secure dashboard for managing every listing.

The client-facing site is a React + Vite single-page app. Listings, images,
inquiries and admin sessions are stored server-side in SQLite by a small Express
API — nothing is kept in the browser any more.

---

## Quick start

Requirements: **Node.js 22.5+** (the API uses the built-in `node:sqlite` module).

```bash
npm install

# 1. Create your local environment file
cp .env.example .env
#    → set ADMIN_EMAIL and ADMIN_PASSWORD to your own values

# 2. Start the API (:4000) and the website (:5173) together
npm run dev
```

Open <http://localhost:5173>. The first boot seeds the database with the 40
existing listings and creates the admin account from your `.env`.

Sign in at <http://localhost:5173/portal> with `ADMIN_EMAIL` / `ADMIN_PASSWORD`,
then open **Dashboard** in the header (or go to `/admin`).

### Production-style run (single port)

```bash
npm run build
npm start          # serves the API and the built site on :4000
```

The API detects `dist/` and serves the compiled app, so the whole demo runs from
one origin. Set `VITE_API_BASE_URL=/api` before building if you serve the site
from the same host; the default `.env` points at `http://localhost:4000/api`.

---

## What is included

### Public website

- **Home** — cinematic hero, live portfolio stats, search panel (keyword, type,
  bedrooms, status), active filter chips, featured collection, VIP strip,
  agent section.
- **Residential** and **Commercial** portfolios with filtering by area, type,
  bedrooms, status and price basis.
- **Property detail** — gallery with keyboard-navigable lightbox, specifications,
  amenities, agent card, request-a-viewing form, map and nearby listings.
- **Map** — Leaflet map of every listing with area filters and price pins.
- **VIP portal** — client registration/sign-in, saved-search shortcuts and a
  “VIP only” view of the portfolio.
- **Contact** — validated inquiry form (saved to the inbox) plus WhatsApp,
  Telegram, phone and email actions.
- **Currency toggle** — ETB ⇄ USD using a live exchange rate, cached for six
  hours with a bundled fallback.
- Fully responsive, keyboard accessible, reduced-motion aware.

### Admin console (`/admin`)

- **Overview** — portfolio totals, published/value metrics, status breakdown,
  category split, currency rate health and the latest inquiries.
- **Listings** — search and filter every property, inline status changes,
  drag-free up/down ordering (the order visitors see), paginated table.
- **Listing editor** — create and edit every field, VIP flag, map coordinates
  with Addis neighbourhood autofill, and an ordered photo manager (drag to
  reorder, set cover, per-photo labels for compound / living / kitchen / bedroom
  / bathroom). Photos are optimised in the browser (WebP, 1920px full, 640px
  thumbnail) and uploaded only when you save.
- **Inquiries** — status tabs (All / New / Contacted / Closed), search, full
  message view, one-click reply by email, WhatsApp or Telegram.
- Authentication is server-verified; the dashboard is unreachable without an
  admin session, and every write endpoint is guarded.

---

## Architecture

```
server/
  index.js          Express app, CORS, static uploads, production SPA serving
  env.js            .env loader (no dependency)
  db.js             node:sqlite connection, schema, transactions
  seed.js           idempotent seed of 40 listings + admin account
  auth.js           scrypt hashing, opaque bearer sessions, requireAdmin
  validation.js     enums, input parsing, size limits
  routes/           auth, properties, inquiries, uploads, admin stats
  data/             SQLite database (git-ignored)
  uploads/          uploaded images (git-ignored)

src/
  App.jsx           router + providers
  pages/            public pages and pages/admin/*
  components/       header, footer, cards, filters, gallery, admin photo manager
  context/          Auth, Currency (live ETB/USD), Toasts
  hooks/            useProperties (shared portfolio cache)
  api/              axios client + typed endpoint helpers
  lib/              formatting, filters, image optimisation, site constants
```

**Data model**

| Table            | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `users`          | admin and client accounts (scrypt password hashes)             |
| `sessions`       | hashed bearer tokens with expiry                               |
| `properties`     | listing fields, coordinates, VIP flag, display order           |
| `property_images`| ordered image URLs + thumbnails per listing                    |
| `inquiries`      | contact submissions with status and optional listing reference |

**API**

| Method | Endpoint                       | Access  |
| ------ | ------------------------------ | ------- |
| POST   | `/api/auth/register`           | public  |
| POST   | `/api/auth/login`              | public  |
| GET    | `/api/auth/me`                 | bearer  |
| POST   | `/api/auth/logout`             | bearer  |
| GET    | `/api/properties`              | public  |
| GET    | `/api/properties/:id`          | public  |
| POST   | `/api/properties`              | admin   |
| PUT    | `/api/properties/:id`          | admin   |
| PATCH  | `/api/properties/:id/status`   | admin   |
| POST   | `/api/properties/reorder`      | admin   |
| DELETE | `/api/properties/:id`          | admin   |
| POST   | `/api/inquiries`               | public  |
| GET    | `/api/inquiries`               | admin   |
| PATCH  | `/api/inquiries/:id/status`    | admin   |
| POST   | `/api/uploads`                 | admin   |
| GET    | `/api/admin/stats`             | admin   |

Send the session token as `Authorization: Bearer <token>`.

---

## Configuration

| Variable            | Default                              | Notes                                  |
| ------------------- | ------------------------------------ | -------------------------------------- |
| `PORT`              | `4000`                               | API port (5000 is taken by macOS)      |
| `ADMIN_EMAIL`       | `temu.estate@gmail.com`              | Seeded admin login                     |
| `ADMIN_PASSWORD`    | `Admin123!` (development fallback)   | **Change this before sharing the app** |
| `CORS_ORIGINS`      | `http://localhost:5173,...`          | Comma-separated allowed origins        |
| `VITE_API_BASE_URL` | `http://localhost:4000/api`          | API base used by the browser           |

Image limits: 12 photos per listing, 5 MB per uploaded file; the editor
compresses before upload, so real photos are far smaller.

---

## Scripts

| Command         | What it does                                      |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | API with watch mode + Vite dev server             |
| `npm run build` | Production build into `dist/`                     |
| `npm start`     | Run the API (and serve `dist/` when present)      |
| `npm run lint`  | ESLint over the client and server source          |
| `npm run preview` | Preview the Vite build                          |

## Notes for handover

- Change `ADMIN_PASSWORD` in `.env` before showing the dashboard to the client,
  then restart the API.
- To reset the demo data, stop the server and delete `server/data/` and the
  contents of `server/uploads/`; the next boot re-seeds the portfolio.
- `.env` is git-ignored. Never commit real credentials or bot tokens.
- Uploaded photos live on disk under `server/uploads/`; back that folder up
  together with `server/data/`.
