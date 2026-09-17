-- Peace-Apparel initial schema (corrected).
-- Generated 2026-09-17 from the Phase 4 / Step 5 application audit.
-- Supersedes supabase/unverified/20260917000000_initial_schema.sql.txt (quarantined draft).
--
-- Corrections vs draft (evidence in Step 5 report):
--   orders.id is TEXT (client generates ids like 'PA-MCLRQ4K1-A2B3'), not uuid.
--   orders uses delivery_method / delivery_address / delivery_fee (not customer_address/shipping).
--   products.old_price, testimonials.location/service/avatar/content,
--   homepage_features.image, settings.phone/email/address added per client payloads.
--   order_payments.currency default NGN (app formats ₦ / en-NG).
--   RLS enabled on every table with NO anon/authenticated policies: all data
--   access flows through the server-side service-role client, which bypasses
--   RLS. Direct browser table access is intentionally denied.
--   Public storage bucket peace-apparel: public read URLs only; uploads are
--   service-role (admin-protected /api/upload). No anonymous write policies.
--
-- Target: fresh/empty Supabase project. No destructive statements, no TRUNCATE,
-- no application seed data. Idempotent objects use IF NOT EXISTS / OR REPLACE.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  images text[] not null default '{}',
  category text,
  categories text[] not null default '{}',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_check check (price >= 0),
  constraint products_old_price_check check (old_price is null or old_price >= 0),
  constraint products_stock_check check (stock >= 0)
);

create table if not exists public.orders (
  id text primary key,
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_method text,
  delivery_address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_method text,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_subtotal_check check (subtotal >= 0),
  constraint orders_delivery_fee_check check (delivery_fee >= 0),
  constraint orders_total_check check (total >= 0)
);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  payment_method text,
  payment_reference text,
  payment_status text not null default 'pending',
  amount numeric(12,2),
  currency text not null default 'NGN',
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  constraint order_payments_amount_check check (amount is null or amount >= 0)
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text,
  location text,
  service text,
  avatar text,
  content text,
  rating integer,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  constraint testimonials_rating_check check (rating is null or rating between 1 and 5)
);

create table if not exists public.homepage_features (
  id uuid primary key default gen_random_uuid(),
  section text,
  title text,
  subtitle text,
  image text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  store_name text,
  phone text,
  email text,
  address text,
  whatsapp_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

create index if not exists products_category_idx on public.products (category);
create index if not exists products_featured_idx on public.products (featured);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_categories_gin_idx on public.products using gin (categories);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create index if not exists order_payments_order_id_idx on public.order_payments (order_id);
create index if not exists order_payments_reference_idx on public.order_payments (payment_reference);

create index if not exists homepage_features_section_idx on public.homepage_features (section);

-- ---------------------------------------------------------------------------
-- 3. updated_at maintenance (products, orders, settings only — the only tables
--    with an updated_at column)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security — enabled everywhere, NO anon/authenticated policies.
--    All data access uses the server-side service-role key (bypasses RLS);
--    direct browser table access via the anon key is intentionally denied.
-- ---------------------------------------------------------------------------

alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.order_payments    enable row level security;
alter table public.subscribers       enable row level security;
alter table public.testimonials      enable row level security;
alter table public.homepage_features enable row level security;
alter table public.categories        enable row level security;
alter table public.settings          enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Storage: public bucket 'peace-apparel' (public read URLs only).
--    Uploads go through the admin-protected /api/upload endpoint using the
--    service-role client. No anonymous upload/update/delete policy is created.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('peace-apparel', 'peace-apparel', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'peace-apparel public read'
  ) then
    create policy "peace-apparel public read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'peace-apparel');
  end if;
end
$$;
