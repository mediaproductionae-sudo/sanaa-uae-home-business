# SANAA 4A database foundation

This folder is preparatory; no hosted Supabase project is connected.

Apply `migrations/` in timestamp order using the Supabase migration owner on a
reviewed staging project that already provides Auth and Storage. Do not apply
`tests/platform-bootstrap.sql` to Supabase: it is a minimal local test harness.
`seed.sql` is repeatable reference data; it does not provision users or finance.

Local isolated PostgreSQL tests:

```bash
npm run db:test:start
npm run db:test
npm run db:types:test
```

The tests use PostgreSQL 17 with mock Auth/Storage contracts. No JWT signature,
GoTrue signup, PostgREST HTTP or Storage upload is tested by this harness.
Consult `docs/phase4/setup-deployment.md` before using any hosted CLI command.
Business RPCs and real Auth wiring are deliberately not implemented before 4B–4F.
