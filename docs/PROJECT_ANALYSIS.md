# Project Analysis — Dylan’s Detailing Service

> **Historical snapshot (late 2025).** This document describes the **Supabase + Netlify** site before the Firebase rebuild. It is not how the repo works today.
>
> Current stack, setup, admin, Firestore, and deploy: **[README.md](../README.md)**.

Stage 1 technical assessment of the existing repository. No UI rebuild has been started.

**Business (from existing site copy only):** Dylan’s Detailing Service, Wellington, New Zealand. Studio drop-off (not mobile). Owner referred to as Dylan. Live site: `https://dds.harryludemann.com/`. Prices displayed in NZD with GST included. No payment is taken online.

---

## 1. What already exists

### Stack

| Area | Implementation |
| --- | --- |
| Framework | Vite 7 (rolldown-vite) + React 19 + TypeScript |
| Routing | `react-router-dom` v7 with `BrowserRouter` |
| Styling | Tailwind CSS v4, PostCSS |
| Backend | Supabase (Postgres + Auth + RLS). Browser client only |
| Hosting | SPA. Netlify-style `public/_redirects` (`/* → /index.html 200`) |
| Rendering | Client-side SPA. No SSR, no SSG, no server actions, no API routes |

There is no Next.js, no backend server in this repo, and no second Supabase project.

### Public routes (wired in `src/App.tsx`)

| Path | Page | Data source |
| --- | --- | --- |
| `/` | `Home.tsx` | `useServices()` for first 3 services; rest is hardcoded |
| `/book` | `Book.tsx` | Supabase `services` + RPC `get_available_starts` + insert into `bookings` |
| `/interior` | `Interior.tsx` | Hardcoded copy + `/images/interior.webp` |
| `/paint` | `Paint.tsx` | Hardcoded copy + `/images/paint.webp` |
| `/glass` | `Glass.tsx` | Hardcoded copy + `/images/glass.webp` |
| `/privacy` | `Privacy.tsx` | Static legal copy |
| `/cookies` | `Cookies.tsx` | Static legal copy |
| `/terms` | `Terms.tsx` | Static legal copy |

Catch-all `*` redirects to `/`.

### Admin routes (wired)

| Path | Page |
| --- | --- |
| `/admin/login` | Email/password via `supabase.auth.signInWithPassword` |
| `/admin` | Dashboard links |
| `/admin/services` | CRUD for `services` |
| `/admin/availability` | Weekly hours in `availability_rules` |
| `/admin/bookings` | List bookings, quoted price in `meta`, delete |

Admin pages are wrapped in `AdminGate`, which checks `profiles.is_admin`.

### Files that exist but are not routed / unused

These are leftover or parallel implementations. They must not be treated as the live public site:

- `src/pages/public/Services.tsx` — full services listing, **not in the router**
- `src/pages/admin/AdminPackages.tsx` — package editor, **not in the router**
- `src/pages/admin/AdminDashboard.tsx` + `AdminShell.tsx` — unused admin chrome
- `src/routes/ProtectedAdminRoute.tsx` — unused; `AdminGate` is what actually protects admin
- `src/components/layout/Header.tsx` — leftover template (`Author Name`, `/books`, `/booking`)
- `src/components/layout/Footer.tsx` — unused; footer lives inside `Shell`
- `src/components/brand/Logo.tsx`, `DDSLogo.tsx`, `DDSWordmark.tsx` — unused
- `src/hooks/usePackages.ts`, `src/hooks/useSession.ts`, `src/utils/packageUi.ts` — no live consumers

### Dependencies (runtime)

`@supabase/supabase-js`, `react`, `react-dom`, `react-router-dom`, `clsx`, `date-fns`, `date-fns-tz`.

No animation library, no calendar widget, no image CDN, no CMS besides Supabase.

---

## 2. What should be reused

Keep these as the foundation. Adapt the new public site to them; do not rebuild them.

