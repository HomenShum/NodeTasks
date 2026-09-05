# NodeTasks developer and evaluator handoff

Start here, then read [README](README.md) and the [vendored provenance boundary](docs/UPSTREAM_PROVENANCE.md). An evaluator uses NodeTasks to find a task, inspect its sources and scoring limits, download a selected bundle, and decide what environment is required before running anything. The local explorer answers from the catalog; it does not execute the listed tasks or certify their upstream commands.

This candidate starts from the reviewed corpus/first-use baseline `1e9bf5ebea420f42ec5880238c4db46dc7de19ad` (tree `94861bf436370aae82b019cc95ad53b848a47019`), built on PR 1. The receipt, doctor and first-use proof also work in a source export without `.git`. The original source export, PR 1/PR 2 branches and primary checkout remain preserved. The prepared-download/metric/finite-CI follow-on and the separate static reflow have independent source and UI evidence approval. Their portable supplement is under final publication review; committed-head shared CI remains pending.

## Fresh local setup

Use Node 22 and Python in a dedicated environment beside the source directory. In a fresh checkout:

```powershell
npm ci
npm run check
python -m venv ..\nodetasks-venv
..\nodetasks-venv\Scripts\python.exe -m pip install -r requirements.txt
npx playwright install chromium
```

The Python requirements specify minimum versions, not a lock. The retained consumer installed Streamlit 1.63.0 and pandas 3.0.5; its evidence records the full resolved versions. Do not copy personal environment files or configure a model endpoint for this local journey. Chromium requires the separate install above; `npm ci` alone does not install a browser. Linux may additionally need `npx playwright install --with-deps chromium` when system-package installation is permitted.

For an interactive explorer, run the isolated Python with an explicit port:

```powershell
..\nodetasks-venv\Scripts\python.exe -m streamlit run apps/nodetasks_streamlit.py --server.address 127.0.0.1 --server.port 8502 --server.headless true --server.fileWatcherType none --browser.gatherUsageStats false
```

Open `http://127.0.0.1:8502/?view=public-node-repo-proofs`. Before asking a question, expand Filters and verify **NodeAgent endpoint** is empty. The manual command inherits the caller's environment; the automated proof below removes `NODEAGENT_ENDPOINT` and `NODETASKS_CATALOG` from its own child environment without changing the caller. Endpoint-mode behavior is not certified by this local proof.

The static `catalog/task-browser.html` is a separate search surface. Open it locally or serve that folder. Its results are capped at 200 and it has no model endpoint.

## Named first-use proof

```powershell
node scripts/verify-first-use.mjs --python ..\nodetasks-venv\Scripts\python.exe --output ..\nodetasks-first-use-proof --port 54532
```

Choose a new output folder and two free consecutive local ports. This finite proof owns and closes its Streamlit and static servers. It tests the public-repository saved view, exact task/source/score boundaries, prepared filtered JSON, Rows-limited output, repeated exports, local answers with task citations, empty results, a zero-count bundle when present, reload and keyboard preparation/download. The viewport pairs are 360×800, 390×844, 768×1024, 1024×768, 1440×960 and 1920×1080, plus 320×800 reflow. It also applies and restores 200% computed root text size; that is not native browser zoom or real-device evidence. It preserves console/DOM/pixels, downloaded bytes and exact source hashes, blocks browser egress and verifies the rendered endpoint is empty. It does not run a benchmark, supplier action, external endpoint or provider.

To export the current table, choose filters and a Rows limit, then select **Prepare filtered JSON**. Read the prepared count and expand **Prepared filters** to inspect the exact Search, Persona, Saved view, Domain, Kind, Difficulty, Cost tier, Tag, Sort and Rows used for that file. **Download prepared JSON** always means that prepared snapshot, including when another field has a pending edit. A completed filter rerun removes preparation; prepare again to obtain the new result. Repeated downloads preserve the same bytes. Zero matches produce the existing four-byte empty-array serialization. Saved-bundle downloads remain a separate operation.

The committed storyboard script still expects the old 9,140 count and overwrites tracked media. It is historical and is not the first-use acceptance command. Do not regenerate those assets or the catalog to conceal a failed proof.

## Corpus and ownership boundary

The current source repair stops invalid indexed paths before reading file contents. Paths must be canonical public relative names under `upstream/noderoom`; every parent is checked without following links, and the leaf must be a physically contained regular file with canonical filesystem spelling. This includes Windows aliases, device names and alternate-stream syntax. A rejected path or failed source read makes `sourceIndexValid` false. That path-boundary repair preserved the original valid receipt. The later reviewed static reflow intentionally changes only the generated HTML byte count/hash and derived corpus hash; all task, source and score-boundary fields remain identical.

The scenarios preserve a good receipt through missing/stale receipts, malformed and duplicate tasks, controlled source-byte drift, four concurrent and three later frozen reads, then recovery. This is not an atomic filesystem snapshot or protection against a hostile concurrent filesystem swap. Keep proof inputs frozen and retain any drift rather than regenerating a clean-looking receipt.

NodeTasks owns only `nodetasks.corpus-receipt`. It consumes the repository contract and three registered NodeAgent concepts; four frozen signatures are `migration-copy` with their original NodeAgent owners. Doctor's positive ownership check still requires exactly the one independent corpus owner. The redundant negative regex that accidentally crossed into `consumes` was removed; actual CLI scenarios reject added or replaced NodeAgent ownership.

