# Decisions that must not depend on the author's memory

Preserve the full four-page application. Generalizing means replacing travel data,
not redesigning a smaller app. User-specific destinations, names, art and cloud
accounts are inputs, not defaults. Use this table while normalizing source material.

| Situation | Default behavior | When to involve the user |
|---|---|---|
| No flight information | Empty flights array; retain the rest of the handbook | Only if actual travel logistics need a decision |
| Partial flight information | Keep evidenced route/date/times; unknown code, airport or terminal stays unknown | Do not guess an airport merely because it is common |
| Samples explicitly requested | Visible test status and note, distinguish invented fields from source fields | Never introduce samples in ordinary generation |
| Rail, ferry or bus journey | Preserve as dated events with relevant details; overnight transport may use stayNote | A booking contradiction stays unresolved until clarified |
| No itinerary yet | Ask destination and dates/duration if absent; propose a coherent draft with proposed status, then refine in conversation | Preferences affect the draft, not whether the full UI exists |
| No year in date cells | Check dated documents, weekday consistency and context together; record evidence | If still ambiguous, label a preview assumption or ask; never silently use current year |
| Historical dates | Preserve them; provide a clearly marked simulated Today preview and a real-date recap | Reusing the plan in a future year requires a separate review |
| A date range spans several days | Keep the range and uncertainty; do not invent which person arrived on which day | Ask only when individual allocation is needed |
| Required and optional places, alternative routes | Preserve priorities, choose no contradictory alternatives as simultaneous commitments | Suggested prioritization remains proposed |
| Appointment clashes with another plan | Retain the confirmed appointment and both source facts; propose a feasible adjustment visibly | Confirmation is needed before declaring that adjustment accepted |
| Members unknown | A named generic placeholder is allowed for preview; do not infer the party from mentions or reservation headcount | Real names, personal dates and allocation are user facts |
| Several properties on one night | Keep each address and document as a separate stay; display them all until allocated | Never silently choose the first property for everyone |
| No hotel document or no price | Missing document is not cancelled/unbooked; missing price is not zero | Preserve the supplied booking status only |
| No expense records | Empty ledger with working entry controls; don't turn ticket-price notes into paid expenses | Payer, beneficiaries and split require evidence or a user choice |
| Known total, unknown sharing | Display total; do not infer equal sharing from headcount or room count | Support individual/equal sharing when specified; avoid custom-split complexity |
| Destination currencies | Use country mapping and supplied currencies, retain common alternatives | Unknown exchange rates stay unknown; never make up conversions |
| Source image near a row | Its anchor is a clue, not proof of the day; inspect image content and classify it | An ambiguous document stays unassigned privately rather than filed incorrectly |
| No bespoke art | Use bundled generic art and avatars; keep all normal controls | Optional custom art belongs only in this person's project |
| Maps | Separate display city/region from airport names; use sourced coordinates and actual route order | A city overview is not a street route; don't describe it as one |
| Weather unavailable | Use the honest compact unavailable state; retain itinerary content | Never use today's weather as a historical forecast |
| Hosting | Local preview first unless deployment is requested; reuse the user's chosen provider | Missing credentials require the user's login; don't substitute the author's account |

Keep traveler-facing copy concise: useful time, action, place and status. Put source
reconciliation, extraction mechanics and long uncertainty explanations in private
notes. Preserve important alternatives through concise notes, attachments or flexible
events. Avoid stuffing every original paragraph into the timeline.

The packaged implementation supplies the appearance and interactions. Do not rebuild
it from prose. If it cannot express a supplied fact, record that as a product gap,
deliver the unaffected content and report the gap; don't silently discard the fact or
claim an unsupported feature exists. A normal generation may change trip data; a
template repair must be an explicitly recorded versioned iteration.
