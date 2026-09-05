# NodeTasks developer and evaluator handoff

Start here, then read [README](README.md) and the [vendored provenance boundary](docs/UPSTREAM_PROVENANCE.md). An evaluator uses NodeTasks to find a task, inspect its sources and scoring limits, download a selected bundle, and decide what environment is required before running anything. The local explorer answers from the catalog; it does not execute the listed tasks or certify their upstream commands.

This is a source-build consumer of PR 1 at `8e9b6495ba3bf716549825d05f48faaefc73dcfb` (tree `47bfab14eec7149a288a0ccd09be857fbfe70c2f`) plus the bounded working repair. The receipt, doctor and first-use proof work without `.git`. The original PR 1/PR 2 branches and primary checkout remain preserved. This candidate awaits independent review; it is not a publication or deployment claim.

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

Choose a new output folder and two free consecutive local ports. This finite proof owns and closes its Streamlit and static servers. It tests the public-repository saved view, exact task/source/score boundaries, real downloaded/reopened JSON, Rows-limited top-N output, repeated exports, local answers with task citations, empty results, a zero-count bundle when present, reload, keyboard navigation and 200% root text enlargement at six widths. It preserves console/DOM/pixels, downloaded bytes and exact source hashes. It blocks browser egress and verifies the rendered endpoint is empty. It does not run a benchmark, supplier action, external endpoint or provider.

The committed storyboard script still expects the old 9,140 count and overwrites tracked media. It is historical and is not the first-use acceptance command. Do not regenerate those assets or the catalog to conceal a failed proof.

## Corpus and ownership boundary

The current source repair stops invalid indexed paths before reading file contents. Paths must be canonical public relative names under `upstream/noderoom`; every parent is checked without following links, and the leaf must be a physically contained regular file with canonical filesystem spelling. This includes Windows aliases, device names and alternate-stream syntax. A rejected path or failed source read makes `sourceIndexValid` false. The normal valid receipt remains byte-for-byte unchanged.

The scenarios preserve a good receipt through missing/stale receipts, malformed and duplicate tasks, controlled source-byte drift, four concurrent and three later frozen reads, then recovery. This is not an atomic filesystem snapshot or protection against a hostile concurrent filesystem swap. Keep proof inputs frozen and retain any drift rather than regenerating a clean-looking receipt.

NodeTasks owns only `nodetasks.corpus-receipt`. It consumes the repository contract and three registered NodeAgent concepts; four frozen signatures are `migration-copy` with their original NodeAgent owners. Doctor's positive ownership check still requires exactly the one independent corpus owner. The redundant negative regex that accidentally crossed into `consumes` was removed; actual CLI scenarios reject added or replaced NodeAgent ownership.

The unsigned corpus receipt hashes 18 catalog/schema artifacts and 1,236 indexed source files, with a protected semantic-boundary hash. It does not bind the UI, producer implementation, installed dependencies or Git identity, and it does not execute a JSON Schema validator. `releaseReady: true` means the deterministic corpus validation passed. It does not mean the app, upstream tasks or an official benchmark score are ready. The original upstream NodeRoom revision remains unknown and is not invented.

## Current evidence and limits

Normal `npm run check` and the registered NodeKit repository check pass on this source consumer. The three previously reproduced traversal, blocked-name and parent-junction reads now read zero sentinel files and report `passed: false` plus `sourceIndexValid: false`. The accepted doctor correction, original failures and source bindings are retained with the first-use evidence.

The final browser replay completed at 320, 390, 768, 1024, 1440 and 1920 pixels with 66 captures and 37 real downloaded/reopened JSON files. All six keyboard paths reached the download action; local answers, repeated exports, no-result recovery and reload passed. Console errors, page errors and browser external requests were empty. The finite actions completed; this is not a visual-quality grade.

The current raw findings remain open: rapid filter/Rows changes followed by download can yield the previous displayed rows while Streamlit is still running. Four separate native input/download attempts reproduced a 15-row file after requesting an empty-result filter; settled-only successful downloads do not erase this behavior. Natural-theme metric cards inherit dark text on a dark background. The separate static HTML browser's selected result overflows by 270 pixels at width 320 and 200 pixels at width 390. No UI source repair is included in this scope. Full visual, responsive, accessibility, performance, provider and production grades remain unassigned, even where the finite consumer actions pass.

The [portable evidence entry](evidence/corpus-first-use-20260905/README.md) is the review handoff for source/installed identities, commands, before/after read observations, actual exports and unresolved UI findings. The original valid receipt is preserved; use `npm run proof` to check it. Use `npm run validate` only after an intentional reviewed corpus change, never to hide an unexpected failure.
