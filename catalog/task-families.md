# NodeTasks Catalog

Generated: 2026-07-09T01:35:42.882Z

## Summary

- Searchable tasks: 9140
- Curated live interaction tasks: 43
- Extracted tasks: 9097
- Benchmark proxy adapters: 4
- External local proxy tasks: 3
- Saved views: 8
- Task bundles: 8
- Source files: 1236

## Domains

| Domain | Tasks |
| --- | ---: |
| Spreadsheet & Office Automation | 6434 |
| Banking & Finance | 760 |
| Audit, Risk & Compliance | 139 |
| Agent Runtime & NodeAgent | 585 |
| Collaboration & Room UX | 1222 |

## Difficulty Tiers

| Difficulty | Tasks |
| --- | ---: |
| intro | 1986 |
| intermediate | 272 |
| advanced | 6498 |
| expert | 384 |

## Cost Tiers

| Cost | Tasks |
| --- | ---: |
| external-variable | 1468 |
| free-static | 2115 |
| local-runtime | 141 |
| provider-low | 1354 |
| provider-medium | 4062 |

## Task Kinds

| Kind | Tasks |
| --- | ---: |
| benchmark-adapter | 4 |
| benchmark-family | 11 |
| benchmark-target | 1354 |
| browser-test-case | 168 |
| curated-live | 43 |
| local-proxy-task | 3 |
| model-attempt | 5416 |
| qa-feature | 26 |
| rubric | 8 |
| scenario | 8 |
| source-reference | 1236 |
| suite | 1 |
| unit-test-case | 862 |

## Task Families

| Family | Tasks |
| --- | ---: |
| accounting | 17 |
| accounting-live-proofloop | 20 |
| accounting-suite | 19 |
| audit-export | 1 |
| bankertoolbench | 58 |
| bankertoolbench-full-100 | 500 |
| benchmark-adapter | 21 |
| benchmark-gate | 3 |
| benchmark-proxy | 3 |
| benchmark-proxy-live | 4 |
| chat | 54 |
| command-palette | 1 |
| common | 2 |
| dataset | 8 |
| doc | 206 |
| doctrine | 1 |
| e2e | 193 |
| external_adapter | 3 |
| finauditing | 1 |
| finauditing-prod-proxy-task | 5 |
| finch | 1 |
| finch-prod-proxy-task | 5 |
| graph | 12 |
| graph-nodeagent | 3 |
| internal | 1 |
| live-browser-proof.spec.ts | 1 |
| multi-user | 1 |
| nodeagent | 36 |
| noderl | 54 |
| noderoom-multi-user | 1 |
| noderoom-multi-user-conflict | 30 |
| notebook | 47 |
| notion | 18 |
| notion-live-proofloop | 20 |
| notion-suite | 17 |
| official_public | 3 |
| official_subset | 1 |
| other | 624 |
| product_suite | 3 |
| proofloop-accounting | 4 |
| proofloop-notion | 4 |
| proofloop-suite | 3 |
| proposal-review | 1 |
| proximitty | 1 |
| proximitty-underwriting-pr0 | 20 |
| public-chat | 2 |
| qa-production-matrix | 26 |
| room-home | 1 |
| rubric | 6 |
| rubrics | 6 |
| scenario | 5 |
| scenarios | 4 |
| script | 89 |
| spreadsheet | 55 |
| spreadsheetbench-v1-full-912 | 4560 |
| spreadsheetbench-v2-full-321 | 1605 |
| streamlit-nodegraph | 2 |
| suites | 1 |
| test | 136 |
| trace | 12 |
| trace-surface | 1 |
| unit | 560 |
| upload | 2 |
| voice | 30 |
| workstreambench | 1 |
| workstreambench-prod-proxy-task | 5 |

## Saved Views

| View | Persona | Tasks | Sort | Query |
| --- | --- | ---: | --- | --- |
| first-hour | New contributor | 2256 | difficulty | nodeagent graph source test intro |
| cheap-spreadsheetbench-models | Model evaluator | 4952 | cost | spreadsheetbench model-attempt |
| browser-proof-surfaces | Product QA | 211 | difficulty | browser chat trace graph notebook upload room |
| finance-evidence-work | Finance analyst | 632 | domain | finance spreadsheet accounting bankertoolbench evidence xbrl |
| proofloop-governance-gates | Benchmark maintainer | 0 | difficulty | proofloop benchmark official scorer verifier gate doctrine |
| nodeagent-runtime-spine | Agent engineer | 457 | difficulty | nodeagent frame trace runtime model tool receipt |
| collaboration-interiors | Product QA | 151 | difficulty | graph chat notebook trace multi-user command-palette upload |
| official-score-boundaries | Benchmark maintainer | 6821 | difficulty-desc | official score claim scorer verifier proxy product path |

## Shareable Task Bundles