The unsigned corpus receipt hashes 18 catalog/schema artifacts and 1,236 indexed source files, with a protected semantic-boundary hash. It does not bind the UI, producer implementation, installed dependencies or Git identity, and it does not execute a JSON Schema validator. `releaseReady: true` means the deterministic corpus validation passed. It does not mean the app, upstream tasks or an official benchmark score are ready. The original upstream NodeRoom revision remains unknown and is not invented.

## Current evidence and limits

At the reviewed baseline, normal `npm run check` and the registered NodeKit repository check passed on the source consumer. The three previously reproduced traversal, blocked-name and parent-junction reads then read zero sentinel files and reported `passed: false` plus `sourceIndexValid: false`. The accepted doctor correction, original failures and source bindings remain retained with the first-use evidence.

The historical baseline browser replay used six widths at a 900-pixel height, with 66 captures and 37 downloaded/reopened JSON files. Its keyboard, local-answer, settled export and reload observations remain historical; those width-only cells do not meet the later exact viewport-pair profile.

The current source completed normal `npm run check` with all five scenarios, then the final browser journey completed all seven exact pairs with 93 captures and 59 downloaded/reopened JSON files. This includes actual Enter-triggered downloads, non-default values for every prepared filter, native pending-edit behavior, repeated recovery, and ten local catalog answers. Page errors and browser external requests were empty. The two new snapshot labels use readable native body text; their actual ancestor opacity is checked. Earlier provisional caption rendering and interrupted harness evidence remain retained, not relabelled as current-source passes.

Four baseline native input/download attempts returned 15 old rows after requesting an empty-result filter. The current UI addresses that ambiguity with explicit same-run preparation and visible snapshot context, without a new session history or form. It also sets a readable foreground for the five summary, five task and three provenance metric labels/values. Delta text/icons/colors, card backgrounds and task facts remain unchanged. The [prepared-download evidence](evidence/prepared-download-metrics-20260905/README.md) records the current proof, original failures, source identity and limits.

The separate static HTML search page now wraps complete task identifiers and source references at all seven tested viewport pairs. Its existing generator owns five CSS clauses; 30 actual before/after search result comparisons remain exact. The ordinary generator changes only HTML among 18 catalog/schema artifacts. The old receipt fails as stale before intentional validation changes its HTML byte count/hash and aggregate corpus hash. Normal npm run check passes with all five scenarios. Independent native End captures show both complete source-reference tails with doubled computed fonts at 320 and 390; the static R1 observation is 5/5 within that scope. Read the [static repair and independent prepared-context supplement](evidence/static-reflow-20260905/README.md). Full visual, design, responsive, interaction, accessibility, performance, usage and alignment grades remain unassigned. Real devices, other browser engines, native zoom, assistive technologies, real-human first use, endpoint/provider mode and production remain unverified. Passing finite actions or repairing metric text does not establish a whole-product grade.

The new [finite CI workflow](.github/workflows/ci.yml) runs on pull requests and pushes to `main`, with read-only contents permission and a ten-minute job limit. It installs Node 22, runs normal `npm ci`, then `npm run check` (doctor, five scenario tests and read-only receipt verification). Official action revisions are pinned to verified Git commits. It does not regenerate the receipt, install the Python UI, run benchmarks or deploy. Actual shared CI execution is pending; a local check does not certify it.

The [historical corpus evidence](evidence/corpus-first-use-20260905/README.md) preserves baseline source/installed identities, commands, read observations, exports and original UI findings. Its default verifier checks those retained bytes; its optional `--source-root .` comparison is a historical baseline check and is expected to differ for the current app, first-use proof and handoff. The original valid receipt is preserved in the static supplement; `npm run proof` checks the current intentional receipt. The prepared-download packet is also a historical source snapshot: its default verifier still verifies its exact portable bytes, while `--source-root .` now correctly differs for the later handoff/static owners. The new supplement verifier checks the current combined source and protected files. Use `npm run validate` only after an intentional reviewed corpus change, never to hide an unexpected failure.


## Repeat the static reflow proof

After npm ci and Chromium installation, choose a new output directory:

```powershell
node scripts/verify-static-reflow.mjs ..\nodetasks-static-proof
python evidence/static-reflow-20260905/verify.py --source-root .
```

The recorder serves the committed public HTML/search index on one owned random loopback port. It compares native searches/filters/quick buttons and repeated/keyboard results with the retained pre-repair HTML, then captures all seven viewport pairs, empty/200-result recovery and simultaneous doubling of each computed element font. It rejects horizontal document/text overflow, records DOM/pixels/errors, blocks browser egress and closes its browser/server. It does not execute the listed tasks, call a provider, alter the corpus or measure native browser zoom. The independent End-tail evidence is a separate retained check, not an action this recorder claims to perform.

The original [44-criterion assessment](evidence/static-reflow-20260905/raw/E6h_NODETASKS_CRITERION_ASSESSMENT.md.txt) contains 33 bounded observations and 11 NOT_RUN at its prepared-UI source freeze. The [static addendum](evidence/static-reflow-20260905/raw/E6h_NODETASKS_STATIC_CRITERION_ADDENDUM.md.txt) supersedes only the demonstrated static overflow. Legacy caption contrast, Streamlit metric ellipsis and enlarged header clipping remain explicit. All full dimension scores remain null.
