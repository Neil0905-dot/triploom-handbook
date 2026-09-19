# Data contract v1

`schemaVersion: 1`. UTF-8 JSON. Required `trip` and `people`; missing arrays default
to empty during generation. The validator expects normalized arrays, not raw Excel.
Use stable ASCII IDs (letters, digits, dash, underscore, dot), preferably under 40 chars.
Never derive persistent IDs solely from array positions or display names.

## Trip and travelers

- `trip`: `id`, `title`, ISO `startDate`/`endDate`, IANA `defaultTimeZone`, optional
  `countries` (ISO alpha-2, e.g. `JP`), `defaultPersonId`, `subtitle`, `illustration`.
- `people`: `{id, displayName, avatar?, role?, origin?, startDate?, endDate?}`. Optional personal dates bound that member's date rail. No default real people are installed.
- `modules`: optional booleans `today`, `trip`, `budget`, `prepare`; absent means enabled.

## Schedule

- `places`: optional reusable navigation records
  `{id,name,query?,latitude?,longitude?,coordinates?}`. `query` is a verified address or
  map search string. Coordinates may be top-level or nested. Events reference place IDs;
  display copy is never parsed to discover navigation.
- `days`: `{date, city, people?, route?, events?, focus?, stayId?, notes?, coordinates?, timeZone?, mapImage?}`.
- No `people` means all members. A member-specific day overrides the shared day on
  that date; two specific entries for the same member/date are an error.
- `route`: `{name,latitude,longitude}` points, kept separate from airport labels. Use verified destination coordinates to render the geographic map. Strings are accepted but require matching day/flight coordinates; otherwise the page marks coordinates pending. Optional `mapImage` replaces the geographic drawing; `illustration` supplies that day's hero art.
- `coordinates`: verified `{latitude,longitude}`, used for weather. Legacy `[latitude,longitude]` is normalized. No location guesswork.
- `events`: `{id,title,time?,startAt?,endAt?,endTime?,detail?,people?,status?,navigation?}`; `time` is display text, `startAt`/`endAt` include offsets. A clock-only `endTime` uses the day's IANA `timeZone`, falling back to the trip zone. Finished activities are excluded from the current activity focus.
  Navigation is either `{type:"place",placeId}` or
  `{type:"route",originPlaceId,destinationPlaceId,waypointPlaceIds?,travelMode?}`.
  Supported travel modes are driving, walking, bicycling and transit. Each event renders
  one navigation action. Legacy `mapQuery` remains readable for old projects but is not
  used for new normalized data.
  Event completion is saved per member. Chronological ordering belongs in normalized data.
- `flights`: `{id,people?,code?,departureAt?,arrivalAt?,date?,arrivalDate?,origin,destination,status?}`.
  Timestamps include UTC offset, e.g. `2027-04-18T23:30:00+09:00`. If departure
  time is unknown, supply `date`. Origin/destination: `{city,airport?,terminal?,timeZone?,latitude?,longitude?}`.
  `city` may be a region such as Cappadocia; airport is the actual boarding location.
- Status examples: `confirmed`, `proposed`, `flexible`, `time-pending`, `booking-required`.

## Accommodation and files

- `stays`: `{id,name?,englishName?,city,people?,checkIn,checkOut,status?,address?,mapQuery?,room?,breakfast?,requirements?,checkInNote?,facts?,price?,document?}`. The full hotel sheet displays room, breakfast and check-in instructions; missing fields remain pending.
- `price`: `{amount,currency,label?,members?}` is a display amount, never automatically a paid ledger entry. Explicit `members` enables equal per-person accommodation display; absent members means total price, not assumed sharing. Import evidenced payments separately into `budget.items` with stable IDs and link them using optional `stayId`; never double-count the hotel total plus its deposit.
- Night count uses date difference. `document` is a supplied local PDF path relative
  to the input JSON, or an explicitly supplied HTTPS URL. Generator copies local files
  under content-hashed names. It fails on missing files; never silently drops links.
