create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists momentra_id text;

create or replace function public.generate_momentra_id(profile_id uuid)
returns text
language sql
immutable
as $$
  select 'MOM-' || upper(substr(replace(profile_id::text, '-', ''), 1, 8));
$$;

update public.profiles
set momentra_id = public.generate_momentra_id(id)
where momentra_id is null;

create unique index if not exists profiles_momentra_id_key
  on public.profiles(momentra_id)
  where momentra_id is not null;

create or replace function public.set_profiles_momentra_id()
returns trigger
language plpgsql
as $$
begin
  if new.id is null then
    new.id = gen_random_uuid();
  end if;

  if new.momentra_id is null then
    new.momentra_id = public.generate_momentra_id(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists set_profiles_momentra_id on public.profiles;

create trigger set_profiles_momentra_id
before insert on public.profiles
for each row
execute function public.set_profiles_momentra_id();

create table if not exists public.profile_circle_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  receiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  message text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_circle_requests_not_self check (requester_profile_id <> receiver_profile_id)
);

create index if not exists profile_circle_requests_receiver_idx
  on public.profile_circle_requests(receiver_profile_id, status, created_at desc);

create index if not exists profile_circle_requests_requester_idx
  on public.profile_circle_requests(requester_profile_id, status, created_at desc);

create unique index if not exists profile_circle_requests_pair_pending_key
  on public.profile_circle_requests (
    least(requester_profile_id, receiver_profile_id),
    greatest(requester_profile_id, receiver_profile_id)
  )
  where status = 'pending';

create table if not exists public.profile_circle_members (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  member_profile_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.profile_circle_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint profile_circle_members_not_self check (owner_profile_id <> member_profile_id)
);

create unique index if not exists profile_circle_members_owner_member_key
  on public.profile_circle_members(owner_profile_id, member_profile_id);

create table if not exists public.shared_payment_plans (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  total_amount bigint not null check (total_amount >= 0),
  split_type text not null default 'equal' check (split_type in ('equal', 'custom')),
  threshold bigint not null default 1 check (threshold >= 1),
  status text not null default 'threshold_pending' check (status in ('collecting', 'confirmed', 'completed', 'threshold_pending', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_payment_plans_owner_idx
  on public.shared_payment_plans(owner_profile_id, created_at desc);

create table if not exists public.shared_payment_members (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.shared_payment_plans(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  share_amount bigint not null default 0 check (share_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'declined')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists shared_payment_members_plan_profile_key
  on public.shared_payment_members(plan_id, profile_id);

drop trigger if exists set_profile_circle_requests_updated_at on public.profile_circle_requests;

create trigger set_profile_circle_requests_updated_at
before update on public.profile_circle_requests
for each row
execute function public.set_profiles_updated_at();

drop trigger if exists set_shared_payment_plans_updated_at on public.shared_payment_plans;

create trigger set_shared_payment_plans_updated_at
before update on public.shared_payment_plans
for each row
execute function public.set_profiles_updated_at();

do $$
begin
  alter publication supabase_realtime add table public.profile_circle_requests;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.profile_circle_members;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.shared_payment_plans;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.shared_payment_members;
exception
  when duplicate_object then null;
end;
$$;

notify pgrst, 'reload schema';
