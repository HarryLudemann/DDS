-- Extensions
create extension if not exists pgcrypto;

-- Profiles (admin flag)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Products: books + services
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('book','service')),
  title text not null,
  slug text not null unique,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'NZD',
  cover_url text,
  buy_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Availability slots
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists availability_slots_start_at_idx on public.availability_slots (start_at);

-- Bookings (one booking per slot)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now(),
  unique (slot_id)
);

create index if not exists bookings_created_at_idx on public.bookings (created_at);

-- View: available slots (no bookings, future, available)
create or replace view public.available_slots as
select s.*
from public.availability_slots s
where
  s.is_available = true
  and s.start_at > now()
  and not exists (select 1 from public.bookings b where b.slot_id = s.id);

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;

-- Helper: is admin?
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

-- PROFILES
create policy "profiles: user can read self"
on public.profiles for select
to authenticated
using (id = auth.uid());

-- PRODUCTS
create policy "products: public read active"
on public.products for select
to anon, authenticated
using (active = true);

create policy "products: admin manage"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- AVAILABILITY
create policy "slots: public read available only"
on public.availability_slots for select
to anon, authenticated
using (
  is_available = true
  and start_at > now()
  and not exists (select 1 from public.bookings b where b.slot_id = availability_slots.id)
);

create policy "slots: admin manage"
on public.availability_slots for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- BOOKINGS
create policy "bookings: public insert if slot is still available"
on public.bookings for insert
to anon, authenticated
with check (
  exists (select 1 from public.products p where p.id = product_id and p.active = true)
  and exists (
    select 1 from public.availability_slots s
    where s.id = slot_id
      and s.is_available = true
      and s.start_at > now()
      and not exists (select 1 from public.bookings b where b.slot_id = s.id)
  )
);

create policy "bookings: admin read"
on public.bookings for select
to authenticated
using (public.is_admin());

create policy "bookings: admin update"
on public.bookings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