- `illustration`, `avatar`, `mapImage` use the same local/HTTPS asset rule. A custom
  image belongs only to the generated project, never back into the public Skill.

## Budget

- `budget.currencies`: `{code,name,symbol,rateToCny?,rateSource?,rateDate?}`. Generator
  adds destination currencies and CNY/USD/EUR; missing foreign rates remain unknown.
  Record the source and date when providing a rate. Destination mapping is a convenience,
  not a guarantee for every country; preserve currencies from the source documents.
- `budget.defaultCurrency`: optional code.
- `budget.items`: initial ledger records `{id,purpose,cents,currency,category,status,payer,members,splitMode,date?}`.
  `cents` is a positive integer of hundredths; convert decimal source amounts with
  `HandbookModel.cents`, not floating point multiplication. This version supports
  two decimal places for all enabled currencies; don't claim currency-specific minor-unit rules.
- `status`: `paid` or `pending`; `payer`: known member ID or null.
- `splitMode`: `individual` (exactly one `members` entry) or `equal` (one or more).
  Do not infer sharing from party size. Equal allocation sorts IDs and assigns remaining
  cents deterministically. Shares always sum to the original amount.
- Categories: 机票、住宿、地面交通、餐饮、体验、购物、其他.
- Paid totals mean personal responsibility in paid records, not cash personally advanced.
  Member debts retain the original full handbook's CNY equivalent calculation, using the expense's saved rate when available. Debts offset only between each pair, not through a third traveler. Unknown rates are excluded from conversion and labeled pending; never invent a rate. Settlements use CNY and do not add to spending totals; settlement actions are undoable.
- A deposit and remaining balance should be two linked-by-purpose records; never
  count a full total plus its deposit as two expenses. Later record edits use the app API.

## Preparation

- `packingGroups`: `{id,title,items:[{id,text,people?}]}`. These are reusable base items; people scopes are optional. Every member may hide a base item independently. Missing packingGroups uses six generic groups; an explicit empty array is honored.
- `tasks`: `{id,text}` shared initial tasks.
- `preparation.clothing`: optional `{title,summary,climates:[{place,range,badge,note,wear}],packing:[[item,quantity]]}`. Derive the summary from sourced climate/forecast and stated activities. Without evidence use generic layering advice, not the author's old destination temperatures. Keep the expandable guide and per-day forecast interaction.
- User additions, checks, expense edits and settlements are stored in mutable state,
  separate from itinerary JSON. Copying personal items makes independent IDs and
  does not copy another member's check marks. IDs are preserved on repeated imports.

## Unknowns

Absent price is not zero. Absent booking document is not unbooked. Proposed plans
are not reservations. Do not populate weather unless it has the actual `validDate`;
runtime weather may replace it only with a matching forecast date.


## Optional source documents and test fixtures

- `days[].documents`: `{title, file}` entries. `file` accepts the same local PDF/image
  path or HTTPS reference as a hotel document. Local files are copied with content
  hashes, retained across regeneration and included in offline downloads. Rendered
  links stay inside a collapsible day section. Images are not put in the public Skill.
- Test-only flights may use `status: "test"` and a short `testNote`. They render an
  explicit sample label; only create these on an explicit request for fabricated data.
- With no stays the hotel card is omitted. `days[].stayNote` can describe evidenced
  overnight transport or a departure day. Same-date hotels open by their unique IDs.

## Overview map hierarchy

Days accept `countryCode` (ISO alpha-2) and `mapCities: [{name,countryCode,latitude,longitude}]`. Without mapCities, use the day's city and city-center coordinates. `route` entries only enter overview maps when explicitly marked `kind: "city"`; unclassified POIs never do. Flight endpoints should include countryCode, including transit countries. Country outlines are bundled; world maps label countries and regional maps label cities.
