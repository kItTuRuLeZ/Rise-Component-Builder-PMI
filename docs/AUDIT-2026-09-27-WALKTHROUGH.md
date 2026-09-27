# 27 September 2026 functional audit — implementation walkthrough (PMI edition)

Source document: the AT&T edition's `ATT Design System/Claude Promts/Rise-Builder-ATT-PMI-Next-Fixes-Claude-Code.md`
(this repo does not carry its own copy; both editions were implemented against the same audit).
This records what was actually done in this repo against that document's four sections, with root
causes, the exact fix, the files touched, and the test evidence for each. The equivalent AT&T-edition
work is recorded in that repo's own `docs/AUDIT-2026-09-27-WALKTHROUGH.md`; the two are
cross-referenced below wherever a fix was shared or ported.

**Read this alongside the final verdict at the bottom before treating any of it as a green light.**
Nothing here was checked against a real Rise 360 export — see "The Rise compatibility gate."

## Section 1 — Every starter block must export

Same root causes and fixes as the AT&T edition (the export pipeline and the two affected
components' lightbox markup are structurally identical between editions):

- **Horizontal Timeline / Image Gallery:** both rendered a lightbox `<img src="" ...>` with the
  real URL set only on open by JS. The course exporter's broken-media-reference gate
  (`js/dashboard/project-export.js`) flags exactly that empty-`src` pattern as a proxy for a
  silently-dropped `blob:` reference — a false positive against legitimate placeholder markup.
  Fixed by removing the `src` attribute entirely from both.
  - [components/horizontal-timeline.js](../components/horizontal-timeline.js)
  - [components/image-gallery.js](../components/image-gallery.js)
- **Comparison Slider:** the QA blank-title check used a hardcoded field-name list that didn't
  include Comparison Slider's actual item fields, so every item read as blank. Fixed by asking the
  component's own schema for its primary identifying field via the newly-exported
  `primaryField(schema)` (`js/validation.js`), the same resolution the schema engine already uses
  for duplicate-item detection.
  - [js/validation.js](../js/validation.js)
  - [js/dashboard/project-qa.js](../js/dashboard/project-qa.js)

**Tests:** `tests/unit/all-starter-exports.test.js` builds a course from all 26 `COMPONENT_REGISTRY`
starters, exports through the real `buildCourseProjectZip`, and asserts 26 entry pages, a valid
manifest, and no empty-`src` markup anywhere; a direct test of the Comparison Slider fix against
`auditCourseProject`. Confirmed failing on revert.

**Commit:** `947d7d1` — *fix(export): all 26 starter blocks export in a course ZIP; Comparison
Slider's blank-title false positive*.

## Section 2 — Preflight, export review, and packaging must agree

Same investigation and same single defect as the AT&T edition: the preflight/QA/export
architecture (`js/validation.js#runPreflight`, `js/dashboard/project-qa.js#auditCourseProject`,
`js/dashboard/course-readiness.js`, `CourseExportError` in `js/dashboard/project-export.js`) was
already correctly aligned once Section 1 landed — `checkBrokenMediaReferences` checks the real
media store, blockers are force-upgraded rather than silently allowed through, and every
`CourseExportError` names the specific component and reason. No "100% Compliant"-style claim
exists anywhere in this pipeline's UI strings.

**Defect found:** the dashboard's "Overall Readiness" badge appended a raw `(${qa.overallScore}%)`
next to the status text, contradicting `course-readiness.js`'s own documented intent to never
collapse readiness to one number.

**Fix:** removed the percentage suffix; the badge shows `qa.overallStatus` text only.
- [js/dashboard/project-overview.js](../js/dashboard/project-overview.js)

**Tests:** `tests/unit/readiness-no-percentage.test.js` — confirmed failing on revert.

**Commit:** `53a04ca` — *fix(qa): the outline's readiness badge no longer shows a percentage*.

## Section 3 — AT&T and PMI must not share local data

**Root cause:** both editions deploy from `kittu-rulz.github.io` under different **paths** but the
same **origin**, and `localStorage`/IndexedDB are scoped per-origin, not per-path — every
unnamespaced key and the shared media IndexedDB database were literally shared between the two
deployed apps in one browser profile.

**Fix (ported from the AT&T edition's `a570827`, adapted for this edition):**
- `js/client-isolation.js` (new): `EDITION = 'PMI'`; `CLIENT_LABEL_ALIASES = ['pmi', 'project
  management institute']`; `namespacedKey(base)` rewrites `rise-builder-*` to
  `rise-builder-pmi-*`.
- `js/storage.js`: all 9 persisted keys namespaced. A one-time, idempotent
  `migrateLegacyStorage()` — called at the top of every `load*` function, not at module-import
  time, so it runs against real storage rather than whatever's initialized before a test seeds its
  fixtures — copies (never deletes) legacy records this edition can confidently claim via
  `clientLabel` alias match. `getUnclaimedLegacyProjects()` / `importLegacyProjectById()` give an
  explicit, user-initiated import path for records with a blank or unrecognized `clientLabel`,
  which are never auto-claimed.
- `js/media-storage.js`: the media IndexedDB database is now
  `rise-component-builder-pmi-media` (previously shared). A marker-guarded
  `migrateLegacyMediaForClaimedProjects()` copies only the media actually referenced by claimed
  projects, via independent raw `indexedDB.open()` connections — reusing the store's own
  `open()`/`transact()` wrapper here would deadlock, since the migration hook's own reads/writes
  would recursively await the very `open()` call running it.
- `js/dashboard/dashboard-view.js` + `design/dashboard.css`: a `dashboard-legacy-banner` lists
  every unclaimed legacy project with an explicit "Import into this edition" action, styled with
  this edition's own `--pmi-*` tokens (`btn-pmi-primary`/`btn-pmi-secondary`,
  `--pmi-surface-sunken`, `--pmi-border`, `--pmi-heading-contrast`).
- `tests/fixtures/index.js`: the shared fake IndexedDB fixture previously ignored its `name`
  argument, which would have let a migration-between-two-databases test pass even against a
  silently-wrong target database. Rewritten to key by database name.

**Deliberately not closed:** the pre-existing schema-migration backup key
`rise-builder-projects-backup-v2` remains shared across editions — called out here rather than
silently omitted from the inventory.

**Tests:** `tests/unit/device-preview.test.js` and `tests/e2e/persistence-prompts.spec.js` fixed to
read the real namespaced key from `js/storage.js#KEYS` instead of a hardcoded literal;
`tests/e2e/catalog-classification.spec.js` updated to the new literal `rise-builder-pmi-favorites-v1`
(seeds via `page.addInitScript`, which runs before a dynamic import is possible). Two new
end-to-end tests added to `tests/e2e/legacy-projects.spec.js` for the ambiguous-project banner and
explicit-import flow. **274/275** Playwright Chromium end-to-end tests passed (1 pre-existing
unrelated skip); **1960/1960** vitest unit tests passed; `tsc --noEmit` clean; ESLint 0 errors.

**Commit:** `5ee4826` — *fix(isolation): AT&T and PMI no longer share localStorage or IndexedDB*.

## Section 4 — Post-Publish classification and PMI labels

### The `Aqua (#4F17A8)` mislabel

**Root cause:** both color-picker popovers in this codebase render `"${name} (${hex})"` verbatim as
the swatch/option title *and* aria-label:

- `js/rich-text-editor.js`'s `PMI_BRAND_COLORS` (used by every rich-text field's "Text Color"
  popover) had **three different entries** — `'Aqua'`, `'PMI Navy'`, and `'Deep Violet'` — all
  pointing at Violet's hex (`#4F17A8`). The popover genuinely offered "Aqua (#4F17A8)": a color PMI
  has never called Aqua.
