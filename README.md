# NodeTasks

NodeTasks is a public task corpus and benchmark-proxy adapter bundle extracted from NodeRoom. It is meant to make live browser tasks, benchmark proxy adapters, proof receipts, rubrics, and benchmark-suite scaffolds discoverable outside the main application repo.

This repo is a curated source snapshot, not a claim of official benchmark scores. External benchmark adapters separate:

- `productPathCompletion`: whether a product UI path ran with visible proof artifacts.
- `officialSemanticScore`: an official benchmark score only when an upstream verifier is available and explicitly recorded.

## What Is Included

- Benchmark proxy adapters from `proofloop/benchmarks`.
- Local proxy tasks for Finch, FinAuditing, WorkstreamBench, and BankerToolBench.
- ProofLoop accounting, Notion, Proximitty, SEC/XBRL, live browser, and rubric files.
- Noderl proof/eval packages and anti-reward-hacking doctrine.
- NodeRoom benchmark/eval scripts and tests relevant to live tasks, proxy adapters, proof loops, and benchmark gates.
- Source support referenced by those suites, including `src/`, `convex/`, and NodeAgent adoption examples.
- Generated catalogs under `catalog/`.

## What Is Not Included

- Secrets, env files, generated `.proofloop` run state, local memory stores, `node_modules`, logs, or transient browser output.
- Official upstream benchmark datasets unless they were already represented as small synthetic/local fixtures in the source snapshot.
- Any claim that a proxy adapter result is an official leaderboard score.

## Layout

```text
catalog/
  benchmark-proxy-adapters.json
  live-interaction-tasks.json
  source-files.json
  task-index.json
  task-families.md
schemas/
  node-task.schema.json
scripts/
  build-catalog.mjs
  validate-catalog.mjs
upstream/noderoom/
  convex/
  examples/
  proofloop/
  noderl/
  src/
  scripts/
  tests/
  docs/
```

## Runnability Note

This repository preserves the benchmark/task corpus and the source support those files reference. Live production tasks still require an actual NodeRoom deployment, provider credentials, and any upstream benchmark datasets or official scorers that are intentionally not vendored here.

## Refresh The Catalog

```bash
npm run build:catalog
npm run validate
```

## Task Philosophy

NodeTasks follows the same split as NodeRoom ProofLoop:

- Certification loop: locked product UI path, immutable verifier expectations, proof receipt.
- Exploration loop: new scenarios, task proposals, adversarial cases, and adapter research.

A task should be scored from deterministic UI/proof artifacts, not chat transcripts or screenshots alone.

## Safety

The Proximitty and underwriting fixtures are synthetic evaluation data. They must not be used for real financial, legal, lending, insurance, or investment decisions.
