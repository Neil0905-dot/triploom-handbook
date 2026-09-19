# Generation gate

Run this gate after reading the available files and before normalization.

## Page selection

Use one compact tool-style question:

> 请选择这次需要的页面：今日、行程、账本、准备。默认生成全部四个。

If the user does not select a subset, enable all four. Missing flights, expenses,
packing items or bookings do not disable a page. Never infer that the user does not want
the ledger merely because no expense records were supplied.

## Sparse itinerary selection

A source is sparse when it cannot form at least one dated day with a destination and one
meaningful activity or transport item. Only then ask:

> 现有资料还不足以形成完整日程。请选择：由 AI 先拟一版可调整的行程，或只按现有资料生成。

If AI planning is selected, obtain only missing destination, dates or duration, traveler
count and pace. Mark generated activities `proposed`; do not fabricate reservations,
prices, flight numbers or confirmed availability. If existing-only is selected, keep
unknowns honest and produce useful empty states.

Ask additional questions only for contradictions that change dates, participants,
amounts or booking status. Batch those questions. Do not ask users to translate their
files into the data model.