- `js/post-publish/editors/settings-editor.js`'s "Brand Theme Color" dropdown had its `default`
  option labelled "Aqua (#4F17A8)" — and per the audit's own instruction to check "the selected
  default and exported launcher CSS/config, not only the dropdown text," tracing `default` into
  the actual exported launcher CSS (`js/post-publish/runtime/rcb-ppt-styles.css`) confirmed the
  shipped launcher genuinely renders Violet (`--rcb-ppt-blue: #4F17A8`) when "Aqua" is selected —
  this wasn't only a display-text bug, the real behavior was also mislabeled. Separately, the
  `cyan` option's hex (`#00799E`) is PMI's real Aqua 500 — "PMI Cyan" isn't a color in the brand
  palette at all.

**Fix:**
- `PMI_BRAND_COLORS` consolidated to one entry per hex, reconciled against the canonical tokens in
  `design/pmi-tokens.css` / `js/pmi-tokens.js`: PMI Violet (`#4F17A8`), Violet Dark (`#371075`),
  Aqua (`#00799E` — was wrongly Violet's hex), Off-Black (`#200F3B`), Charcoal (`#100522`, the
  app-chrome dark background — confirmed this is a genuine, widely-used PMI color, correctly
  named), Muted Gray, Alert Red, Success Green (corrected `#13600C` → the canonical `--pmi-green`
  `#197F10`), Warm Orange.
