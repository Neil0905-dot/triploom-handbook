# Deployment adapters

The website, state API and booking files form one application. Static hosting alone
does not provide shared state. The bundled adapters use one state row per trip,
optimistic revisions and operation-level updates. They target small travel groups;
they are not a multi-tenant booking service. State is capped at 1.5 MB.

Select the user's existing cloud when known. Otherwise ask audience region, account,
domain and budget before recommending. Verify current access/plan/domain constraints.
No account, environment ID, API key or domain from another trip may be reused.
Follow authorization already provided; avoid repeated permission questionnaires.

## Local preview

Generate with provider `local`, open `public/index.html`. All UI dependencies are local;
maps, weather and remote attachments require internet. This mode stores mutable data
in that browser. It is not shared. To preview shared behavior locally, run the browser
test harness. Never use a public static hosting upload as an ersatz shared deployment.

## Cloudflare Workers + D1

Generate with provider `cloudflare`. The project contains `server/cloudflare.mjs`,
`wrangler.jsonc`, `public/` and `d1.sql`. Use the current authenticated Wrangler CLI.

1. Resolve the user's account and choose their project name. Create a D1 database,
   e.g. `npx wrangler d1 create <name>`, and put the returned ID in `wrangler.jsonc`.
2. Apply `npx wrangler d1 execute <name> --remote --file=d1.sql`.
3. Generate a random access phrase (at least 24 characters) and configure it with
   `npx wrangler secret put SHARE_TOKEN`. Keep it out of source and shell logs.
4. Run `npx wrangler deploy` from the generated project. Assets MUST retain
   `run_worker_first: true`; otherwise private itinerary/assets can bypass the gate.
5. Visit the actual returned URL, unlock, verify booking files and two-browser state.
   Check route refresh, unauthorized asset access, mobile layout and account costs.

The initial database row is inserted only when absent. Repeat deployments preserve data.
Attachments are bundled static assets behind the Worker gate; R2 is not required for
this version. Large files or dynamic uploads need a separate storage extension.

Official references: https://developers.cloudflare.com/workers/static-assets/binding/
and https://developers.cloudflare.com/d1/get-started/ .

## Tencent CloudBase HTTP function + PostgreSQL

Generate with provider `cloudbase`. This adapter specifically requires CloudBase
PostgreSQL with a REST RPC endpoint; a NoSQL-only environment is not interchangeable.
Resolve the full environment ID from the user's account before provisioning.

1. Execute generated `postgres.sql` in the user's PostgreSQL SQL console. The database
   must support pgcrypto and the `anon`/`authenticated` API roles shown in that file.
2. Run `node <skill>/scripts/cloudbase-seed.mjs <project>`. It creates private
   `.local/secrets.json` and `.local/seed.sql`; run the seed SQL in the same database.
   It uses ON CONFLICT DO NOTHING and does not reset records or rotate existing secrets.
3. Configure function environment values from `.env.example`: actual REST endpoint,
   publish key, generated DB_SECRET and SHARE_TOKEN. Set BASE_PATH to the HTTP route
   with a trailing slash (e.g. `/handbook/`). Use Node.js 20+ runtime, `index.main` handler.
4. Run `node <skill>/scripts/stage-cloudbase.mjs <project>`. Deploy ONLY the returned
   staging directory as the function code. It excludes `.local`, source notes, tests
   and environment files. Use authenticated CloudBase CLI/MCP available on this host;
   check the installed CLI's function deploy help instead of assuming config syntax.
5. Configure public HTTP invocation so the app can display its access-phrase gate;
   database tables stay inaccessible directly. Bind the selected HTTP route, then
   verify the real URL, redirect to trailing slash, assets, PDFs and shared writes.

If the user has a different database mode, adapt and test that storage connector or
offer a suitable environment; never insert an invented REST endpoint. The original
reference trip's already-working environment is not proof that a new user's setup works.
Official platform documentation: https://docs.cloudbase.net/ .

## Sharing, updates and tests

Handoff the URL and access phrase to the creator through the task, not a public repo.
Everyone with the phrase can edit all group records. Individual login/roles are not
implemented. Credentials and session cookies are never placed in public JavaScript.
Test with two separate browsers and only temporary records owned by the test. Delete
only those test IDs afterward. Existing trips and live user expenses are not test data.

The manifest preserves provider selection and detects customized source files. Reuse
the original route when publishing updates. Switching provider or trip identity requires
a new target plus deliberate export/import with count and amount reconciliation.
Do not silently migrate local data or restore the removed migration UI.

Current validation covers the shared handler and both adapter contracts locally.
Only claim real-cloud verification after actually publishing and checking that account.
