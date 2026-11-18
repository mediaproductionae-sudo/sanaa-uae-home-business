# 4A server boundary

`contracts.ts` defines the trusted service boundaries only. It does not implement
checkout, allocation, payments, settlements, or authorization. Nothing in the
current frontend imports these interfaces as a runtime service or changes its
existing DEMO ONLY behavior.

4B introduces the official `@supabase/ssr`/`@supabase/supabase-js` clients at pinned,
reviewed versions, a server-only environment module, verified Auth claims and
cookie refresh; no service-role client is bundled in a client component. 4C–4F
implement transaction-backed services and public DTOs behind those boundaries.
Database types were generated against a real local PostgreSQL database, not a
hosted Supabase project. Regenerate with official Supabase typegen after linking.
