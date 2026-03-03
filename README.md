## Digital Signage Admin (Internal)

Internal admin dashboard to manage **regions**, **devices**, **playlists**, **assets**, and **device → playlist assignments**.

### Tech

- Next.js (App Router) + JavaScript
- Supabase Auth (email/password) + RLS enforced access
- Supabase Storage (private bucket `signage-assets`)
- Tailwind CSS
- Zod validation + React Hook Form (client forms)

### Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: safe for browser usage.
- `SUPABASE_SERVICE_ROLE_KEY`: **server-only**. This repo never exposes it to the browser.

### Security model

- All `/dashboard/*` routes require authentication (middleware).
- `/dashboard` layout additionally checks admin role via `public.is_admin()`:
  - not signed in → redirect to `/login`
  - signed in but not admin → redirect to `/not-authorized`
- Most DB operations use **anon + session** so **RLS enforces access**.
- **Service role** is used only for privileged operations:
  - `POST /api/admin/devices`: generate random device key, store **SHA-256 hash** in `devices.device_key_hash`, return plaintext key once
  - `POST /api/admin/storage/sign-url`: create short-lived signed URLs for private assets previews

### Database schema assumptions

The app uses these exact existing tables (RLS enabled and admin-only policies via `public.is_admin()`):

- `public.profiles`
- `public.regions`
- `public.devices`
- `public.playlists`
- `public.assets`
- `public.playlist_items`
- `public.device_playlist_assignments`

### Local dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Vercel deploy

Set the same environment variables in Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