| Bundle | Persona | Tasks | Estimated steps | Max difficulty score |
| --- | --- | ---: | ---: | ---: |
| first-hour | New contributor | 60 | 60 | 7 |
| cheap-spreadsheetbench-models | Model evaluator | 60 | 540 | 59 |
| browser-proof-surfaces | Product QA | 60 | 240 | 28 |
| finance-evidence-work | Finance analyst | 60 | 61 | 12 |
| proofloop-governance-gates | Benchmark maintainer | 0 | 0 | 0 |
| nodeagent-runtime-spine | Agent engineer | 60 | 60 | 7 |
| collaboration-interiors | Product QA | 60 | 60 | 11 |
| official-score-boundaries | Benchmark maintainer | 60 | 546 | 77 |

## Provenance

| Verifier type | Tasks |
| --- | ---: |
| model-proxy-receipt | 5416 |
| browser-proof | 1608 |
| source-reference | 1236 |
| deterministic-test | 738 |
| verifier-receipt | 63 |
| rubric-scenario | 61 |
| catalog-derived | 12 |
| proxy-adapter-contract | 6 |

| Score status | Tasks |
| --- | ---: |
| official-boundary-blocked | 6770 |
| no-official-score-claim | 2370 |

## Benchmark Proxy Adapters

| Adapter | Source | Scoring | Live command |
| --- | --- | --- | --- |
| bankertoolbench | BankerToolBench | hybrid | npm run proofloop -- run bankertoolbench --prod --user-emulation strict --cockpit |
| finauditing | FinAuditing | hybrid | npm run benchmark:proofloop:external-adapter-live-room -- --id finauditing --prod --user-emulation strict --cockpit |
| finch | Finch / FinWorkBench | hybrid | npm run benchmark:proofloop:external-adapter-live-room -- --id finch --prod --user-emulation strict --cockpit |
| workstreambench | WorkstreamBench | hybrid | npm run benchmark:proofloop:external-adapter-live-room -- --id workstreambench --prod --user-emulation strict --cockpit |

## External Local Proxy Tasks

| Adapter | Task | Title | Official score claim |
| --- | --- | --- | --- |
| finch | finch-local-financial-evidence-qa | Financial evidence QA through NodeRoom story workflow | false |
| finauditing | finauditing-local-risk-and-misstatement-review | Audit-style evidence review through NodeRoom story workflow | false |
| workstreambench | workstreambench-local-spreadsheet-workstream | Spreadsheet workstream execution through NodeRoom story workflow | false |

## Example Curated Live Tasks

- `noderoom.graph.nodeagent.review-gaps.v1`: Ask NodeAgent to find review blockers from the entity graph.
- `noderoom.graph.nodeagent.evidence.v1`: Ask NodeAgent for source-backed evidence around a selected graph node.
- `noderoom.graph.people-clusters.v1`: Trace person-to-company relationships and connected project or achievement clusters.
- `streamlit.nodegraph.chat.evidence.v1`: Use the Streamlit quick prompt to ask NodeAgent for evidence.
- `streamlit.nodegraph.chat.typed-at-mention.v1`: Type an @nodeagent chat prompt in Streamlit and receive a second turn.
- `noderoom.chat.public-nodeagent.company-research.v1`: Ask public NodeAgent to research a company row from chat.
- `noderoom.chat.public-nodeagent.runway-gaps.v1`: Ask public NodeAgent to identify runway or evidence gaps.
- `noderoom.trace.open-filter-group.v1`: Open trace, filter by event kind, and group runs.
- `noderoom.proposals.accept-reject.v1`: Review pending agent proposals without direct mutation bypass.
- `noderoom.sheet.edit-evidence-export.v1`: Edit a spreadsheet cell, inspect evidence, and export XLSX.
- `noderoom.sheet.generic-company-research.v1`: Drive the generic company research grid through pending/enriched statuses.
- `noderoom.notebook.agent-outline.v1`: Ask NodeAgent to create or update a notebook outline.

## Search Surfaces

- `catalog/all-tasks.json`: normalized task objects with rank, curation, and provenance metadata.
- `catalog/ranked-tasks.json`: same task set sorted by domain, difficulty, cost, and steps.
- `catalog/hierarchy.json`: domain > difficulty > cost hierarchy.
- `catalog/tag-index.json`: ranked tags with domain, kind, difficulty, and cost counts.
- `catalog/saved-views.json`: reusable search views for common personas.
- `catalog/task-bundles.json`: shareable ranked bundles from the saved views.
- `catalog/provenance-index.json`: verifier type, source kind, suite lineage, and score-boundary rollups.
- `catalog/search-index.jsonl`: one searchable JSON record per task.
- `catalog/task-browser.html`: local browser search UI.
- `npm run search -- <query>`: CLI search.
- `npm run streamlit`: interactive Streamlit explorer and NodeAgent catalog chat.

## Contract

Every task should preserve product-path proof separately from official benchmark scoring. A proxy task can pass its product UI proof while still recording `officialScoreClaim: false` until an upstream verifier accepts the artifacts.
