-- Extensions
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
declare
  r record;
begin
  -- Drop views
  for r in (
    select table_name
    from information_schema.views
    where table_schema = 'public'
  ) loop
    execute format('drop view if exists public.%I cascade;', r.table_name);
  end loop;

  -- Drop tables
  for r in (
    select tablename
    from pg_tables
    where schemaname = 'public'
  ) loop
    execute format('drop table if exists public.%I cascade;', r.tablename);
  end loop;

  -- Drop remaining public functions (includes RPCs)
  for r in (
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  ) loop
    execute 'drop function if exists ' || r.sig || ' cascade;';
  end loop;
end $$;

-- Profiles (admin flag)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.profiles (id, is_admin)
select u.id, false
from auth.users u
on conflict (id) do nothing;

-- Services (unified - combines packages and services)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  summary text,
  description text,
  includes text[] not null default '{}',
  ideal_for text[] not null default '{}',
  duration_mins integer not null check (duration_mins >= 15),
  price_cents integer not null default 0 check (price_cents >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from public.services) then
    insert into public.services (title, subtitle, summary, description, includes, ideal_for, duration_mins, price_cents, active, sort_order)
    values
      (
        'Express Wash + Vac',
        'Quick turnaround (45–75 min)',
        'A fast wash + tidy-up for busy weeks. Starting price varies by vehicle size.',
        'A fast wash + tidy-up for busy weeks. Starting price varies by vehicle size.',
        array['Hand wash','Wheels / tyres quick clean','Exterior windows','Quick interior vacuum + wipe of dash / console'],
        array['Weekly / fortnightly customers','Busy people','Rideshare'],
        60, 9000, true, 10
      ),
      (
        'Maintenance Detail',
        'Most popular (1.5–2.5 hrs)',
        'For regular customers who want their car always nice. Starting price varies by vehicle size.',
        'For regular customers who want their car always nice. Starting price varies by vehicle size.',
        array['Thorough wash + wheels / arches','Door jambs','Full vacuum','Plastics wiped','Glass inside + out','Light interior detail','Optional spray sealant (1–3 months)'],
        array['Regular customers','Keep it always nice'],
        120, 16000, true, 20
      ),
      (
        'Full Detail Inside + Out',
        'Full reset (3–5 hrs)',
        'The full reset for most one-off customers. Starting price varies by vehicle size + condition — Dylan confirms after a quick look (or photos).',
        'The full reset for most one-off customers. Starting price varies by vehicle size + condition — Dylan confirms after a quick look (or photos).',
        array['Full exterior wash + decon (bug / tar)','Wheels / arches','Interior detailed clean','Glass','Trim dressings','Short-term paint protection (sealant)'],
        array['Pre-sale','Haven''t cleaned it in a while','Most one-off customers'],
        240, 35000, true, 30
      ),
      (
        'Deep Clean / Restoration Detail',
        'Neglected vehicles (5–8+ hrs)',
        'For pet hair, sand/mud, stains, kids, smokers, and heavy build-up. Pricing is inspection-based (confirmed after an in-person look).',
        'For pet hair, sand/mud, stains, kids, smokers, and heavy build-up. Pricing is inspection-based (confirmed after an in-person look).',
        array['Everything in Full Detail','Seats / carpets shampoo + extraction (as needed)','Heavy pet hair removal (as needed)','Deeper plastics / crevices','More intensive exterior decon'],
        array['Pet hair','Sand/mud','Stains','Kids','Smokers'],
        420, 49500, true, 40
      ),
      (
        'Wellington Protection Package',
        'Detail + longer protection (4–7 hrs)',
        'Full Detail plus longer-lasting protection for Wellington conditions. Sealant packages start from $450 — entry ceramic starts from $900+ (varies by paint correction needs).',
        'Full Detail plus longer-lasting protection for Wellington conditions. Sealant packages start from $450 — entry ceramic starts from $900+ (varies by paint correction needs).',
        array['Full Detail Inside + Out','Paint sealant (6–12 months) or entry ceramic option','Glass treatment'],
        array['Parking outside','Coastal commuters','Keep it easy to wash'],
        360, 45000, true, 50
      );
  end if;
end $$;