| Piece | Why |
| --- | --- |
| Existing Supabase project | Explicit requirement. Do not create a new one. |
| `src/utils/supabase.ts` | Single browser client. Uses publishable/anon key only. |
| Env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` |
| Tables | `services`, `packages`, `availability_rules`, `bookings`, `profiles` |
| RPCs | `get_available_starts`, `is_within_availability`, `is_admin` |
| RLS policies | Public read of active services/packages; public insert of bookings under constraints; admin manage |
| Auth | Email/password + `profiles.is_admin` |
| Admin pages | `/admin/*` as the owner’s source of truth |
| Booking insert contract | `service_id`, `start_at`, `end_at`, customer fields, `vehicle`, `notes`, `meta`, `status: 'confirmed'` |
| `useServices()` | Public data hook already filters `active = true` and orders by `sort_order` |
| Types in `src/types/db.ts` | Extend, do not replace |
| `src/utils/format.ts` | NZ timezone, money, duration |
| `src/utils/tax.ts` | GST included (15%) |
| Legal page content | Privacy / cookies / terms already match the booking model |
| Static photos | `public/images/{interior,paint,glass}.webp` |
| Netlify `_redirects`, `robots.txt`, favicons | Hosting/SEO plumbing |
| Confirmed business facts | Name, Wellington, studio drop-off, Dylan, GST, no online payment |

---

## 3. What should be replaced

The public-facing experience should be rebuilt, not restyled.

| Replace | Reason |
| --- | --- |
| Public layout (`Shell` header/footer/menu for public routes) | Current chrome is generic indigo SaaS, not a premium studio site |
| Homepage (`Home.tsx`) | Card-heavy, gradient orbs, template FAQ layout |
| Booking UI (`Book.tsx` presentation) | Keep the **logic and insert path**; replace the visual/UX shell |
| `/interior`, `/paint`, `/glass` | Hardcoded marketing pages that do not map 1:1 to live `services` rows |
| Public navigation | Almost none today (Home + Book CTA only) |
| Visual design system for the public site | Indigo buttons, `rounded-3xl`, blur blobs, system UI font |
| Public SEO presentation | Client-side `document.title` is fine to keep conceptually; page titles, OG, sitemap, and structured data need a real page set |
| Unused template leftovers listed above | Do not carry them into the new public tree |

**Do not** restyle shared admin UI components in place to serve both products. New public components should live in a new tree (see architecture).

---

## 4. What should remain untouched

Unless a later stage finds a hard technical blocker:

- Admin routes and admin page files
- Authentication flow (`AdminLogin`, `AdminGate`, `profiles`)
- Database tables, constraints, and RLS
- `get_available_starts` / overlap exclusion / duration-based slot generation
- Booking insert shape and `meta` fields the admin bookings page already reads
- Environment variable names
- Service-role / secret keys (none should ever be added to the client)
- Admin-managed service fields: title, subtitle, summary, description, includes, ideal_for, duration_mins, price_cents, active, sort_order

If a shared file is used by admin **and** public (`Button`, `Card`, `supabase.ts`, hooks), prefer:

- leave the file as-is for admin, **or**
- extract a tiny data helper and keep admin imports stable

Do not “upgrade” `Button.tsx` into the new brand if admin still imports it.

---

## 5. Database tables / schema that are relevant

Source of truth in-repo: `src/supabase/schema.sql`.

**Warning:** that file begins by dropping all public views, tables, and functions. It is a reset script, not a migration to run casually against production.

### `profiles`

| Column | Notes |
| --- | --- |
| `id` | `auth.users.id` |
| `is_admin` | Admin gate |
| `created_at` | |

Trigger `handle_new_user` inserts a non-admin profile on signup.

### `services` — **public catalogue + bookable products**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Used as `?service=` on `/book` |
| `title` | text | |
| `subtitle` | text | Often duration range copy |
| `summary` | text | Card blurb |
| `description` | text | Longer copy; admin-editable, barely used on public site |
| `includes` | text[] | |
| `ideal_for` | text[] | |
| `duration_mins` | int ≥ 15 | Drives slot length and `end_at` |
| `price_cents` | int | Starting price |
| `active` | bool | RLS: public can only `select` active rows |
| `sort_order` | int | |
| `created_at` | timestamptz | |

**Not present (requested in the brief, do not invent blindly):** `slug`, `featured`, `image`, add-ons.

Seeded examples (may already have been edited in production):

1. Express Wash + Vac — from $90, 60 min
2. Maintenance Detail — from $160, 120 min
3. Full Detail Inside + Out — from $350, 240 min
4. Deep Clean / Restoration Detail — from $495, 420 min
5. Wellington Protection Package — from $450, 360 min

### `packages` — parallel catalogue with **fixed codes**

| Column | Notes |
| --- | --- |
| `code` | PK: `exterior_refresh`, `interior_refresh`, `full_detail`, `full_interior`, `paint_enhancement` |
| `title`, `subtitle`, `summary`, `includes`, `ideal_for` | Marketing copy |
| `from_price_cents` | |
| `active` | |
| `service_id` | Optional FK to `services` for schedule mapping |

This duplicates `services`. The live public booking UI uses **`services` only**. `usePackages()` is unused. `AdminPackages` is unused. Treat `services` as the source of truth for the new site unless production data later proves otherwise.

### `availability_rules`

Weekly working hours in `Pacific/Auckland`. Unique partial index: one **active** rule per day-of-week (`dow` 0=Sun … 6=Sat). Admin deactivate-then-reactivate pattern exists to avoid that constraint.

### `bookings`

| Column | Notes |
| --- | --- |
| `service_id` | FK, `on delete restrict` |
| `start_at`, `end_at` | `end_at` must equal `start_at + duration_mins` for public insert |
| `customer_name`, `customer_email` | Required |
| `customer_phone`, `vehicle`, `notes` | Optional in DB; vehicle size is required in the current UI |
| `status` | `confirmed` \| `cancelled` |
| `meta` | jsonb: service title/price, tax breakdown, vehicle size, preferred window, quoted price |

GiST exclusion prevents overlapping **confirmed** bookings.

### RPCs

- `get_available_starts(p_service_id, p_from, p_to, p_step_mins)` — granted to `anon` and `authenticated`
- `is_within_availability(start, end)` — used by the bookings insert RLS policy

### What does **not** exist

- Add-ons table
- Gallery / before-after table
- Customers table (customer data lives on the booking row)
- Vehicle-type pricing table
- Image columns or Storage buckets in schema
- Contact / location table
- Site-settings / CMS table

---

## 6. Existing Supabase integration

### Client

Single client: `src/utils/supabase.ts`.

```ts
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
```

If either is missing, the app still boots with a placeholder URL/key so the page does not crash; bookings/admin then fail with a banner. There is **no `.env` in the workspace** at analysis time (file is gitignored). Local booking verification will need keys.

There is no service-role client, no Edge Functions in this repo, and no generated `Database` types.

### How the public site reads data

1. `useServices()` → `supabase.from("services").select("*").eq("active", true).order(...)`
2. 60s in-memory cache + refetch on focus / `dds_services_updated`
3. If Supabase is not configured, it falls back to hardcoded `src/catalog/packages.ts` (using package **codes** as fake ids — those cannot be booked)

### How the public site writes data

`Book.tsx` inserts one row into `bookings`. RLS requires:

- `status = 'confirmed'`
- `start_at > now()`
- matching active service duration
- start/end inside an active availability window

No payment provider. Confirmation copy: Dylan will message to confirm drop-off time.

### How admin communicates with Supabase

| Action | API |
| --- | --- |
| Login | `auth.signInWithPassword` then `profiles.is_admin` |
| Services | `select/insert/update/delete` on `services` (admin RLS) |
| Availability | deactivate-all-for-dow then update/insert |
| Bookings | `select` with `service:services(title)`, `update meta`, `delete` |

Admin save of a service also writes `localStorage.dds_services_updated_at` and dispatches `dds_services_updated` so an open public tab can refresh.

---

## 7. Existing booking functionality

Custom wizard in `src/pages/public/Book.tsx` (~1,200 lines). Not a third-party calendar.

| Step | Behaviour |
| --- | --- |
| 1 Service | Active services from Supabase. Optional `?service=<uuid>` |
| 2 Schedule | RPC slots for ~22 days, grouped by NZ date. Drop-off windows: Early / Mid / Afternoon / Late / Any. Default = earliest time in window; optional exact time |
| 3 Details | Name*, email*, phone, vehicle size* (Small / Medium / Large / XL), notes |
| 4 Review | Summary + insert |

Vehicle size is **UI-only** (stored on `bookings.vehicle` and `meta.vehicle_size`). It does not change price in the database.

Add-ons are **not** in the schema or UI. Do not invent an add-on step unless the schema is extended later for a clear reason.

Availability timezone is `Pacific/Auckland` throughout (`NZ_TZ`).

---

## 8. Technical problems and inconsistencies

1. **Dual catalogues.** `services` and `packages` overlap. Public booking uses `services`. Packages admin is disconnected. New public site should read `services` only.
2. **No slugs or images on services.** Brief wants `/services/[slug]` and per-service images. Must be derived (slugify title; map static photos) before considering a schema change.
3. **Hardcoded “service” pages.** `/interior`, `/paint`, `/glass` are not rows in `services`. They will confuse a data-driven `/services` IA.
4. **SPA performance/SEO ceiling.** No SSR/SSG. Meta tags are patched in `useEffect`. Fine to keep Vite for stability; do not claim Next-level SSR without a framework change.
5. **Fabricated SEO rating.** `index.html` and `SEO.tsx` emit `aggregateRating` 5 / 10 reviews. That is invented. Remove it. Do not invent awards, phone, street address, or years of experience either.
6. **Copy conflict.** `DDSLogo` subtitle says “Mobile detailing”. Homepage FAQ says studio drop-off only. Trust the FAQ / footer: **studio drop-off**.
7. **Dangerous schema file.** `schema.sql` drops the entire public schema. Never run it against production as part of this rebuild.
8. **Shared UI risk.** Public and admin share `Button`, `Card`, `Input`, etc. Restyling them would restyle admin. New public primitives should be separate.
9. **Dead code and duplicate layout.** Unused Header/admin shells increase the chance of editing the wrong file.
10. **`Services.tsx` not routed.** A services index already exists conceptually but is unreachable.
11. **No contact details.** No public phone, email, or street address in the repo. `/contact` must not invent them.
12. **No gallery CMS.** Only three local webp files. Featured work should use those, not fake before/afters.
13. **Catalog fallback uses non-UUID ids.** Offline fallback services cannot satisfy booking FKs.
14. **`any` usage** in booking RPC mapping, admin catch blocks, and `Booking.meta`.
15. **Uncommitted local changes** (at analysis time) in `supabase.ts`, hooks, `Shell`, and `Book.tsx` — mostly env-key / empty-config safety. Confirm whether they should ship with the rebuild.
16. **No `.env` present** in this workspace, so live Supabase data could not be inspected from here.

---

## Proposed architecture (Stage 2)

Goal: new public site, same backend/admin.

### Integration approach

Keep the Vite + React Router SPA. Migrating to Next.js would re-platform admin, auth, and hosting for little gain right now. Performance work stays inside Vite: route-level code splitting, image optimisation, less client JS.

```
EXISTING (untouched unless required)
  Supabase project, DB, RLS, RPCs, Auth
  src/pages/admin/*
  src/utils/supabase.ts
  src/hooks/useServices.ts (reuse / thin extract)
  src/types/db.ts
  src/utils/format.ts, tax.ts

NEW PUBLIC SITE
  src/pages/site/*          new routes
  src/components/site/*     layout, marketing, booking UI, gallery
  src/lib/site/*            slugify, booking helpers, SEO data
```

Admin continues to use existing pages and (for now) existing `components/ui`. Public pages must not import those if we are going to restyle them.

### Routing plan

| New public path | Source |
| --- | --- |
| `/` | New homepage; featured services = first N active `services` by `sort_order` |
| `/services` | All active services from Supabase |
| `/services/:slug` | Same table; slug derived from title (see below) |
| `/gallery` | Existing `public/images/*` only |
| `/about` | Existing FAQ / process / studio-drop-off facts. No invented history |
| `/book` | New UI around **existing** booking pipeline |
| `/contact` | Wellington + studio drop-off + booking CTA. No invented phone/email |
| `/privacy`, `/cookies`, `/terms` | Keep content; restyle |
| `/admin/*` | Unchanged |

`/interior`, `/paint`, `/glass` should redirect to the matching live service if a title match exists, otherwise to `/services`. Do not leave three hardcoded marketing pages as the IA.

### Data rules

- **Catalogue:** `services` only. `active = false` → hidden and not bookable (RLS already enforces public read).
- **Prices / duration / copy / includes:** always from Supabase. Never hardcode package prices in components.
- **Slugs without a schema change:** `slugify(title)` (stable, unique-enough for this catalogue). If two titles collide, suffix with a short id. Add a `slug` column later only if collisions or admin-edited URLs become a real problem.
- **Images without Storage:** map known titles or sort order to `public/images/*` where possible; otherwise a typographic/empty visual state. Do not add Storage or image columns until the owner actually has more photos to manage.
- **Add-ons:** omit. Schema has none.
- **Vehicle type:** keep the existing select and persist to `vehicle` / `meta`. No price matrix in DB.
- **Booking:** extract RPC + insert helpers from `Book.tsx` into a small module used by the new wizard. Same columns, same `meta` keys the admin bookings UI already displays.
- **Packages table:** leave in the database; do not drive the new public UI from it.

### Layout split

`App.tsx` should stop wrapping **admin** in the public `Shell`. Public routes get a new site chrome; admin routes keep a minimal wrapper (current `AdminGate` + current page layout is enough). That is the main shared-code change, and it is necessary so the new navigation cannot break admin.

### SEO / a11y (later stages)

- Real titles and descriptions from business + service titles
- Remove fake `aggregateRating`
- Update `sitemap.xml` for the new paths
- JSON-LD `LocalBusiness` with only known facts (Wellington, NZ, detailing, studio)
- Keyboard, labels, focus, `prefers-reduced-motion`

### Schema changes — default is none

Do not add tables for gallery, add-ons, or slugs in the first build. Adapt the app to the current schema.

### Admin compatibility checklist

After the public rebuild, an owner should still be able to:

1. Change a service price in `/admin/services` → public cards and booking show “From $X”
2. Change duration → slot length and displayed duration update
3. Set `active = false` → service disappears from public lists and cannot be booked
4. Edit title/summary/includes → service pages update
5. Change weekly hours → `get_available_starts` updates
6. See new bookings in `/admin/bookings` with the same meta (window, vehicle size, quoted price)

---

## Recommended build order (unchanged from the brief)

1. ~~Analyse~~ — this document
2. Architecture — this section; proceed only with the constraints above
3. Public design system (new files, not admin `Button`/`Card`)
4. Homepage
5. Services index + `[slug]`
6. Gallery (existing images)
7. Booking UI on existing infrastructure
8. Admin integration check
9. Performance (code split, images; no framework rewrite)
10. QA (desktop/mobile, empty/error/loading, a11y, SEO, booking, admin)

---

## Open facts (do not invent)

These are **not** in the repository. Do not fabricate them on the new site:

- Street address / suburb
- Phone number
- Public email
- Opening hours as marketing copy (hours live in `availability_rules`)
- Years in business, awards, product brands, team bios
- Review counts / ratings
- Additional photography beyond the three webp files and favicons
