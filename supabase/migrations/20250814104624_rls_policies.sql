-- Enable Row-Level Security on all tables
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.anamnesis enable row level security;
alter table public.consultations enable row level security;
alter table public.audit_log enable row level security;

-- Drop existing policies to prevent conflicts
drop policy if exists "user_can_access_own_profile" on public.profiles;
drop policy if exists "user_can_update_own_profile" on public.profiles;
drop policy if exists "user_can_insert_own_patient_record" on public.patients;
drop policy if exists "user_can_manage_own_patient_record" on public.patients;
drop policy if exists "doctor_admin_can_read_patients" on public.patients;
drop policy if exists "user_can_manage_own_anamnesis" on public.anamnesis;
drop policy if exists "doctor_admin_can_manage_anamnesis" on public.anamnesis;
drop policy if exists "user_can_access_own_consultations" on public.consultations;
drop policy if exists "doctor_admin_can_manage_consultations" on public.consultations;
drop policy if exists "admin_can_read_audit_log" on public.audit_log;

-- Helper function to get user role from profiles table
create or replace function get_user_role(user_id uuid)
returns text as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where public.profiles.user_id = $1;
  return user_role;
end;
$$ language plpgsql security definer;

-- profiles policies
create policy "user_can_access_own_profile" on public.profiles for select
  using (auth.uid() = user_id);
create policy "user_can_update_own_profile" on public.profiles for update
  using (auth.uid() = user_id);

-- patients policies
create policy "user_can_insert_own_patient_record" on public.patients for insert
  with check (auth.uid() = id);
create policy "user_can_manage_own_patient_record" on public.patients for all
  using (auth.uid() = id);
create policy "doctor_admin_can_read_patients" on public.patients for select
  using (get_user_role(auth.uid()) in ('doctor', 'admin'));

-- anamnesis policies
create policy "user_can_manage_own_anamnesis" on public.anamnesis for all
  using (auth.uid() = patient_id);
create policy "doctor_admin_can_manage_anamnesis" on public.anamnesis for all
  using (get_user_role(auth.uid()) in ('doctor', 'admin'));

-- consultations policies
create policy "user_can_access_own_consultations" on public.consultations for select
  using (auth.uid() = patient_id);
create policy "doctor_admin_can_manage_consultations" on public.consultations for all
  using (get_user_role(auth.uid()) in ('doctor', 'admin'));

-- audit_log policies (only service_role can insert, only admin can read)
create policy "admin_can_read_audit_log" on public.audit_log for select
  using (get_user_role(auth.uid()) = 'admin');
-- Note: Inserts should only be done via a service_role client.
