# NodeTasks Persona Smoke Results

Generated during local Streamlit verification against `http://127.0.0.1:8502`.

## Commands

```bash
npm run build:catalog
npm run validate
python -m py_compile apps/nodetasks_streamlit.py
npm run search -- --view cheap-spreadsheetbench-models --limit 3
npm run streamlit
```

## Browser Checks

| Persona | URL lens | Observed result |
| --- | --- | --- |
| Model evaluator | `persona=Model evaluator&q=spreadsheetbench model-attempt cheapest&kind=model-attempt&sort=cost` | Filtered to `5,416` model-attempt tasks. First ranked result was a low-cost `poolside/laguna-xs-2.1` SpreadsheetBench model attempt with advanced difficulty, 9 estimated steps, and provider-low cost. |
| Product QA | `persona=Product QA&q=browser test chat graph trace notebook&sort=difficulty` | Rendered browser-test-case results, including notebook workplan live proof with 4 estimated steps and external-variable cost. |
| Finance analyst | `persona=Finance analyst&q=spreadsheetbench bankertoolbench accounting finance evidence&sort=domain` | Rendered finance-domain tasks, including BankerToolBench NodeAgent smoke evidence and free-static unit-test starting points. |
| New contributor | `persona=New contributor&q=nodeagent graph intro source test&sort=difficulty` | Rendered intro/free-static NodeAgent graph and test tasks suitable for repo onboarding. |
| Benchmark maintainer | `persona=Benchmark maintainer&q=proofloop benchmark official scorer gate&sort=difficulty` | Rendered benchmark/governance tests and official-browser-gate checks without claiming official benchmark scores. |
| Model evaluator saved view | `view=cheap-spreadsheetbench-models&persona=Model evaluator` | Filtered to `4,952` SpreadsheetBench model-attempt tasks. The first result showed provider-low cost, advanced difficulty, curation guidance, and model-proxy provenance. |
| Product QA saved view | `view=browser-proof-surfaces&persona=Product QA` | Saved-view tab and downloadable bundle rendered browser proof surfaces without requiring endpoint configuration. |
| Provenance reviewer | `view=official-score-boundaries&persona=Benchmark maintainer` | Provenance tab rendered verifier-type and score-status rollups, preserving the official-score boundary. |

## NodeAgent Panel

The Streamlit NodeAgent tab was opened under the model-evaluator lens. With no external `NODEAGENT_ENDPOINT` configured, the deterministic catalog mode returned:

- matching task count,
- best ranked match,
- lowest-cost and easiest starting points,
- dominant domains and difficulty mix,
- persona-specific next action,
- cited task ids with source refs.

This proves the NodeAgent-style QA component works locally and is ready to delegate to a real NodeAgent endpoint when configured.

After the saved-view/provenance pass, the NodeAgent panel was opened at:

```text
http://127.0.0.1:8502/?view=cheap-spreadsheetbench-models&persona=Model%20evaluator&ask=Which%20cheap%20SpreadsheetBench%20model%20attempts%20should%20I%20run%20first%3F
```

The panel rendered the `nodetasks-nodeagent-bridge-v1` contract, returned local catalog mode with cited task ids, and showed `model-proxy-receipt`, `official-boundary-blocked`, and the primary SpreadsheetBench suite in the answer preview.

## README Media

Captured from the live app:

- `assets/nodetasks-01-search.png`
- `assets/nodetasks-02-saved-views.png`
- `assets/nodetasks-03-provenance.png`
- `assets/nodetasks-04-nodeagent.png`
- `assets/nodetasks-streamlit-explorer.gif`
