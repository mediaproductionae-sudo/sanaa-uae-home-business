<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Sanaa UAE: connected deployment workflow (owner instruction, 2026-11-20)

The owner confirms that the Lovable deployment is connected to a real database. Treat that deployment as the operational target for all further feature requests. Preserve its existing database, records, authentication, ownership rules and Storage/RLS policies.

- Inspect and synchronize the actual Lovable-linked repository/branch and schema before implementing database changes. This checkout is a legacy Next.js source with a separate `staging/` backend; its existence does not prove it matches the connected Lovable deployment.
- Implement persistent business data and license attachments through the existing authenticated backend and private Storage. Do not introduce localStorage, IndexedDB, browser-only files or mock data as the persistence path for new production features. UI language preferences and temporary unsaved form state are separate from business persistence.
- Never silently fall back to local persistence when a backend operation fails. Show an accurate failure state and retain unsaved input for retry.
- Do not merely remove text describing local storage while retaining local-only behavior. Report verified implementation accurately; distinguish prepared code from a connection or end-to-end flow actually tested.
- Do not request secrets in chat, put service-role credentials in browser code, apply migrations to the connected database without reviewing its actual schema, or overwrite the live Lovable project with this legacy checkout.
- Publish reviewed code changes to the existing authorized GitHub repository for Lovable to consume. Confirm the target repository/branch when they have not yet been identified.
