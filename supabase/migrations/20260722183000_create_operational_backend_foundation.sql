create extension if not exists pgcrypto;

create table if not exists public.momentra_enquiries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  firebase_uid text,
  phone_number text,
  source text not null default 'app',
  enquiry_type text not null default 'general',
  occasion_id text,
  experience_id text,
  experience_title text,
  venue text,
  city text,
  booking_date text,
  booking_time text,
  guests bigint,
  estimated_total bigint,
  requirements jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  food_items jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'confirmed', 'cancelled', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists momentra_enquiries_status_created_idx
  on public.momentra_enquiries(status, created_at desc);

create index if not exists momentra_enquiries_profile_created_idx
  on public.momentra_enquiries(profile_id, created_at desc);

create index if not exists momentra_enquiries_phone_created_idx
  on public.momentra_enquiries(phone_number, created_at desc);

create table if not exists public.momentra_content_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  collection_type text not null default 'catalog',
  status text not null default 'demo' check (status in ('demo', 'draft', 'review', 'live', 'hidden')),
  city text,
  sort_order bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.momentra_catalog_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.momentra_content_collections(id) on delete set null,
  slug text not null unique,
  title text not null,
  item_type text not null default 'experience',
  status text not null default 'demo' check (status in ('demo', 'draft', 'review', 'live', 'hidden')),
  occasion_id text,
  city text,
  venue text,
  price bigint,
  price_label text,
  capacity bigint,
  duration text,
  description text,
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  inclusions jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  food_menu jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  sort_order bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists momentra_catalog_items_status_occ_idx
  on public.momentra_catalog_items(status, occasion_id, sort_order);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  booking_id uuid,
  enquiry_id uuid references public.momentra_enquiries(id) on delete set null,
  provider text not null default 'razorpay',
  provider_order_id text,
  amount bigint not null default 0,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded')),
  metadata jsonb not null default '{}'::jsonb,
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

drop trigger if exists set_momentra_enquiries_updated_at on public.momentra_enquiries;
create trigger set_momentra_enquiries_updated_at
before update on public.momentra_enquiries
for each row execute function public.set_updated_at();

drop trigger if exists set_momentra_content_collections_updated_at on public.momentra_content_collections;
create trigger set_momentra_content_collections_updated_at
before update on public.momentra_content_collections
for each row execute function public.set_updated_at();

drop trigger if exists set_momentra_catalog_items_updated_at on public.momentra_catalog_items;
create trigger set_momentra_catalog_items_updated_at
before update on public.momentra_catalog_items
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_orders_updated_at on public.payment_orders;
create trigger set_payment_orders_updated_at
before update on public.payment_orders
for each row execute function public.set_updated_at();

alter table public.momentra_enquiries enable row level security;
alter table public.momentra_content_collections enable row level security;
alter table public.momentra_catalog_items enable row level security;
alter table public.payment_orders enable row level security;

drop policy if exists "momentra_enquiries_app_read_write" on public.momentra_enquiries;
create policy "momentra_enquiries_app_read_write"
on public.momentra_enquiries
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "momentra_content_public_read_write" on public.momentra_content_collections;
create policy "momentra_content_public_read_write"
on public.momentra_content_collections
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "momentra_catalog_public_read_write" on public.momentra_catalog_items;
create policy "momentra_catalog_public_read_write"
on public.momentra_catalog_items
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "payment_orders_app_read_write" on public.payment_orders;
create policy "payment_orders_app_read_write"
on public.payment_orders
for all
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.momentra_enquiries;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.momentra_catalog_items;
exception
  when duplicate_object then null;
end;
$$;

insert into public.momentra_content_collections (slug, title, collection_type, status, sort_order)
values
  ('demo-occasions', 'Demo occasions ready for client content', 'occasion_catalog', 'demo', 1),
  ('demo-experiences', 'Demo experiences ready for client content', 'experience_catalog', 'demo', 2)
on conflict (slug) do update
set title = excluded.title,
collection_type = excluded.collection_type,
status = excluded.status,
sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