- The launcher theme dropdown's `default` option relabelled "PMI Violet (#4F17A8) — Default"
  (matches what the exported CSS actually renders); `cyan` relabelled "Aqua (#00799E)". No hex or
  CSS values changed, so no already-published course's rendered appearance changes — only this
  editor's own display text.
- [js/rich-text-editor.js](../js/rich-text-editor.js)
- [js/post-publish/editors/settings-editor.js](../js/post-publish/editors/settings-editor.js)

**Tests:** `tests/unit/rich-text-editor.test.js` asserts every `PMI_BRAND_COLORS` hex is unique and
that Aqua/Success Green map to their canonical values (confirmed failing pre-fix: only 7 distinct
hexes among 9 entries). `tests/unit/post-publish-launcher-theme-labels.test.js` (new) reads the
actual `rcb-ppt-styles.css` at test time — not just the dropdown markup — and asserts every
option's displayed hex matches what that theme genuinely renders (confirmed failing pre-fix on
both the `default`/Aqua and `cyan`/"PMI Cyan" assertions).

**Commit:** `3300da7` — *fix(brand): rich-text and Post-Publish color pickers no longer mislabel
PMI's colors*.

### Checked, already correct, no change made

- Builder-course ZIP rejection (`js/post-publish/package-detector.js`'s `looksLikeBuilderCourse`)
  was already intact, with a specific explanation of what was uploaded and what's expected.
- A generic ZIP (`kind: 'generic-web'`) was already never presented as a confirmed Rise export:
  `js/post-publish/workflow-shell.js` shows a distinct "⚠️ Accepted as a generic web page" heading,
  and the detector's own label already reads "Generic web page (not identified as a Rise export)".

### SCORM 1.2 vs 2004 detection honesty

**Root cause:** `detectRisePackage` (`js/post-publish/package-detector.js`) treated the mere
presence of `adlcp:scormType` in `imsmanifest.xml` as a SCORM 2004 signal. That attribute marks a
resource as a "sco" and belongs to the Content Packaging extension **both** SCORM versions
share — it appears in nearly every valid manifest of either version, so it can't tell them apart.
This would have misclassified most real SCORM 1.2 packages as 2004.

**Fix:** replaced with genuinely 2004-exclusive signals: the Content Aggregation Model version
("CAM 1.3", vs. 1.2's "CAM 1.2" — kept from before) and Simple Sequencing & Navigation namespaces
(`adlseq`/`adlnav`/`imsss`), a capability that doesn't exist in SCORM 1.2 at all. The literal
substring `"2004"` is also kept, unchanged.
- [js/post-publish/package-detector.js](../js/post-publish/package-detector.js)

**Tests:** `tests/unit/post-publish-contract.test.js` — the pre-existing generic SCORM fixture
(which happens to include `adlcp:scormType`) now asserts `scorm12`, not `scorm2004`; a new test
builds representative 1.2 and 2004 manifest fragments and asserts each classifies correctly.
Confirmed both fail against the pre-fix source. Full unit suite: **1961/1961** passed; `tsc
--noEmit` clean; ESLint 0 errors.

**Commit:** `bc4b570` — *fix(post-publish): SCORM 1.2 vs 2004 detection no longer keys off a signal
both versions share*. Identical defect and fix as the AT&T edition's `39714ca` (this file is
shared, brand-agnostic logic between editions).

## Verification performed beyond unit/e2e tests

- Live end-to-end check of the legacy-project import flow (this edition's own dashboard, via the
  same banner/import UI as AT&T — see the AT&T walkthrough for the exact steps run there; the
  underlying component and CSS classes are identical between editions).
- **Not in scope:** the authoring tool's own chrome targets desktop use and is not required to be
  mobile-responsive — only the *exported components themselves* need to work across device sizes,
  and that is already covered by the existing `tests/e2e/preview-device-modes.spec.js` suite per
  component.

## The Rise compatibility gate

**No real Rise 360 export was available to this audit or this implementation pass.** Every export-
and package-detection fix above (Sections 1 and 4) was verified against synthetic fixtures built by
this project's own test helpers — hand-written `imsmanifest.xml` fragments, the starter/default
config for all 26 components — not against a real Rise-published Web or SCORM export, or a real
Rise-generated `imsmanifest.xml`. `js/post-publish/package-detector.js`'s own file-level comment
already discloses this ("Detection is by file structure only... has not been verified against a
live Rise export in this repository"). The SCORM 1.2/2004 fix replaces one unverified-against-real-
files heuristic with another that is more defensible on spec-reading grounds, but is **still
unverified against a real Rise-generated manifest of either version**. Treat it as "more likely
correct," not "confirmed correct," until checked against real files.

## Final verdict

**Verified fixes** (root-caused, fixed, and covered by a test that demonstrably fails on the
pre-fix code, plus a full green run of the existing suite):
- Section 1: Horizontal Timeline / Image Gallery export failures; Comparison Slider blank-title
  false positive.
- Section 2: readiness badge percentage removal.
- Section 3: full localStorage/IndexedDB isolation between editions, with non-destructive
  migration and an explicit ambiguous-project import path.
- Section 4: the `Aqua (#4F17A8)` mislabel in both the rich-text color picker and the Post-Publish
  launcher theme dropdown; SCORM 1.2/2004 detection signal correction.

**Investigated and found already correct** (no code change, but explicitly checked against the
audit's specific concern, not assumed): Section 2's preflight/export/QA alignment architecture;
Section 4's builder-ZIP rejection and generic-ZIP labeling.

**Incomplete / explicitly out of this pass's scope:**
- No independent accessibility audit (screen reader, keyboard-only pass) was run specifically for
  this audit's changes beyond what the existing Playwright a11y suites already cover for the
  touched components.
- The authoring tool's own UI was not audited for mobile responsiveness, per explicit scope
  clarification — it targets desktop only.

**Requires a genuine Rise export to actually close** (currently resting on synthetic-fixture
evidence only, per "The Rise compatibility gate" above):
- Whether a real Rise Web export is correctly identified as `kind: 'rise-web'` by
  `detectRisePackage`'s structural heuristics.
- Whether a real Rise-generated SCORM 1.2 manifest and a real SCORM 2004 manifest are each
  classified correctly by the corrected heuristic.
- Whether the 26-starter-block export fix (Section 1) produces a ZIP that, once actually published
  through Rise's own re-import/hosting path (not just unzipped and inspected locally), behaves
  identically to what the local test asserts.

This is a 4-of-4-sections-addressed implementation pass with genuine before/after regression
evidence for every code change, not a 10/10 or "fully verified" claim — the items in the section
directly above remain open until checked against real Rise output.
