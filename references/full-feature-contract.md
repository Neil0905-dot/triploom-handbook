# Full handbook contract

The packaged implementation derives from the full handbook, including its CSS, navigation,
member sheets, expense entry sheet and slide actions. User itinerary input changes data,
not the quality or scope of these features.

Preserve:
- Today: pre-trip first stay, current activity/completion, upcoming/ongoing flight,
  arrival and connection details, countdown urgency, remaining schedule and stay.
- Flights: full departure/arrival cards, local dates/times, terminals when known,
  cross-day travel, calculated duration, unconfirmed facts clearly marked.
- Itinerary: persistent scrollable dates, individual member branches, geographic map
  with all-route context and active-day highlight, ordered timeline and hotel sheet.
- Weather: current temperature/feels-like, route min/max and UV, multiple destination
  forecasts, conditions and clothing/rain/wind/sun advice; cached or unavailable states.
- Hotels: name/address, dates, explicitly defined cost sharing, room/breakfast/check-in
  details, navigation and original booking document link. No invented nights/party sizes.
- Ledger: donut chart, categories and percentages, stay costs, full expense sheet with
  currency/category/member buttons, decimal keyboard, date selection, paid/pending status.
- Records: edit/delete, all-record category filter, first-five expansion, swipe-to-pay,
  swipe-to-delete, swipe-to-settle and undo. Settlements do not increase spending.
- Preparation: shared tasks, grouped personal items, remove default items per member,
  additions, checks, copying additions without copying another person's check state.
- Clothing: expandable destination cards, packing plan, per-day forecast selection.
- Storage: same trip-specific state contract locally and in shared cloud adapters;
  background sync preserves a focused input and draft; internal offline resource support covers
  viewing previously downloaded content and the last shared snapshot. Cloud mutations
  require connectivity, and external booking URLs require their own availability.

Default art and avatars are generic. User-specific illustrations, photographs, booking
PDFs, names and cloud credentials must never become part of the distributable Skill.

These are implementation requirements, not a claim that every deployment or device has
passed testing. Read verification.md and report the actual environment and results.

Preparation has no traveler-facing save-offline button. Preserve background cache support without adding an unapproved entry.
