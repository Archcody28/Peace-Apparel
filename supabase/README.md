# Database verification status — BLOCKED

The application uses Supabase Postgres directly through the server SDK. No ORM
or verified migration baseline is currently available.

## Do not apply the previous speculative SQL

`unverified/20260917000000_initial_schema.sql.txt` preserves the existing draft.
It was derived from application code, NOT exported from the live database. It
has been moved out of automatic migration discovery. Its columns, defaults,
foreign keys, indexes, currency and storage assumptions are NOT authoritative.
Do not rename it into `migrations/` or apply it to any database as a baseline.

## Evidence and blockers

- No usable credentials were available at the last Phase 3 check; some earlier
  process values were placeholders. Do not treat those as valid project access.
- Root, client and server real .env files were absent during that check.
- No database connection credentials or Supabase management access were available.
- psql, pg_dump, Supabase CLI and Docker were not installed/available on PATH.
- No production queries, database writes, schema changes or resets were performed.
- Live column types, constraints, indexes, RLS, policies, triggers, functions,
  migration history and bucket configuration remain unverified.

## Application-derived inventory (NOT verified database schema)

| Table referenced | Consumers / operations | Relationship expectations |
| --- | --- | --- |
| products | productController CRUD; analytics counts | Categories queried via categories array; no verified FK |
| orders | ordersController CRUD; analytics reads; payment verification inserts | items supplied by checkout; no verified product FK |
| order_payments | verifyPaymentController inserts | order_id assigned from inserted orders.id; FK unverified |
| subscribers | subscribersController signup/list/delete; analytics | No verified relationship |
| testimonials | testimonialsController CRUD; analytics | No verified relationship |
| homepage_features | homepageFeaturesController CRUD | section filtering; no verified relationship |
| categories | categoriesController CRUD | sort_order ordering; product relationship unverified |
| settings | settingsController reads/writes | No verified relationship |

For ALL tables above: RLS enabled, SELECT/INSERT/UPDATE/DELETE policies and anon
access are UNKNOWN. Service-role access is the intended Express path; absence
of browser table calls does not establish that direct anon access is denied.
Supabase Auth is also used; the application does not query auth tables directly.

## Contracts and storage

Product API output normalizes sizes/colors/images/categories to string arrays in
server/src/controllers/productController.js. The real DB types remain UNKNOWN.
Do not infer text[] from that normalization or change production data to match it.

Payment verification inserts orders then order_payments separately, referencing
savedOrder.id. The database constraints and transaction guarantees are unverified.

Uploads use Express POST /api/upload, service-role storage, bucket peace-apparel,
a timestamp-prefixed filename, upsert=true and getPublicUrl. Bucket existence,
public/private visibility and storage policies remain UNKNOWN. Browser Supabase
is retained for AuthContext session subscriptions; no client table/storage calls
were found.

## Required completion work

1. Obtain read-only catalog access or a trusted schema-only export of the actual
   project through a secure channel (do not put credentials in chat or Git).
2. Capture actual public objects, dependencies, constraints/indexes, functions,
   triggers, RLS/policies, migration history and relevant storage configuration.
3. Compare every controller/client payload with the captured schema, including
   sizes/colors, order items, order_payments fields and statuses.
4. Place only the reviewed real baseline in supabase/migrations/ using the actual
   migration history. Do not blindly replay a baseline against existing production.
5. Apply it to a disposable Supabase environment, compare catalogs and test CRUD,
   authentication and image uploads there. Never use production for these tests.

Migration created from real schema: NO. Clean rebuild tested: NO.
