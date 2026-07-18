-- Enable Row Level Security on all application tables.
--
-- This app only ever talks to Postgres through Prisma, using the
-- DATABASE_URL/DIRECT_URL connection — the Postgres role that owns these
-- tables. RLS does not apply to a table's owner unless FORCE ROW LEVEL
-- SECURITY is also set (it isn't, here), so this has zero effect on the
-- app's own behavior; every existing query keeps working unchanged.
--
-- What this actually fixes: Supabase auto-exposes every table through its
-- PostgREST REST API, reachable with the public "anon" key — a key meant to
-- be embeddable/public under the assumption that RLS is what protects the
-- data behind it. With RLS disabled, that API could read/write these tables
-- directly, bypassing this app's own routes (and their validation, rate
-- limiting, and admin auth) entirely.
--
-- No policies are added on purpose: this app has no Supabase Auth and no
-- legitimate use case for the anon/authenticated roles to touch these tables
-- at all, so the correct default is to deny that API surface completely
-- rather than write policies for a role that should never have access.
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Requirement" ENABLE ROW LEVEL SECURITY;
