## Supabase Migration TODO

We will migrate all data and authentication to Supabase and remove the local Postgres/Redis setup. Reference: [Supabase](https://supabase.com/).

Project ref: `olgoxxaznwvxtuvmaiyd`

### 1) Prerequisites and project link
- [X] Install the Supabase CLI (macOS):
  - `brew install supabase/tap/supabase`
- [X] Login to Supabase CLI:
  - `supabase login` (paste access token from dashboard → Account Settings → Access Tokens)
- [X] Link this repo to the Supabase project:
  - `supabase link --project-ref olgoxxaznwvxtuvmaiyd`

### 2) Environment variables
- [X] In Supabase Dashboard → Project Settings → API, copy:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [X] Create/update `.env.local` and `.env` with:
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...` (server-only)
  - Remove old DB vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, `REDIS_URL` if unused.

### 3) Dependencies
- [X] Add Supabase SDK and Next.js helpers:
  - `yarn add @supabase/supabase-js @supabase/auth-helpers-nextjs`
- [X] Remove old packages no longer needed:
  - `yarn remove pg next-auth redis` (redis only if truly unused)

### 4) Define/align database schema in Supabase
- [X] Create a new migration from current schema (converted for Supabase):
  - `supabase db diff --use-migra --local --schema public --file 2025-xx-initial.sql` (optional), or
  - Create a new migration file under `supabase/migrations/` that contains the tables below.
- [X] Update schema to use Supabase-friendly UUID generation (`gen_random_uuid()` via `pgcrypto`) instead of `uuid_generate_v4()`:

  - Enable extensions:
    - `create extension if not exists pgcrypto;`
  - Tables (adapt from `database/init/01-init.sql`):
    - `profiles` (NEW):
      - `user_id uuid primary key references auth.users(id) on delete cascade`
      - `role text not null default 'patient' check (role in ('patient','doctor','admin'))`
      - `created_at timestamptz default now()`
      - `updated_at timestamptz default now()`
    - `patients`:
      - Change `id` to `uuid primary key references auth.users(id) on delete cascade` (1:1 with the authenticated user)
      - Keep columns: `name text not null`, `date_of_birth date not null`, `encrypted_data jsonb`, timestamps
    - `anamnesis`:
      - `id uuid primary key default gen_random_uuid()`
      - `patient_id uuid references patients(id) on delete cascade`
      - `reason_for_visit text not null`, `symptoms text not null`, `duration text not null`
      - `ai_summary text`, `ai_recommendations jsonb`, `created_at timestamptz default now()`
    - `consultations`:
      - `id uuid primary key default gen_random_uuid()`
      - `patient_id uuid references patients(id) on delete cascade`
      - `anamnesis_id uuid references anamnesis(id) on delete cascade`
      - `status text default 'pending'`, `doctor_notes text`, `reviewed_at timestamptz`, `created_at timestamptz default now()`
    - `audit_log`:
      - `id uuid primary key default gen_random_uuid()`
      - `table_name text not null`, `record_id uuid not null`, `action text not null`
      - `old_values jsonb`, `new_values jsonb`, `user_id uuid`, `timestamp timestamptz default now()`
    - Triggers: update `updated_at` for `patients` and `profiles`.

### 5) Row-Level Security (RLS) policies
- [X] Enable RLS on all tables: `alter table ... enable row level security;`
- [X] `profiles` policies:
  - Insert: allow only service role to insert (created on sign-up via server code) OR use trigger to auto-insert profile on `auth.users` insert.
  - Select/Update: user can select/update their own profile: `auth.uid() = user_id`.
- [X] `patients` policies:
  - Insert: allow the authenticated user to insert only their own row: `auth.uid() = id`.
  - Select/Update/Delete (self): `auth.uid() = id`.
  - Read for doctors/admins: allow if user is in `profiles` with `role in ('doctor','admin')`.
- [X] `anamnesis` policies:
  - Insert: allow if `auth.uid() = patient_id` OR requester is `doctor/admin`.
  - Select/Update/Delete: owner or `doctor/admin`.
- [X] `consultations` policies:
  - Read/Write: patient owner or `doctor/admin`; status transitions restricted as needed.
- [X] `audit_log` policies:
  - Read: only `admin`.
  - Insert: allow service role only (app server writes logs).

### 6) Auth settings (Dashboard)
- [X] Enable Email/Password and Magic Links in Dashboard → Authentication → Providers.
- [X] Configure SMTP for magic links (or use Supabase defaults for testing).
- [X] Set redirect URLs for Next.js (e.g., `http://localhost:3000` during dev).

### 7) Add Supabase clients (app + server)
- [X] Create `src/lib/supabase/browser.ts` with `createBrowserClient` using `NEXT_PUBLIC_*` envs.
- [X] Create `src/lib/supabase/server.ts` using `createServerClient` from `@supabase/auth-helpers-nextjs` integrating cookies.
- [X] Optional: a thin wrapper for service role usage on server-only API routes where needed (never expose to browser).

### 8) Replace NextAuth/custom JWT with Supabase Auth
- [X] Remove NextAuth usage (routes/middleware if present) and any custom JWT issuance.
- [X] Add `middleware.ts` (if needed) to protect routes using Supabase `getUser()` on the server.
- [X] Update protected pages in `src/app/**` to read session via `@supabase/auth-helpers-nextjs`.
- [X] On sign-up, create `patients` and `profiles` rows (default role `patient`) via server action/webhook.

### 9) Repository refactor to Supabase queries
Refactor `src/repositories/*.ts` to use Supabase `from(table)` instead of `pg`:
- [X] Replace `src/lib/database.ts` usages with Supabase server client.
- [X] `PatientRepository`: CRUD via `supabase.from('patients')...` ensuring JSON mapping for `encrypted_data`.
- [X] `AnamnesisRepository`: CRUD via `supabase.from('anamnesis')...` (JSON for `ai_recommendations`).
- [X] `ConsultationRepository`: CRUD/queries via `supabase.from('consultations')...`; for joins, either:
  - Use `.select('..., patients(*), anamnesis(*)')` with foreign key relationships, or
  - Create Postgres views/RPCs for complex aggregations.
- [X] `AuditLogger`: write to `audit_log` using service role client on server.

### 10) API route updates
- [X] Update `src/app/api/**/route.ts` to use the Supabase server client.
- [X] Remove direct SQL strings; rely on Supabase filters and RPCs.
- [X] Ensure all mutations include `user_id` from `auth` and write to `audit_log` server-side.

### 11) Remove old infrastructure/config
- [X] Delete `src/lib/database.ts` and any `pg` imports.
- [X] Remove local Postgres and Redis from `docker-compose.yml` (keep app service only) and delete `database/init/*`.
- [X] Remove unused env keys related to Postgres/Redis from `Dockerfile.*` and compose files.

### 12) Data migration (optional)
- [ ] If any existing local/dev data must be preserved, export and import into Supabase via SQL or CSV.
- [ ] Otherwise, seed initial data (optional) via `supabase db push` and a seed script.

### 13) Tests and QA
- [ ] Update unit tests to mock Supabase client.
- [ ] Run `yarn ci` to ensure type checks, lint, tests, and build are green.
- [ ] Manual QA flows:
  - Sign-up (email/password) → `profiles` row role `patient` → `patients` row created.
  - Magic link login works; session available server-side.
  - Patient can CRUD own anamnesis, see own consultations.
  - Doctor/admin (manually set role in `profiles`) can see all relevant records.

### 14) Rollout
- [ ] Update README with Supabase setup instructions and envs.
- [ ] Ensure Production env vars are set in the hosting platform.
- [ ] Verify RLS policies in Production using the Dashboard Policy Simulator.

### Commands quick-reference
```bash
# Install deps
yarn add @supabase/supabase-js @supabase/auth-helpers-nextjs
yarn remove pg next-auth redis

# Supabase CLI
supabase login
supabase link --project-ref olgoxxaznwvxtuvmaiyd
supabase db push
```

### Notes
- Prefer `gen_random_uuid()` over `uuid_generate_v4()` on Supabase.
- Use the service role key only on the server (never expose to the browser).
- Consider Postgres views/RPCs for complex joins (improves DX and keeps RLS centralized).