-- Packages (fixed codes; editable content)
create table if not exists public.packages (
  code text primary key,
  title text not null,
  subtitle text,
  summary text,
  includes text[] not null default '{}',
  ideal_for text[] not null default '{}',
  from_price_cents integer not null default 0,
  active boolean not null default true,
  service_id uuid references public.services(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  update public.packages p
  set service_id = s.id
  from public.services s
  where p.service_id is null
    and lower(trim(p.title)) = lower(trim(s.title));
end $$;

do $$
declare
  s_express uuid;
  s_maint uuid;
  s_full uuid;
  s_deep uuid;
  s_protect uuid;
begin
  if not exists (select 1 from public.packages) then
    select id into s_express from public.services where title = 'Express Wash + Vac' limit 1;
    select id into s_maint from public.services where title = 'Maintenance Detail' limit 1;
    select id into s_full from public.services where title = 'Full Detail Inside + Out' limit 1;
    select id into s_deep from public.services where title = 'Deep Clean / Restoration Detail' limit 1;
    select id into s_protect from public.services where title = 'Wellington Protection Package' limit 1;

    insert into public.packages (code, title, subtitle, summary, includes, ideal_for, from_price_cents, active, service_id)
    values
      (
        'exterior_refresh',
        'Express Wash + Vac',
        'Quick turnaround (45–75 min)',
        'A fast wash + tidy-up for busy weeks. Starting price varies by vehicle size.',
        array['Hand wash','Wheels / tyres quick clean','Exterior windows','Quick interior vacuum + wipe of dash / console'],
        array['Weekly / fortnightly customers','Busy people','Rideshare'],
        9000,
        true,
        s_express
      ),
      (
        'interior_refresh',
        'Maintenance Detail',
        'Most popular (1.5–2.5 hrs)',
        'For regular customers who want their car always nice. Starting price varies by vehicle size.',
        array['Thorough wash + wheels / arches','Door jambs','Full vacuum','Plastics wiped','Glass inside + out','Light interior detail','Optional spray sealant (1–3 months)'],
        array['Regular customers','Keep it always nice'],
        16000,
        true,
        s_maint
      ),
      (
        'full_detail',
        'Full Detail Inside + Out',
        'Full reset (3–5 hrs)',
        'The full reset for most one-off customers. Starting price varies by vehicle size + condition — Dylan confirms after a quick look (or photos).',
        array['Full exterior wash + decon (bug / tar)','Wheels / arches','Interior detailed clean','Glass','Trim dressings','Short-term paint protection (sealant)'],
        array['Pre-sale','Haven’t cleaned it in a while','Most one-off customers'],
        35000,
        true,
        s_full
      ),
      (
        'full_interior',
        'Deep Clean / Restoration Detail',
        'Neglected vehicles (5–8+ hrs)',
        'For pet hair, sand/mud, stains, kids, smokers, and heavy build-up. Pricing is inspection-based (confirmed after an in-person look).',
        array['Everything in Full Detail','Seats / carpets shampoo + extraction (as needed)','Heavy pet hair removal (as needed)','Deeper plastics / crevices','More intensive exterior decon'],
        array['Pet hair','Sand/mud','Stains','Kids','Smokers'],
        49500,
        true,
        s_deep
      ),
      (
        'paint_enhancement',
        'Wellington Protection Package',
        'Detail + longer protection (4–7 hrs)',
        'Full Detail plus longer-lasting protection for Wellington conditions.',
        array['Full Detail Inside + Out','Paint sealant (6–12 months) or entry ceramic option','Glass treatment'],
        array['Parking outside','Coastal commuters','Keep it easy to wash'],
        45000,
        true,
        s_protect
      );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_packages_updated_at on public.packages;
create trigger set_packages_updated_at
before update on public.packages
for each row
execute function public.set_updated_at();

-- Availability rules
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  dow smallint not null check (dow between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date not null,
  effective_to date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

do $$
declare
  d date;
begin
  if not exists (select 1 from public.availability_rules) then
    d := timezone('Pacific/Auckland', now())::date;
    insert into public.availability_rules (dow, start_time, end_time, effective_from, effective_to, active)
    values
      (0, '08:00', '17:00', d, null, true),
      (1, '08:00', '17:00', d, null, true),
      (2, '08:00', '17:00', d, null, true),
      (3, '08:00', '17:00', d, null, true),
      (4, '08:00', '17:00', d, null, true),
      (5, '08:00', '17:00', d, null, true),
      (6, '08:00', '17:00', d, null, true);
  end if;
end $$;

create unique index if not exists availability_rules_one_active_per_dow
on public.availability_rules (dow)
where active = true;

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  vehicle text,
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists bookings_created_at_idx on public.bookings (created_at);
create index if not exists bookings_start_at_idx on public.bookings (start_at);

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (tstzrange(start_at, end_at, '[)') with &&)
  where (status = 'confirmed');

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

-- Helper: is within availability?
create or replace function public.is_within_availability(p_start_at timestamptz, p_end_at timestamptz)
returns boolean
language sql
security definer
set search_path = public
as $$
  with x as (
    select
      timezone('Pacific/Auckland', p_start_at) as nz_start,
      timezone('Pacific/Auckland', p_end_at) as nz_end
  )
  select exists (
    select 1
    from public.availability_rules ar
    join x on true
    where ar.active = true
      and ar.dow = extract(dow from x.nz_start)::int
      and ar.effective_from <= (x.nz_start::date)
      and (ar.effective_to is null or (x.nz_start::date) <= ar.effective_to)
      and (x.nz_start::time) >= ar.start_time
      and (x.nz_end::time) <= ar.end_time
  );
$$;

-- RPC: get available starts
create or replace function public.get_available_starts(
  p_service_id uuid,
  p_from date,
  p_to date,
  p_step_mins integer default 15
)
returns table (start_at timestamptz)
language sql
security definer
set search_path = public
as $$
  with
  svc as (
    select duration_mins
    from public.services
    where id = p_service_id
      and active = true
    limit 1
  ),
  days as (
    select d::date as day
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
  ),
  rules as (
    select
      day,
      r.start_time,
      r.end_time
    from days
    join lateral (
      select ar.start_time, ar.end_time
      from public.availability_rules ar
      where ar.active = true
        and ar.dow = extract(dow from day)::int
        and ar.effective_from <= day
        and (ar.effective_to is null or day <= ar.effective_to)
      order by ar.created_at desc
      limit 1
    ) r on true
  ),
  windows as (
    select
      (day::timestamp + start_time) at time zone 'Pacific/Auckland' as win_start,
      (day::timestamp + end_time) at time zone 'Pacific/Auckland' as win_end
    from rules
  ),
  starts as (
    select gs as start_at, (svc.duration_mins * interval '1 minute') as dur
    from windows w
    join svc on true
    cross join lateral generate_series(
      w.win_start,
      w.win_end - (svc.duration_mins * interval '1 minute'),
      (greatest(1, p_step_mins) * interval '1 minute')
    ) gs
    where w.win_end - (svc.duration_mins * interval '1 minute') >= w.win_start
      and gs > now()
  )
  select s.start_at
  from starts s
  where not exists (
    select 1
    from public.bookings b
    where b.status = 'confirmed'
      and tstzrange(b.start_at, b.end_at, '[)')
          && tstzrange(s.start_at, s.start_at + s.dur, '[)')
  )
  order by 1;
$$;

-- Trigger: handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.availability_rules enable row level security;
alter table public.bookings enable row level security;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_within_availability(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_available_starts(uuid, date, date, integer) to anon, authenticated;

-- PROFILES
create policy "profiles: user can read self"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles: admin manage"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- SERVICES
create policy "services: public read active"
on public.services for select
to anon, authenticated
using (active = true);

create policy "services: admin manage"
on public.services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PACKAGES
create policy "packages: public read active"
on public.packages for select
to anon, authenticated
using (active = true);

create policy "packages: admin manage"
on public.packages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- AVAILABILITY RULES (admin-only)
create policy "availability_rules: admin manage"
on public.availability_rules for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "availability_rules: public read active"
on public.availability_rules for select
to anon, authenticated
using (active = true);

-- BOOKINGS
create policy "bookings: public insert if within availability"
on public.bookings for insert
to anon, authenticated
with check (
  status = 'confirmed'
  and start_at > now()
  and exists (
    select 1
    from public.services s
    where s.id = service_id
      and s.active = true
      and end_at = start_at + (s.duration_mins * interval '1 minute')
  )
  and public.is_within_availability(start_at, end_at)
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

create policy "bookings: admin delete"
on public.bookings for delete
to authenticated
using (public.is_admin());

-- =========================
-- PRIVILEGES (GRANTS)
-- Note: RLS policies do not grant permissions. These grants are required for the API/client to work.
-- =========================
grant usage on schema public to anon, authenticated;

grant select on table public.services to anon, authenticated;
grant select on table public.packages to anon, authenticated;
grant select on table public.availability_rules to anon, authenticated;

grant insert on table public.bookings to anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.packages to authenticated;
grant select, insert, update, delete on table public.availability_rules to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;
