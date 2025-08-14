-- Enable required extensions
create extension if not exists pgcrypto;

-- Profiles table linked 1:1 with auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'patient' check (role in ('patient','doctor','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Patients table aligned to auth.users and using JSONB for encrypted data
create table if not exists public.patients (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  date_of_birth date not null,
  encrypted_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Anamnesis table
create table if not exists public.anamnesis (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete cascade,
  reason_for_visit text not null,
  symptoms text not null,
  duration text not null,
  ai_summary text,
  ai_recommendations jsonb,
  created_at timestamptz default now()
);

-- Consultations table
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete cascade,
  anamnesis_id uuid references public.anamnesis (id) on delete cascade,
  status text default 'pending',
  doctor_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Audit log table (service role inserts)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  user_id uuid,
  timestamp timestamptz default now()
);

-- updated_at triggers for profiles and patients
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

-- RLS will be enabled and policies added in a subsequent migration

