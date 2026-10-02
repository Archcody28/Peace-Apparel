-- Peace-Apparel: RLS policies for the privileged-key removal architecture.
--
-- Supersedes the "service-role bypass" design notes in
-- 20260917191627_create_peace_apparel_schema.sql (sections 4-5). Row Level
-- Security stays ENABLED on every table — this migration only ADDS policies;
-- it never disables RLS and never creates USING (true) / WITH CHECK (true)
-- on a write or admin policy.
--
-- The Express server runs exclusively on the PUBLIC anon key:
--   public routes -> anon role      -> public SELECT + constrained guest INSERT
--   admin routes  -> authenticated  -> the admin's own Supabase session,
--                                      authorized by public.is_admin()
--
-- Admin bootstrap: legacy admins (auth.users.user_metadata.role = 'admin')
-- are backfilled into public.admin_users below. New admins are granted by an
-- existing admin, or by one-time SQL in the Supabase dashboard:
--   insert into public.admin_users (user_id) values ('<uuid from auth.users>');

-- ---------------------------------------------------------------------------
-- 1. Admin membership — the single source of truth for admin RLS and login
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Backfill admins provisioned by the legacy metadata flow (create-admin /
-- register-admin). Safe to re-run; never grants membership to anyone else.
insert into public.admin_users (user_id)
select u.id
from auth.users u
where coalesce(u.user_metadata ->> 'role', '') = 'admin'
on conflict (user_id) do nothing;

-- SECURITY DEFINER so policy evaluation can read membership without being
-- blocked by admin_users' own RLS (no recursion). Returns false for anon.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. admin_users policies: self-read for login, management admin-only
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_users'
      and policyname = 'admin_users read self or admin'
  ) then
    create policy "admin_users read self or admin"
      on public.admin_users
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_users'
      and policyname = 'admin_users insert admin only'
  ) then
    -- Memberships are granted ONLY by an existing admin. No self-service,
    -- no anonymous path: a public signup can never make itself an admin.
    create policy "admin_users insert admin only"
      on public.admin_users
      for insert
      to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_users'
      and policyname = 'admin_users delete admin only'
  ) then
    create policy "admin_users delete admin only"
      on public.admin_users
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Public read policies (storefront data behind the existing public API).
--    Rows contain only public-facing content; settings/categories responses
--    are additionally column-whitelisted in the controllers.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['products', 'testimonials', 'homepage_features',
                           'categories', 'settings']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = t || ' public read'
    ) then
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        t || ' public read', t
      );
    end if;
  end loop;
end $$;

-- Deliberately NO public read on orders / order_payments / subscribers:
-- guest checkout writes those, it never reads them.

-- ---------------------------------------------------------------------------
-- 4. Guest write policies — INSERT ONLY, constrained. anon (and authenticated)
--    get NO update/delete policy on any of these tables.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders'
      and policyname = 'orders guest insert pending only'
  ) then
    create policy "orders guest insert pending only"
      on public.orders
      for insert
      to anon, authenticated
      with check (
        id is not null
        and char_length(id) between 1 and 100
        and subtotal >= 0
        and delivery_fee >= 0
        and total >= 0
        and status = 'pending'
        and payment_status = 'pending'
      );
    -- Guest checkout (CheckoutModal.buildOrder) always creates
    -- status/payment_status 'pending'. Non-pending rows and all updates
    -- remain admin-only, so a guest can never mark an order paid or done.
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_payments'
      and policyname = 'order_payments guest insert'
  ) then
    create policy "order_payments guest insert"
      on public.order_payments
      for insert
      to anon, authenticated
      with check (
        order_id is not null
        and (amount is null or amount >= 0)
        and payment_status in ('pending', 'success', 'failed')
      );
    -- Written only by POST /api/verify-payment after gateway verification.
    -- This table is read by NO application code path and anon cannot UPDATE
    -- orders.payment_status, so a directly-inserted row has no effect on
    -- fulfilment; orders stay 'pending' unless an admin changes them.
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subscribers'
      and policyname = 'subscribers guest insert'
  ) then
    create policy "subscribers guest insert"
      on public.subscribers
      for insert
      to anon, authenticated
      with check (
        email is not null
        and email like '%@%'
        and char_length(email) <= 320
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Admin policies — one 'for all' policy per application table, gated by
--    public.is_admin() for BOTH using and with check. Non-admin authenticated
--    users match nothing; anon matches nothing.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['products', 'orders', 'order_payments', 'subscribers',
                           'testimonials', 'homepage_features', 'categories', 'settings']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = t || ' admin all'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
        t || ' admin all', t
      );
    end if;
  end loop;
end $$;

-- Re-assert RLS stays enabled everywhere (baseline enabled it; no-op if so).
alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.order_payments    enable row level security;
alter table public.subscribers       enable row level security;
alter table public.testimonials      enable row level security;
alter table public.homepage_features enable row level security;
alter table public.categories        enable row level security;
alter table public.settings          enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Grants — grants gate verbs, RLS gates rows. Anon gets SELECT plus the
--    three guest INSERT verbs; write verbs everywhere else are authenticated
--    and then still fully gated by the policies above.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.orders, public.order_payments, public.subscribers to anon;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Storage bucket peace-apparel — keep the existing public SELECT policy;
--    insert/update/delete become admin-only under authenticated identity.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'peace-apparel admin insert'
  ) then
    create policy "peace-apparel admin insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'peace-apparel' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'peace-apparel admin update'
  ) then
    create policy "peace-apparel admin update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'peace-apparel' and public.is_admin())
      with check (bucket_id = 'peace-apparel' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'peace-apparel admin delete'
  ) then
    create policy "peace-apparel admin delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'peace-apparel' and public.is_admin());
  end if;
end $$;


