# Product contract

Use this contract as a starting point, not a reason to override explicit user choices.

## Information hierarchy

The first phone screen should answer “where am I, what matters next, and when?” before offering background detail. A page should have one dominant purpose.

Today is stateful: pre-trip, en route, connecting, recently arrived, ordinary travel day, and completed trip are different states. Determine the state from dated evidence and device time. Keep countdowns at minute precision unless the user asks otherwise.

Trip is date-driven. The date rail is the primary locator; the selected date is persistent. Each day should read in this order when available: identity and weather, route/map, key focus, ordered events, stay, then flexible notes.

## Mobile patterns

- Use a bottom navigation for three to five primary destinations.
- Keep tap targets at least 44 CSS pixels.
- Use bottom sheets for member selection and focused entry forms.
- Keep typography and spacing readable at 320px without shrinking content into desktop miniatures.
- Avoid redundant titles, repeated flight codes, decorative buttons, and “card for every sentence” layouts.
- Make conditional content truly conditional; empty optional blocks should not consume a screen.

## Visual media

Use a visual only when it carries mood or clarifies geography. Avoid repeating the same illustration directly above a functional route map. Prefer one coherent composition over a row of unrelated cards. Resize large source images before publication; test real network loading rather than relying on cached local assets.

## Status and trust

Use labels with distinct meanings. Facts from a confirmed document may be styled confidently. Plans, estimates, and unresolved conflicts stay visibly qualified. The UI must never make a missing terminal, unbooked hotel, or forecast horizon look confirmed.

## Structure and incomplete source data

Preserve the approved component hierarchy when facts are missing. Do not replace Today
with marketing copy, a duplicate destination list or a “view itinerary” gateway card.
Before departure, show the first known arrangement, route and actual first-date stay;
never substitute the first booked hotel from a later date. Keep all selected modules.
A flight with only arrival time is an arrival event at that time in the timeline.
Full flight cards require both endpoint times; incomplete records retain known facts
in the same timeline style as other events. Unknown times sort after timed events,
not after every event merely because flights were appended later.
Preparation does not expose a save-offline entry. Do not add product controls to
satisfy an internal implementation feature.
