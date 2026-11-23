<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->
- UI is the Codex Next.js app ported verbatim into `src/sanaa/*` (own CSS, `// @ts-nocheck`); `next/link`/`next/navigation` map to `src/sanaa/next-shim.tsx`, so code stays diffable against the source repo.
- `/` renders sanaa Home; legacy pages use `src/routes/$.tsx`. Persisted delivery pages use named routes under the authenticated layout so they load verified scoped data, never DemoProvider orders or numeric UI IDs.
- Catalog (stores/products) and accounts come from Lovable Cloud via `src/sanaa/lib/catalog.ts`, merged into DemoProvider state; numeric UI ids map from store slug `store-N` and product sku `N-image` so the ported UI stays unchanged.
<!-- AGENT-MEMORY:END -->

- Delivery commands use authenticated server functions and narrow database RPCs; no service-role client is used, because membership, immutable money and transactional offer rules must hold for direct API calls too.
- Delivery command receipts and a transaction advisory lock serialize manual writes and capacity decisions; this deliberately favors correctness over throughput for the manual milestone.
- Company shipment reads use projected RPC data rather than full shipment/customer rows, so guessed IDs cannot expose another company's records or unrelated customer details.
- Delivery database tests run only on disposable local PostgreSQL with reconstructed schema; never insert test business records into the managed project database.


## Owner instruction — 23 November 2026

The owner explicitly requested completion and tests in Codex and delivery through GitHub to reduce Lovable credits. Do not start new Lovable build messages for coding. Work locally against this exported current TanStack app; preserve its source history and visual identity. Prepare incremental migration SQL for review in GitHub, but leave applying managed database migrations and secrets to Lovable after owner review. Never replay the initial schema against an existing database or silently fall back to browser business storage. Retain the managed/generated-file rules above; locally generated route-tree changes must come from the toolchain. Read LOVABLE_HANDOFF.md before publishing.
