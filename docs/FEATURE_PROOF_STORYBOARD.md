# NodeTasks Feature Proof Storyboard

This storyboard is the first step before refreshing `assets/nodetasks-streamlit-explorer.gif`.

## Premise

NodeTasks is not just a large JSON dump. A future user should be able to open a public repo, search thousands of NodeRoom-derived tasks, rank them by cost/difficulty/domain, inspect provenance, and ask a NodeAgent-style question without losing the official-score boundary.

## Viewer Question

Can a new evaluator quickly answer: "Which tasks should I run first, why are they ranked that way, and what proof or score claim is allowed?"

## Comparison Axis

The clip moves from raw search to progressively stronger decision support:

1. Ranked task search.
2. Saved views and downloadable bundles.
3. Provenance and score-boundary rollups.
4. NodeAgent catalog Q&A with cited task ids.

## Conflict

The corpus is large enough to be unusable without hierarchy. The product also has a trust problem: model-attempt and benchmark-proxy tasks must not be mistaken for official benchmark scores.

## Evidence

The clip must show these proof states:

- `9,140` searchable tasks and filtered saved-view counts.
- A saved model-evaluator view scoped to SpreadsheetBench model attempts.
- Task-level rank fields: domain, difficulty, steps, and cost.
- Provenance fields: verifier type, score status, primary suite, and source refs.
- NodeAgent catalog mode returning cited task ids while preserving the official-score boundary.

## Verdict

NodeTasks turns the corpus into a ranked task explorer instead of a flat artifact dump. The user can start from role-specific bundles and inspect proof boundaries before running anything expensive or official-looking.

## Exit Decision

A viewer should open the Streamlit explorer, choose a saved view, and use NodeAgent Q&A as a planning surface before running benchmark or browser tasks.

## Capture Sequence

```text
Search -> Saved views -> Provenance -> NodeAgent
```

## Reproduce

```bash
npm run build:catalog
npm run validate
python -m py_compile apps\nodetasks_streamlit.py
npm run clip:capture
```
