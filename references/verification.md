# Verification and release

Use Node.js 24+ to run the bundled checks (SQLite is used only by the test adapter).
Generate artifacts into a temporary directory. Never test by mutating an existing user's trip.

```sh
node --test tests/model.test.mjs tests/integration.test.mjs tests/store.test.mjs
node --test tests/documents.test.mjs tests/maps.test.mjs
```

Browser checks need Playwright and an installed browser. Install development dependencies
in a temporary workspace if needed, not into the generated site's public directory.
Set `PLAYWRIGHT_MODULE` to that installation's module directory or make `playwright`
resolvable normally. `HANDBOOK_BROWSER_CHANNEL` defaults to Chrome.

```sh
node tests/full-browser.mjs
```

The browser suite generates three separate trips (one, two and six travelers), visits
all four tabs, checks 320/390 CSS-pixel layouts, decimal comma/point, sharing arithmetic,
personal additions/copying, default-item deletion, pending-row expansion, full hotel sheets,
geographic maps, original expense sheets, category filters, payment and settlement undo,
offline reopening and persistence. It records screenshots;
open them before claiming visual verification. Run additional checks for a changed behavior
such as failed saves, booking attachment removal or real cloud deployment.

The integration suite tests Cloudflare's D1 SQL with actual SQLite and tests the CloudBase
HTTP function against a simulated RPC endpoint. These are local adapter checks, not cloud
account verification. `tests/postgres.mjs` can additionally execute the actual SQL/RPC
definitions using PGlite when installed. Follow `deployment.md` for account checks.

Before distributing, package ONLY the curated files via `scripts/package-skill.mjs`.
Verify the package contains no user environment IDs, keys, local absolute paths, private
documents, custom trip illustrations or dependencies. The example trips are explicitly
synthetic fixtures. Validate every reference link and syntax-check generated scripts.

Acceptance for a real user's handoff:
- All supplied travelers, dates and confirmed flights/stays are represented correctly.
- Unknown fields are marked accurately. No imported budgets become paid without evidence.
- Pre-trip, in-flight, connection and ordinary travel states preserve relevant cards.
- Event and member-specific paths are distinct; original airport names remain in flights.
- Booking documents open the right file on the actual delivery URL.
- Embedded day documents keep their types, dates and file contents after regeneration.
- No-flight and no-hotel inputs omit empty cards; zero recorded expenses do not imply
  a free trip. Same-date hotels open separately, and hotel nights are not summed as
  a traveler's personal nights without an explicit allocation.
- Monetary shares sum exactly, records over five remain accessible, edits persist.
- Two browsers see shared tasks/ledger; copied personal definitions stay independent.
- Sync during an empty or populated active input leaves the same DOM input focused.
- Updates preserve source IDs, cloud records, provider configuration and customizations.
- Report specifically what was not exercised (e.g. iOS keyboard on physical hardware).

These programmatically normalized fixtures do not prove raw Excel intake or fresh-machine
installation. A separate acceptance run must start with only the distributed package,
an empty project folder and raw user documents. Record dependencies installed, questions,
missing facts and failures. Do not consult the author's old project or fix the package
during that acceptance run and then count it as an unmodified pass.
