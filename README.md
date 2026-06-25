# UniSalon Monorepo

> Zomato-style salon & barbershop discovery and booking platform for India.

## Stack

- **Runtime**: Bun  
- **Monorepo**: Turborepo + Bun Workspaces
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3
- **Backend**: Bun + Elysia
- **ORM**: Prisma
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Deploy**: Vercel (frontends) + Render (API)

## Apps

| App | Description | URL |
|---|---|---|
| `apps/web` | Customer portal | unisalon.in |
| `apps/shop` | Shop owner portal | shop.unisalon.in |
| `apps/admin` | Admin dashboard | admin.unisalon.in |
| `apps/api` | REST API | api.unisalon.in |

## Packages

| Package | Description |
|---|---|
| `packages/db` | Prisma schema + generated client |
| `packages/types` | Shared TypeScript types + Zod schemas |
| `packages/ui` | Shared React component library |
| `packages/config` | Shared ESLint + TS configs |

## Getting Started

Follow these steps to set up and run the UniSalon monorepo locally.

### 1. Install Dependencies

Install the workspace packages using Bun:

```bash
bun install
```

### 2. Configure Environment Variables

Create the `.env` files for the API and client applications from their respective templates:

```bash
# Copy API environment variables template
cp apps/api/.env.example apps/api/.env

# Copy client applications environment templates
cp apps/web/.env.example apps/web/.env
cp apps/shop/.env.example apps/shop/.env
cp apps/admin/.env.example apps/admin/.env
```

Open `apps/api/.env` and fill in the required credentials:
- **Supabase credentials**: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (from your Supabase Project Settings -> API / Database).
- **Google Maps API**: `GOOGLE_MAPS_API_KEY` (ensure you have Geocoding, Places, and Maps JS APIs enabled).
- **Resend**: `RESEND_API_KEY` (for transactional booking emails).

Open client `.env` files (e.g. `apps/web/.env`) and set:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (defaults to `http://localhost:3001` for local development)
- `VITE_GOOGLE_MAPS_KEY` (for the Google Map loader in search/explore pages)

### 3. Initialize the Database

Make sure your Supabase instance is running and accessible. Then run:

```bash
# Generate the Prisma Client
bun run db:generate

# Push the schema changes and run database migrations
bun run db:migrate
```

*Note: You can also start the Prisma Studio dashboard locally to view database tables:*
```bash
bun run --cwd packages/db db:studio
```

### 4. Run the Dev Servers

To start all the applications concurrently (API and all three web portals):

```bash
bun run dev
```

The apps will boot on the following ports:
- 🌐 **Customer Portal**: [http://localhost:5173](http://localhost:5173)
- 🏬 **Shop Owner Portal**: [http://localhost:5174](http://localhost:5174)
- 👑 **Admin Portal**: [http://localhost:5175](http://localhost:5175)
- 🔌 **Elysia API Server**: [http://localhost:3001](http://localhost:3001) (Swagger docs available at [http://localhost:3001/swagger](http://localhost:3001/swagger))

---

## Running Specific Portals

If you only want to run a specific portal alongside the API to save resources, you can use Turborepo filters:

```bash
# Run ONLY the Customer Portal + API (if API is needed)
bun run dev --filter @unisalon/web --filter @unisalon/api

# Run ONLY the Shop Owner Portal
bun run dev --filter @unisalon/shop

# Run ONLY the Admin Portal
bun run dev --filter @unisalon/admin
```

---

## Troubleshooting Common Errors

### 1. `Could not resolve workspaces. Missing packageManager field in package.json`
* **Why it happens**: Some versions/environments of Bun or Turborepo fail to resolve the package manager correctly when running `bun dev` directly because of command conflicts.
* **Resolution**: Run `bun run dev` explicitly. The `run` subcommand forces Bun to lookup the exact package.json scripts configuration with the proper workspace resolution.

### 2. `error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars`
* **Why it happens**: The API server requires Supabase credentials to handle user logins, DB connections, and token authentication.
* **Resolution**: Ensure you have copied `apps/api/.env.example` to `apps/api/.env` and filled in all variables. If you are starting the API server, double check that your active terminal has the env vars loaded or they are defined correctly in `apps/api/.env`.

### 3. `Failed to load PostCSS config ... ReferenceError: module is not defined in ES module scope`
* **Why it happens**: Node/Vite treats `.js` config files as ES modules because the package.json has `"type": "module"`. Using `module.exports` inside a `.js` file causes a crash.
* **Resolution**: All configuration files in this repository have been renamed to use the `.cjs` extension (e.g. `postcss.config.cjs` and `tailwind.config.cjs`). If you still see this error, check if you have any untracked or stale `.js` files in your local directory and delete or rename them.

---

## Key Features

- 🗺️ **Geolocation-first** — GPS → district picker + Google Maps fallback
- 🎭 **BookMyShow slot holds** — 90-second atomic seat hold prevents double-booking
- 👥 **Multi-staff** — per-barber scheduling with photo profiles
- ⏱️ **Service-duration-aware slots** — computed on-the-fly, no pre-stored slots
- 🔔 **Real-time notifications** — Supabase Realtime for shop owner dashboard
- ✅ **Cash at shop** — no online payment complexity

