# Private source coverage review

For XLSX, keep `workbook.json` and its media produced by `extract-xlsx.py`. The
extractor assigns stable source IDs within that workbook: `sheet1:A1`,
`sheet1:image1`, `sheet1:link1`, `sheet1:comment1`. Read all nonempty cells and images,
including references positioned beyond the apparent data table and hidden sheets.

Create `intake-review.json` beside your normalized `trip-data.json`, outside `public`:

```json
{
  "workbookSha256": "hash from workbook.json",
  "coverage": [
    {"sources": ["sheet1:A1"], "handling": "structure", "note": "Column heading"},
    {"sources": ["sheet1:A2", "sheet1:B2"], "handling": "represented", "targets": ["event:walk"], "note": "Day and activity preserved"},
    {"sources": ["sheet1:image1"], "handling": "represented", "targets": ["day:2028-05-09"], "note": "Inspected the route-reference image; attached to the matching day"}
  ],
  "decisions": [
    {"topic": "Unresolved fact", "sources": ["sheet1:B2"], "outcome": "Preserved as pending, not confirmed"}
  ]
}
```

Allowed handling values:
- `represented`: link to one or more real output targets.
- `deferred`: relevant but unresolved; state what is missing and how it is exposed.
- `structure`: headings, separators, repeated labels; never use this to hide content.
- `excluded`: deliberately irrelevant, duplicate or private material; explain why.

Targets are `trip`, `day:YYYY-MM-DD`, `event:ID`, `person:ID`, `flight:ID`,
`stay:ID`, `expense:ID`, `task:ID`, or `preparation`. Group related source cells where
appropriate; each source needs an explicit disposition, not a full copied paragraph.
For every image, the note must reflect inspection and its type/day association.
For dates, booking status, inferred members, money and proposed changes, add a short
decision with source IDs. Record publicly retrieved coordinates/rates with URLs and
retrieval dates in private notes; they are not evidence from the user's workbook.

Run:

```sh
node scripts/check-intake.mjs extracted/workbook.json intake-review.json trip-data.json
```

This checks coverage and resolvable output targets. It cannot judge whether a
description is truthful or a date was interpreted correctly. Human/agent inspection
of the source and generated page is still required. Never call coverage alone an
acceptance pass. Keep this review private; it is not another screen for the traveler.
