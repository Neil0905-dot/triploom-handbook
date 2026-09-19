---
name: triploom-handbook
description: Generate and update a mobile travel handbook from the user's itinerary, Excel, tickets, bookings or conversation. Reuse bundled Today, Itinerary, Ledger and Preparation pages, with optional CloudBase or Cloudflare shared deployment.
---

# Mobile Travel Handbook

Use the bundled, versioned application instead of asking the model to recreate its UI.
Deliver a trip-specific handbook with the same four-page interaction contract. Never
copy a previous traveler's itinerary, drawings, bookings, member IDs or cloud configuration.

## Start with two decisions

Inspect every supplied file before asking anything it already answers. Then establish:

1. **Pages** — “请选择这次需要的页面：今日、行程、账本、准备。默认生成全部四个。”
2. **Planning mode, only when the source cannot form a basic day-by-day plan** —
   “现有资料还不足以形成完整日程。请选择：由 AI 先拟一版可调整的行程，或只按现有资料生成。”

Use concise tool wording. Do not turn these into a long interview. Page selection is a
user preference, never an inference from missing data: an empty ledger still works, and
preparation does not disappear because packing data is absent. Read
[conversation-contract.md](references/conversation-contract.md) for the exact gate.

If they already supplied an itinerary, use it. Otherwise collect only the destination,
dates or duration, travelers and pace needed for the selected planning mode.
Accept Excel, screenshots, PDFs and conversation. Use available document tools to
read the source; do not require a particular spreadsheet layout or ask for JSON.
Read [intake.md](references/intake.md) for reconciliation and stable record IDs.
Before generation, read [decisions.md](references/decisions.md) for missing-data and
conflict handling, and [product-contract.md](references/product-contract.md) for the
visual and information contract. These apply to new generation, not only code edits.

Default to all four pages unless the user requests a subset. Ask only questions
that materially affect dates, amounts, participants or booking status. Unknown
flight codes, times, prices and attachments are allowed; never turn unknowns into
confirmed facts or zero prices. Proposed travel is marked as a proposal. Missing flights and accommodations do not produce empty cards; no expenses produces a usable empty ledger. Read intake.md for sparse plans, embedded source images and test-only samples.

## Normalize and generate

Read [data-model.md](references/data-model.md). Create `trip-data.json` in the
user's project; the bundled example is a schema example, never production content.
Every source, conflict and correction belongs in the user's private source notes.
Keep stable trip/member/item IDs across later updates.
For a workbook, retain the extraction and a private coverage review using
[source-review.md](references/source-review.md). Record omitted or deferred material
instead of silently dropping it. Run the coverage checker before handing off.

Run with Node.js 24 or newer:

```sh
node scripts/validate-trip-data.mjs /path/to/trip-data.json
node scripts/create-handbook.mjs /path/to/trip-data.json /path/to/handbook local
```

Run `node scripts/verify-project.mjs /path/to/handbook` to check the generated artifact
against the packaged template. Then run `node scripts/serve-handbook.mjs /path/to/handbook`
and use its printed phone-preview URL. Do not call a desktop-width screenshot a mobile check.
Read [acceptance.md](references/acceptance.md) and inspect actual generated pages.
The local preview opens through this local server. Its editable data stays
in that browser. Tell the creator this once when handing off local preview; don't
add migration, export or synchronization explanations to the product UI.

Generation supplies four approved illustrated portraits and a generic journey illustration.
Reuse these stable defaults in order; do not regenerate people or silently fall back to
the old silhouette SVG set.
Trip-specific illustrations are optional and belong only to this user's project.
The full template includes bundled world and country outlines. Read [map-system.md](references/map-system.md): world maps label countries; country maps label cities only. Supply day country codes and verified city centers, with explicit `mapCities` for multiple cities per day. Keep attractions in the itinerary and navigation, never overview pins. Country framing stays fixed across dates; only current-city emphasis changes. Missing coordinates remain pending.
Weather is fetched for verified day coordinates within the forecast horizon, otherwise
shown as pending. Do not invent coordinates or replace forecasts with climate averages.

## Preserve behavior

Read [product-contract.md](references/product-contract.md) before meaningful changes.
The implementation is the full template in `assets/full`, not a starter to redesign.
Read [full-feature-contract.md](references/full-feature-contract.md) for its preserved
interactions. Generalizing means replacing trip values and rules with data while retaining
the complete interface and behavior. Do not replace buttons with simpler forms, delete
sections, or remove interactions merely to make generation or testing easier.
Use normalized data for all member differences, dates, routes and sharing. Ordinary
content updates must not rewrite the template's JavaScript or remove existing modules.
Amounts accept comma/period decimals, and allocation uses integer cents. Individual
responsibility and equal sharing are supported. All rows remain reachable after five.
Personal definitions/checks, shared tasks, ledger and settlements use the same storage
contract. Background updates must not replace an active input or discard its draft.

Each itinerary event has at most one navigation action. Use structured place/route
references; never scan prose for place names or emit a row of competing map buttons.
Do not add generic filler sections such as “留一点余地”. Render notes only when source
data or the proposed plan contains a useful note.

## Keep publishing outside ordinary generation

The default result is a verified local preview. Ordinary generation does not ask for a
cloud platform, log into an account, create cloud resources, push Git, or publish a public
URL. Do not treat “generate a handbook” as permission to publish it.

Enter deployment only when the user explicitly asks for public access, a shareable URL,
multi-device use or shared data. Reuse the user's selected platform/account if known.
Otherwise ask what they already use; if none, establish audience region, domain availability
and budget before recommending. CloudBase and Cloudflare adapters are bundled as optional
deployment paths. Do not claim arbitrary clouds work automatically.

Read only [deployment.md](references/deployment.md)'s relevant provider section. Generate
a new cloud project with the same input and provider argument `cloudbase` or `cloudflare`.
Local-to-cloud data migration and provider switches are separate deliberate operations;
never silently upload local records. Keep each travel group's account and storage independent.

The default shared deployment uses one trip access phrase and a protected session cookie.
Everyone holding that phrase can view and edit the group's data and choose a member;
member switching is a display filter, not identity verification. If the user needs
per-member permissions, add real authentication before promising that capability.

After an explicit deployment request, do authorized setup, deploy and hosted checks when
the account tools are available.
If authentication is missing, complete the deployable package and report the exact
remaining account step; never claim local adapter tests prove a cloud deployment.

## Updates and verification

Update the existing source data and regenerate the existing project with its original
trip ID/provider. The manifest prevents overwriting customized template files. Compare
and merge such customization deliberately. Generated-file backups go to `.local/previous-template`.
Database initialization never resets an existing state row. Imported budget records are
initial seeds; later imports must use normal record operations with stable IDs.

Read [verification.md](references/verification.md). Check actual generated pages, not
only syntax: member-specific routes, Today states, booking links, ledger decimals and
splits, all-row expansion, draft focus, copy independence and persistence. For shared
delivery use two browser sessions. Report local, simulated-provider and real-cloud
verification separately. Hand off the project folder or confirmed live URL, template
version, and material pending facts. Keep deployment details out of traveler-facing pages.
