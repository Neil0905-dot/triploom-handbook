# Accept the generated handbook, not just the generator

Before handing off, inspect the actual generated trip. Use the host's browser tools
or Playwright; discover the installed runtime rather than relying on an author's
absolute paths. In Codex Desktop, `load_workspace_dependencies` can locate bundled
runtimes. Otherwise use Node 24+ and Python 3 available to the host. If a capability
is missing, disclose the exact unperformed check instead of inventing a pass.

1. Validate data, source coverage, and template integrity. Verify source-dependent
   facts against the original material: date range, members, transportation times,
   separate hotel addresses, booked/proposed states, actual payments and documents.
   Counts alone are not proof of correct interpretation.
2. Run `serve-handbook.mjs` and inspect all four pages at 390 and 320 CSS pixels.
   The printed `/__preview` URL reports its actual frame viewport and supports date simulation. Check
   ordinary Today, an available flight day, and the real current date. The header's
   simulation label must remain visible. Do not manufacture weather for screenshots.
   Check header text against the member button, not only document-level overflow.
   When another flight follows an active flight, the countdown must still refer to
   the displayed active flight's arrival, including after the periodic UI update.
3. On this trip, open every supplied booking document and each same-day hotel. Check
   route labels and the highlighted day on a real geographic outline. Inspect the
   default art/empty states, not only the rich-data example. An optional missing
   module should not create a blank wall, but its absence must not delete other pages.
   Nearby city points must remain distinguishable. A static geographic overview
   does not establish street-level navigation quality.
4. In a disposable browser profile, save decimal amounts using both comma and point;
   expand more than five pending records; add a personal item, type during a background
   update and reload. Do not leave QA records in the traveler's live data. Existing
   `tests/full-browser.mjs` covers broader synthetic multi-member interactions, not
   whether this particular source was faithfully imported.
5. Verify `handbook-project.json` with `verify-project.mjs`. Ordinary data import must
   not quietly replace the template's code with an ad-hoc simplified page. If a repair
   was needed, preserve the original result and label the repaired iteration.

Deliver the actual link or project, package version, meaningful unresolved decisions
and the checks really performed. State whether local edits are browser-only or shared.
Don't give an arbitrary completion percentage, call mock cloud tests deployment, or
claim a same-machine test is a new-computer installation. Actual cloud acceptance
requires the chosen user's account and two independent browser/device sessions.

For independent acceptance, freeze the distribution before the evaluator sees its
task. Provide only the package, raw inputs and an ordinary user request. Keep expected
answers, prior outputs and author explanations outside the evaluator's workspace.
Do not coach it mid-run. Preserve its output before inspection or repairs. The same
model without conversation history tests contextual dependence; it does not by
itself prove operating-system isolation or real-world usability on every machine.
