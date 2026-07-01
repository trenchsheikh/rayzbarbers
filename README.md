# Rayz Barbers Booking System

Full-stack booking app for Rayz Barbers — customer landing page, 5-step booking modal with manual approval, and barber admin dashboard.

Built from the Claude Design prototype in [`design/`](design/).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** — Postgres database
- **Drizzle ORM** — schema & migrations
- **Stripe** — manual-capture payments (charged on approve)
- **Resend** — booking notification emails

## Quick start

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.local.example` to `.env.local` and fill in values.

### 3. Database

Create a [Supabase](https://supabase.com) project and copy the **Postgres connection string** (Session mode / direct) into `DATABASE_URL`.

Push schema and seed services:

```bash
npm run db:push
npm run db:seed
```

### 4. Admin login

Barber dashboard at `/admin/login` — default credentials:

- **Username:** `ray`
- **Password:** `pass`

Override with `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and set `ADMIN_SESSION_SECRET` in production.

### 5. Stripe

Create a Stripe account. Use test keys in `.env.local`.

For webhooks (optional in dev):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Online bookings use **manual capture** — card is authorized at request time and captured when Ray approves in the admin dashboard.

### 6. Run

```bash
npm run dev
```

- Customer site: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Deploy (Vercel + Supabase)

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all env vars from `.env.local.example`
4. Update Supabase auth redirect URLs to your production domain
5. Point Stripe webhook to `https://your-domain.com/api/webhooks/stripe`

## Project structure

```
src/
  app/              # Pages & API routes
  components/       # Landing, booking modal, admin UI
  lib/              # DB, Stripe, availability, notifications
design/             # Claude Design prototype (reference)
drizzle/            # Generated migrations
```

## Booking flow

1. Customer picks service → date/time → payment (online or cash) → contact details
2. Request saved as **pending**
3. Ray approves or declines in `/admin`
4. Online payments captured on approve; cancelled on decline
5. Customer receives email if address provided

## Design reference

Original interactive prototype: `design/Rayz Barbers Prototype.dc.html`  
Open in a browser (with `design/support.js` alongside) to compare UI behavior.
