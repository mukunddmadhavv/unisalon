# UniSalon — Production Deployment & Launch Guide

This guide details the step-by-step procedure to deploy the UniSalon monorepo applications to production using **Supabase, Render, Vercel, Resend, and Google Cloud Console**.

---

## 1. Supabase Database & Realtime Setup

### Create a Supabase Project
1. Log in to [Supabase Console](https://supabase.com) and click **New Project**.
2. Select your Organization, set the database name to `unisalon`, choose a secure password, and select a hosting region closest to India (e.g., *Mumbai* or *Singapore*).

### Configure Storage Bucket (`shop-images`)
We use Supabase Storage to store shop cover pictures and staff photos.
1. In the Supabase sidebar, go to **Storage**.
2. Click **New bucket** and name it `shop-images`.
3. Set the bucket privacy toggle to **Public** (so customers can view photos without generating signed URLs).
4. Run the following Row-level Security (RLS) SQL policies in the **SQL Editor** to allow verified vendors to upload photos under their own subfolder:

```sql
-- Allow public SELECT access to all images
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Allow authenticated users to insert images
CREATE POLICY "Allow authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

-- Allow users to update their own subfolder files
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images');

-- Allow users to delete their own subfolder files
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images');
```

### Enable Database Replication for Realtime Holds
We utilize Supabase Realtime to broadcast slot locks to all viewing customer browsers.
1. In the Supabase sidebar, click on **Database** -> **Replication**.
2. Under the `supabase_realtime` publication, click **Source**.
3. Toggle on replication for the `slot_holds` table.

---

## 2. Database Migrations (Prisma)

To push the database schema to your Supabase PostgreSQL instance:
1. Fetch your transaction connection string from **Project Settings** -> **Database** (e.g., `postgres://postgres.xxxx:[pwd]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`).
2. Run the deployment migration command from the monorepo root:

```bash
DATABASE_URL="your-supabase-connection-string" bun run --cwd packages/db db:migrate:deploy
```

---

## 3. API Server Deployment (Render)

We host the Elysia REST API on **Render** utilizing Bun's native execution.

### Create a Web Service
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New** -> **Web Service**.
2. Link your Github monorepo.
3. Configure the following parameters:
   * **Name**: `unisalon-api`
   * **Runtime**: `Node` (we will use Bun manually or use Render's native Bun support if available)
   * **Build Command**: `bun install`
   * **Start Command**: `bun run --cwd apps/api start`
   * **Instance Type**: `Free` or `Starter`
4. Add the following **Environment Variables** in the Service Dashboard:

| Variable | Value Description |
|---|---|
| `DATABASE_URL` | Supabase Postgres Connection String |
| `SUPABASE_URL` | Your Supabase Project URL (`https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Server Service Key (Service Role JWT) |
| `SUPABASE_ANON_KEY` | Supabase Public Client Key |
| `RESEND_API_KEY` | Transactional email key from Resend dashboard |
| `ADMIN_EMAILS` | Comma-separated list of admin emails (e.g., `mukund@unisalon.in`) |
| `HOLD_EXPIRY_SECONDS` | `90` |
| `NODE_ENV` | `production` |

---

## 4. Frontend Portals Deployment (Vercel)

We deploy the three client interfaces as separate projects on **Vercel**.

### A. Customer Portal (`apps/web`)
1. Click **New Project** in Vercel and import your repository.
2. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `apps/web`
   * **Build Command**: `bun run build`
   * **Install Command**: `bun install`
   * **Output Directory**: `dist`
3. Environment variables:
   * `VITE_SUPABASE_URL`: Supabase project URL.
   * `VITE_SUPABASE_ANON_KEY`: Supabase anon client key.
   * `VITE_API_URL`: Your Render API URL (e.g. `https://unisalon-api.onrender.com`).

### B. Shop Owner Portal (`apps/shop`)
1. Click **New Project** in Vercel.
2. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `apps/shop`
   * **Build Command**: `bun run build`
   * **Install Command**: `bun install`
   * **Output Directory**: `dist`
3. Environment variables:
   * `VITE_SUPABASE_URL`: Supabase project URL.
   * `VITE_SUPABASE_ANON_KEY`: Supabase anon client key.
   * `VITE_API_URL`: Your Render API URL.

### C. Admin Portal (`apps/admin`)
1. Click **New Project** in Vercel.
2. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `apps/admin`
   * **Build Command**: `bun run build`
   * **Install Command**: `bun install`
   * **Output Directory**: `dist`
3. Environment variables:
   * `VITE_SUPABASE_URL`: Supabase project URL.
   * `VITE_SUPABASE_ANON_KEY`: Supabase anon client key.
   * `VITE_API_URL`: Your Render API URL.

---

## 5. Third-Party Integrations

### Resend Email setup
1. Register on [Resend](https://resend.com) and add your domain (e.g. `unisalon.in`).
2. Verify domain ownership using the DNS TXT/MX records supplied in the Resend dashboard.
3. Generate an API Key and add it to Render API's `RESEND_API_KEY` variable.

### Google Maps Cloud API Setup
We use Google Maps for shop Geolocation searching.
1. Log in to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project and configure a Billing account.
3. In the sidebar, go to **APIs & Services** -> **Library**, and enable:
   * **Maps JavaScript API**
   * **Places API**
   * **Geocoding API**
4. Go to **Credentials** -> **Create Credentials** -> **API Key**.
5. Click on the generated key to edit restrictions:
   * Under **Application restrictions**, choose **Websites**.
   * Under **Website restrictions**, add production referrers:
     * `*.unisalon.in/*`
     * `*.vercel.app/*` (for staging previews)
   * Under **API restrictions**, restrict key calls to only the 3 enabled Maps APIs.
6. Provide this restricted key to your frontend apps using Vercel's `VITE_GOOGLE_MAPS_KEY` environment variable.
