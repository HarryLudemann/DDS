# DDS — Dylan’s Detailing Service

Public website and studio admin for **DDS**, a Wellington, New Zealand **studio drop-off** car detailing business.

- Live: [https://dds.harryludemann.com](https://dds.harryludemann.com)
- Firebase Hosting: [https://dylans-detailing-service.web.app](https://dylans-detailing-service.web.app)
- Firebase project: `dylans-detailing-service`

Customers book a drop-off online. **No payment is taken on the site.** Prices are **NZD, GST included**. Hours, packages, and bookings are edited in `/admin` and shown on the public site.

---

## Contents

1. [Stack](#stack)
2. [Local setup](#local-setup)
3. [Environment variables](#environment-variables)
4. [First-time Firebase + first admin](#first-time-firebase--first-admin)
5. [How the app is structured](#how-the-app-is-structured)
6. [Data (Firestore)](#data-firestore)
7. [Where to change things](#where-to-change-things)
8. [Deploy](#deploy)
9. [SEO and sharing](#seo-and-sharing)
10. [Gotchas](#gotchas)
11. [Do not](#do-not)
12. [Legacy files](#legacy-files)

---

## Stack

| Piece | What we use |
| --- | --- |
| App | Vite 7 (rolldown) + React 19 + TypeScript |
| Routing | `react-router-dom` (`BrowserRouter`) |
| CSS | Tailwind CSS v4, `src/index.css` |
| Backend | Firebase Auth + Cloud Firestore (browser SDK only) |
| Hosting | Firebase Hosting — SPA rewrite to `index.html` |
| Timezone | `Pacific/Auckland` (`src/utils/format.ts`) |

There is **no** Node API, **no** SSR, and **no** online checkout. Firestore security rules in `firestore.rules` are the server.

---

## Local setup

Needs Node.js 20+ and npm.

```bash
npm install
copy .env.example .env
```

Fill `.env` from Firebase Console → Project settings → Your apps → SDK snippet. Then:

```bash
npm run dev
```

Opens at `http://localhost:5173`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local site with HMR |
| `npm run build` | Typecheck + production bundle (also writes per-route HTML for crawlers) |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |
| `npm run deploy` | Build, then deploy hosting + Firestore rules + RTDB rules |

On **PowerShell**, chain commands with `;` not `&&`. `npm run …` scripts are fine as written.

Restart `npm run dev` after changing any `VITE_*` variable — Vite only reads them at startup.

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env`. **Never commit `.env`.** Keys are public in the built JS (that is normal for Firebase web apps). Protection is Firestore rules + Auth, plus API-key HTTP-referrer restrictions in Google Cloud if you want extra lock-down.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | Yes | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Usually `{projectId}.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `dylans-detailing-service` |
| `VITE_FIREBASE_APP_ID` | Yes | Web app id |
| `VITE_FIREBASE_STORAGE_BUCKET` | No* | From the SDK snippet |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No* | From the SDK snippet |
| `VITE_FIREBASE_DATABASE_URL` | No | Realtime Database is unused; rules deny all |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Analytics only if you enable it |

\*Include them so the client matches the console snippet. The app treats Firebase as configured when **apiKey, projectId, and appId** are set (`src/utils/firebase.ts`).

Without keys, the public catalogue falls back to `src/catalog/packages.ts` and booking availability will not load.

Vite inlines these at **build** time. Production Hosting only gets the keys that were in `.env` when you ran `npm run build` / `npm run deploy`.

---

## First-time Firebase + first admin

Do this once per Firebase project.

1. In [Firebase Console](https://console.firebase.google.com/) open `dylans-detailing-service`.
2. Enable **Authentication → Email/Password**.
3. Enable **Cloud Firestore** (production mode is fine — this repo’s rules are the ACL).
4. Deploy rules at least once: `npx firebase-tools deploy --only firestore:rules,database --project dylans-detailing-service`
5. Create the first Auth user (Authentication → Users → Add user).
6. Sign in at `/admin/login`. The app creates `profiles/{uid}` with `is_admin: false`.
7. In Firestore, edit that document and set **`is_admin` to `true`**.
8. Sign in again. You should land on `/admin`.

Rules only allow a signed-in user to create their own profile with `is_admin == false`. Promoting someone is a Console (or existing-admin) change. Do not add a self-serve “make me admin” button.

On **Services**, if the list is empty, use **Load default catalogue**. That seeds packages from `src/catalog/packages.ts` and 8am–5pm hours for every weekday. It **does nothing** if any service already exists.

---

## How the app is structured

```
public/                 Static files copied as-is (images, og.jpg, robots.txt, sitemap)
src/pages/public/       Customer-facing pages
src/pages/admin/        /admin workspace (bookings, services, hours, editors)
src/components/site/    Public layout, cards, fields
src/lib/firebase/       Firestore reads/writes (`store.ts`)
src/lib/site/           Hours, booking slots, SEO, JSON-LD, live cache invalidation
src/catalog/packages.ts Fallback + seed catalogue
src/hooks/              Services, hours, session, admin
src/utils/firebase.ts   Firebase init
firestore.rules         Who can read/write what
firebase.json           Hosting + rules wiring
vite.seo.ts             Writes dist/{path}/index.html for link crawlers
```

### Public routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/services` | Package list (live from Firestore) |
| `/services/:slug` | Package detail |
| `/book` | Booking (package → time → details → review) |
| `/gallery` | Photos |
| `/about` | Studio |
| `/contact` | Contact; if unsure, still book |
| `/privacy` `/cookies` `/terms` | Legal |
| `/interior` `/paint` `/glass` | Redirect to `/gallery` |

### Admin routes

| Path | Page |
| --- | --- |
| `/admin/login` | Email/password |
| `/admin` | Workspace. `?tab=bookings` (default), `services`, `hours` |
| `/admin/services/new` | New package |
| `/admin/services/:id` | Edit package |

Admin is `noindex`. `robots.txt` disallows `/admin`.

### Booking (customer)

1. Pick a package → advances.
2. Pick a start window (from hours + existing bookings, next ~22 days, 15-minute steps).
3. Name, email, phone, optional NZ plate, notes.
4. Review and submit.

Stored as a Firestore `bookings` doc with `status: "confirmed"`. Plate is in `vehicle` and `meta.plate`. Admin listings link plates to CarJam (`https://www.carjam.co.nz/car/?plate=`).

There is no vehicle-size picker. Duration comes from the service’s `duration_mins`.

---

## Data (Firestore)

| Collection | Public | Admin |
| --- | --- | --- |
| `services` | Read **active** docs | Full CRUD |
| `availabilityRules` | Read all | Create / update / deactivate |
| `bookings` | Create if `status` is `confirmed` and start is in the future | Read / update / delete |
| `profiles` | Own profile create (`is_admin: false`) | Read others; only admin can set `is_admin` |

`availabilityRules` use `dow` 0 = Sunday … 6 = Saturday, times as `HH:MM:SS`, `effective_from` as `YYYY-MM-DD` in NZ. Hours panel writes the current week’s open/closed days; those times drive the footer, Contact, JSON-LD opening hours, and bookable slots.

Realtime Database is **not** used for app data. `database.rules.json` denies all.

After an admin save, `src/lib/site/live.ts` pokes `localStorage` and window events so the same browser tab refreshes services/hours. Other visitors pick up changes on the next fetch (availability cache TTL is 60s).

---

## Where to change things

| You want to… | Edit |
| --- | --- |
| Legal / display name, city, canonical URL | `src/lib/site/constants.ts` (`SITE`) |
| Page titles, meta descriptions, share titles | `src/lib/site/seo.ts` |
| Open Graph image | `public/og.jpg` (1200×630 JPEG) |
| Brand colours, type | `src/index.css` (stone `#f2f1ee`, ink `#161616`, Outfit) |
| Header / footer / cookie banner | `src/components/site/layout/` |
| Public copy (home, about, contact, legal) | `src/pages/public/` |
| GST labelling | `src/utils/tax.ts` (currently `gst_included`, 15%) |
| Fallback packages before Firestore exists | `src/catalog/packages.ts` |
| Live packages, prices, inclusions, hours | `/admin` — not hardcoded pages |
| Gallery / hero photos | `src/lib/site/media.ts` + files in `public/images/` |
| Firestore ACL | `firestore.rules` then deploy rules |
| Hosting SPA fallback | `firebase.json` → `hosting.rewrites` |
| Crawler HTML copies | `vite.seo.ts` + `SEO_PAGES` in `seo.ts` |
| Sitemap / robots | `public/sitemap.xml`, `public/robots.txt` |

---

## Deploy

Firebase CLI is not always on PATH. Prefer:

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore,database --project dylans-detailing-service
```

`npm run deploy` does the same if the `firebase` binary is installed globally.

Hosting serves `dist/`. `firebase.json` rewrites every path to `/index.html` so React Router works. Deploying **firestore** publishes `firestore.rules`. Deploying **database** publishes the deny-all RTDB rules.

Confirm after deploy:

- Public pages and `/book`
- `/admin` sign-in
- A Messenger / iMessage share of the homepage (should show `og.jpg`, not a random photo)

Facebook Sharing Debugger can refresh the cache if a share preview is stale.

---

## SEO and sharing

The site is a client-rendered SPA. Crawlers that do not run JS would only see `index.html`. `vite.seo.ts` copies `dist/index.html` to `dist/{path}/index.html` for each entry in `SEO_PAGES`, with that page’s title, description, canonical URL, and Open Graph tags.

Canonical host is `SITE.baseUrl` (`https://dds.harryludemann.com`). JSON-LD for LocalBusiness is in `src/lib/site/jsonld.ts`. **Do not invent** a street address, phone number, or star rating in schema or copy.

---

## Gotchas

- **Mobile menu:** the overlay is portaled to `document.body` (`SiteHeader`) so `backdrop-filter` on the header does not clip the links. Do not put the overlay back inside a filtered parent.
- **Hours vs booking:** closed days and start/end times in admin are what customers can book. If slots look empty, check hours and that Firebase keys are present.
- **Seed is one-shot:** “Load default catalogue” skips if any `services` document exists.
- **Windows + Firebase CLI:** use `npx firebase-tools`, not a bare `firebase`, unless it is on PATH.
- **Photos:** `public/images/*.webp` were added without a licence or EXIF. Treat them as **not cleared** for “our work” until you replace them with studio shots or licensed stock. Favicons and the Outfit font are fine.
- **Cookie banner:** first-party only (consent flag). Copy must stay “no ads, no tracking.”

---

## Do not

- Invent a phone number, street address, or review score.
- Take card payments in this app without a new product decision and PCI-aware flow.
- Commit `.env`, service-account JSON, or Firebase CI tokens.
- Market the public site as first-name “Dylan” — legal name stays in `SITE.name`; wordmark and UI are **DDS**.
- Weaken `firestore.rules` so bookings or profiles are world-writable.
- Point the app at a second Firebase or Supabase project “just for staging” without documenting it here.

---

## Legacy files

These are leftover from earlier iterations. **Do not use them as the source of truth.**

| Path | Why it is still here |
| --- | --- |
| `src/utils/supabase.ts` | Unused. Backend is Firebase. |
| `src/pages/admin/AdminHome.tsx` | Old dashboard. Live admin is `AdminWorkspace`. |
| `src/components/layout/Shell.tsx` | Old chrome. Public shell is `SiteShell`. |
| `public/_redirects` | Netlify leftover. Hosting uses `firebase.json`. |
| `docs/PROJECT_ANALYSIS.md` | Snapshot from before the Firebase rebuild. |

SPA hosting notes (Firebase, plus Apache/Nginx if you ever leave Hosting) are in [`SERVER_CONFIG.md`](SERVER_CONFIG.md).
