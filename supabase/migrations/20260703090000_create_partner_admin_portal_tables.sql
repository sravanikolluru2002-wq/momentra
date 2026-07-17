create extension if not exists pgcrypto;

create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  business_name text not null,
  phone_number text not null unique,
  city text not null,
  category text not null,
  status text not null default 'submitted',
  status_note text,
  admin_note text,
  kyc_status text not null default 'submitted',
  kyc_note text,
  payment_status text not null default 'pending',
  payment_total numeric(12,2) not null default 0,
  visibility_status text not null default 'draft',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  partner_profile_id uuid not null references public.partner_profiles(id) on delete cascade,
  owner_name text,
  summary text not null,
  status text not null default 'open',
  priority text not null default 'amber',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payout_batches (
  id uuid primary key default gen_random_uuid(),
  partner_profile_id uuid not null references public.partner_profiles(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  status text not null default 'held',
  release_eta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists partner_profiles_set_updated_at on public.partner_profiles;
create trigger partner_profiles_set_updated_at
before update on public.partner_profiles
for each row execute function public.set_updated_at();

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

drop trigger if exists payout_batches_set_updated_at on public.payout_batches;
create trigger payout_batches_set_updated_at
before update on public.payout_batches
for each row execute function public.set_updated_at();

alter table public.partner_profiles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.support_tickets enable row level security;
alter table public.payout_batches enable row level security;

drop policy if exists "portal_partner_profiles_read_write" on public.partner_profiles;
create policy "portal_partner_profiles_read_write"
on public.partner_profiles
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "portal_admin_profiles_read_write" on public.admin_profiles;
create policy "portal_admin_profiles_read_write"
on public.admin_profiles
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "portal_support_tickets_read_write" on public.support_tickets;
create policy "portal_support_tickets_read_write"
on public.support_tickets
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "portal_payout_batches_read_write" on public.payout_batches;
create policy "portal_payout_batches_read_write"
on public.payout_batches
for all
to anon, authenticated
using (true)
with check (true);

alter publication supabase_realtime add table public.partner_profiles;
alter publication supabase_realtime add table public.admin_profiles;
alter publication supabase_realtime add table public.support_tickets;
alter publication supabase_realtime add table public.payout_batches;
