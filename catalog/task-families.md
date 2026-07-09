# NodeTasks Catalog

Generated: 2026-07-09T00:34:02.616Z

## Summary

- Live interaction tasks: 43
- Benchmark proxy adapters: 4
- External local proxy tasks: 3
- Source files: 1236

## Task Families

| Family | Tasks |
| --- | ---: |
| audit-export | 1 |
| benchmark-gate | 3 |
| benchmark-proxy | 3 |
| benchmark-proxy-live | 4 |
| command-palette | 1 |
| dataset | 1 |
| doctrine | 1 |
| graph-nodeagent | 3 |
| multi-user | 1 |
| notebook | 2 |
| proofloop-accounting | 4 |
| proofloop-notion | 4 |
| proofloop-suite | 3 |
| proposal-review | 1 |
| public-chat | 2 |
| room-home | 1 |
| spreadsheet | 2 |
| streamlit-nodegraph | 2 |
| trace-surface | 1 |
| upload | 2 |
| voice | 1 |

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

## Example Live Tasks

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

## Contract

Every task should preserve product-path proof separately from official benchmark scoring. A proxy task can pass its product UI proof while still recording `officialScoreClaim: false` until an upstream verifier accepts the artifacts.
