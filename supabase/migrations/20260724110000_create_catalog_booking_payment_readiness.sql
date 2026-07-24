create extension if not exists pgcrypto;

create table if not exists public.momentra_venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  city text not null default 'Vizag',
  area text,
  address text,
  venue_type text not null default 'partner venue',
  status text not null default 'demo' check (status in ('demo', 'draft', 'review', 'live', 'hidden')),
  capacity_min bigint,
  capacity_max bigint,
  price_label text,
  description text,
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  amenities jsonb not null default '[]'::jsonb,
  partner_profile_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  sort_order bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.momentra_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  occasion_id text not null,
  venue_id uuid references public.momentra_venues(id) on delete set null,
  title text not null,
  city text not null default 'Vizag',
  status text not null default 'demo' check (status in ('demo', 'draft', 'review', 'live', 'hidden')),
  package_type text not null default 'experience',
  price bigint,
  price_label text,
  minimum_guests bigint,
  capacity bigint,
  duration text,
  short_description text,
  description text,
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  inclusions jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  sort_order bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.momentra_addons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  addon_type text not null default 'service',
  status text not null default 'demo' check (status in ('demo', 'draft', 'review', 'live', 'hidden')),
  price bigint,
  price_label text,
  description text,
  icon_label text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.momentra_package_addons (
  package_id uuid not null references public.momentra_packages(id) on delete cascade,
  addon_id uuid not null references public.momentra_addons(id) on delete cascade,
  included boolean not null default false,
  sort_order bigint not null default 0,
  primary key (package_id, addon_id)
);

create table if not exists public.momentra_food_menu_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  food_type text not null default 'veg',
  category text not null default 'main',
  status text not null default 'demo' check (status in ('demo', 'draft', 'review', 'live', 'hidden')),
  price bigint,
  price_label text,
  description text,
  dietary_tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.momentra_package_food_items (
  package_id uuid not null references public.momentra_packages(id) on delete cascade,
  food_item_id uuid not null references public.momentra_food_menu_items(id) on delete cascade,
  included boolean not null default false,
  sort_order bigint not null default 0,
  primary key (package_id, food_item_id)
);

create table if not exists public.momentra_bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  enquiry_id uuid references public.momentra_enquiries(id) on delete set null,
  package_id uuid references public.momentra_packages(id) on delete set null,
  venue_id uuid references public.momentra_venues(id) on delete set null,
  firebase_uid text,
  phone_number text,
  booking_reference text not null unique default ('MOM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title text not null,
  city text,
  booking_date text,
  booking_time text,
  guests bigint,
  estimated_total bigint not null default 0,
  selected_requirements jsonb not null default '[]'::jsonb,
  selected_addons jsonb not null default '[]'::jsonb,
  selected_food_items jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'requested', 'quoted', 'pending_payment', 'confirmed', 'completed', 'cancelled', 'refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'failed', 'refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists momentra_venues_status_city_idx on public.momentra_venues(status, city, sort_order);
create index if not exists momentra_packages_status_occ_idx on public.momentra_packages(status, occasion_id, sort_order);
create index if not exists momentra_addons_status_type_idx on public.momentra_addons(status, addon_type, sort_order);
create index if not exists momentra_food_items_status_category_idx on public.momentra_food_menu_items(status, category, sort_order);
create index if not exists momentra_bookings_profile_created_idx on public.momentra_bookings(profile_id, created_at desc);
create index if not exists momentra_bookings_status_created_idx on public.momentra_bookings(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_momentra_venues_updated_at on public.momentra_venues;
create trigger set_momentra_venues_updated_at
before update on public.momentra_venues
for each row execute function public.set_updated_at();

drop trigger if exists set_momentra_packages_updated_at on public.momentra_packages;
create trigger set_momentra_packages_updated_at
before update on public.momentra_packages
for each row execute function public.set_updated_at();

drop trigger if exists set_momentra_addons_updated_at on public.momentra_addons;
create trigger set_momentra_addons_updated_at
before update on public.momentra_addons
for each row execute function public.set_updated_at();

drop trigger if exists set_momentra_food_items_updated_at on public.momentra_food_menu_items;
create trigger set_momentra_food_items_updated_at
before update on public.momentra_food_menu_items
for each row execute function public.set_updated_at();

drop trigger if exists set_momentra_bookings_updated_at on public.momentra_bookings;
create trigger set_momentra_bookings_updated_at
before update on public.momentra_bookings
for each row execute function public.set_updated_at();

alter table public.momentra_venues enable row level security;
alter table public.momentra_packages enable row level security;
alter table public.momentra_addons enable row level security;
alter table public.momentra_food_menu_items enable row level security;
alter table public.momentra_package_addons enable row level security;
alter table public.momentra_package_food_items enable row level security;
alter table public.momentra_bookings enable row level security;

drop policy if exists "momentra_venues_demo_read" on public.momentra_venues;
create policy "momentra_venues_demo_read" on public.momentra_venues
for select to anon, authenticated using (status in ('demo', 'live'));

drop policy if exists "momentra_packages_demo_read" on public.momentra_packages;
create policy "momentra_packages_demo_read" on public.momentra_packages
for select to anon, authenticated using (status in ('demo', 'live'));

drop policy if exists "momentra_addons_demo_read" on public.momentra_addons;
create policy "momentra_addons_demo_read" on public.momentra_addons
for select to anon, authenticated using (status in ('demo', 'live'));

drop policy if exists "momentra_food_items_demo_read" on public.momentra_food_menu_items;
create policy "momentra_food_items_demo_read" on public.momentra_food_menu_items
for select to anon, authenticated using (status in ('demo', 'live'));

drop policy if exists "momentra_package_addons_demo_read" on public.momentra_package_addons;
create policy "momentra_package_addons_demo_read" on public.momentra_package_addons
for select to anon, authenticated using (true);

drop policy if exists "momentra_package_food_items_demo_read" on public.momentra_package_food_items;
create policy "momentra_package_food_items_demo_read" on public.momentra_package_food_items
for select to anon, authenticated using (true);

drop policy if exists "momentra_bookings_app_read_write" on public.momentra_bookings;
create policy "momentra_bookings_app_read_write" on public.momentra_bookings
for all to anon, authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.momentra_venues;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.momentra_packages;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.momentra_bookings;
exception
  when duplicate_object then null;
end;
$$;

notify pgrst, 'reload schema';
