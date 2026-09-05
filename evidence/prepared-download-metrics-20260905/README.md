# Prepared NodeTasks downloads and readable metric text

An evaluator needs a downloaded task list to mean the filters they explicitly prepared. The old button could return earlier rows while a filter rerun was pending. This scoped repair adds native preparation and visible same-run context, and corrects dark-on-dark metric labels/values. It leaves task facts, delta colors/icons, saved bundles and the unsigned corpus receipt unchanged.

Read [the current handoff](../../HANDOFF.md) first. Then use the normal first-use command there with a new output folder and two free local ports. No provider endpoint or environment file is needed. Install Chromium explicitly before a fresh browser replay.

## Observed scope

- Exact Chromium/Windows viewports: 320×800, 360×800, 390×844, 768×1024, 1024×768, 1440×960 and 1920×1080. These are browser viewports, not real-device certification.
- Final reusable journey: 93 captures and 59 real downloaded/reopened JSON files. It exercises preparation, Rows limits, all effective filter fields, pending edits against an earlier labelled snapshot, rerun invalidation, four-byte empty JSON, explicit recovery, repeated exports, keyboard activation, local answers and reload.
- Metric comparison covers 5 summary, 5 task and 3 provenance labels/values. Delta text/icon/colors and backgrounds remain unchanged. The original and repaired pixels are preserved at matching viewport pairs.
- 200% computed root text was applied and restored. Native browser zoom, real devices, other engines, assistive technology and human usability remain unverified.
- Normal `npm ci` and `npm run check` passed locally. The separately added finite read-only CI workflow has not run on GitHub yet.

## Review the actual evidence

- [Final browser report](raw/browser-prepared-04/report.json), [normal check](raw/normal-final-check.log), [metric comparison](raw/metric-comparison-final.json), [source bindings](source-bindings.json).
- [390 before](raw/before-exact-profile-02/download-ready-390/change-boundary.png), [390 prepared after](raw/after-exact-profile-final/prepared-390/after.png), [390 enlarged text](raw/browser-prepared-04/390-text200.png).
- [1440 before](raw/before-exact-profile-02/download-ready-1440/change-boundary.png), [pending edit and labelled previous snapshot](raw/browser-prepared-04/1440-pending-old-preparation.png), [actual pending download](raw/browser-prepared-04/1440-pending-download.json), [all-filter context](raw/browser-prepared-04/1440-all-filter-context-state.png), [its actual file](raw/browser-prepared-04/1440-all-filter-context.json).
- [Before matrix](raw/before-exact-profile-02/report.json), [matched after matrix](raw/after-exact-profile-final/report.json), [retained harness failures/corrections](raw/HARNESS_CORRECTIONS.md.inert.txt), [primary Git action-pin records](raw/official-actions/receipt.json).

The static HTML search surface still overflows at narrow widths and is outside this repair. The natural metric delta styling, broader visual/design/interaction/accessibility/performance criteria, provider/benchmark behavior, shared integration and production remain open. All complete dimension/overall grades stay null. Passing this finite journey does not certify the advertised upstream task commands or official benchmark scores.

## Verify custody

Run `python evidence/prepared-download-metrics-20260905/verify.py` from the repository, or run `python verify.py` inside this packet. This standard-library check verifies all portable manifest payloads. Add `--source-root .` from the repository to compare the four current owners and 1830 protected baseline files, including the unchanged 552-file historical packet. Git metadata is unnecessary for that comparison. The manifest carries raw SHA-256 and Git blob identities; it does not claim a commit or approval.

[Raw-copy map](raw-copy-map.json) identifies exact operator copies. [Local-only inventory](local-only-inventory.json) lists excluded HTML and intermediate artifacts with hashes. Those original files remain operator-local; their inventory is not portable content coverage. Reusable browser replay generates fresh DOM/HTML locally. Historical executable code, Markdown and Git custody files are copied as inert text. No local environment, credentials, database or browser/session capability is copied into this packet.
