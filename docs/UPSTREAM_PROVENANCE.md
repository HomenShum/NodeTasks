# Vendored NodeRoom provenance boundary

`upstream/noderoom/` is a read-only migration source for the NodeTasks corpus. It preserves the source files referenced by task, adapter, rubric, and proof metadata. It is not a NodeTasks product runtime, package boundary, or claim that NodeTasks owns NodeRoom or NodeAgent contracts.

The exact upstream NodeRoom commit was not recorded when the snapshot was created. This repository does not invent that missing revision. `catalog/source-files.json` preserves the historical per-file metadata. `npm run proof` independently hashes the current vendored files into a deterministic aggregate and records how many historical metadata entries differ, so existing drift remains visible without silently rebuilding the generated catalog.

The current receipt reports `catalog-valid-with-known-source-index-drift`, `passed: false`, and `releaseReady: false` because 16 historical source-index entries differ from the vendored files. `npm run proof` and `npm run check` intentionally exit nonzero until a dedicated resnapshot rebuilds and reviews the catalog.

## Ownership rules

- `canonicalFor` must remain empty in `nodekit.yaml` unless NodeTasks later introduces a genuinely independent, reviewed contract outside the vendored snapshot.
- Contract signatures found below `upstream/noderoom/` must be classified as `migration-source`, with their existing Node Platform owner named as the origin.
- Do not add `nodeagent.yaml`: NodeTasks is a deterministic evaluation corpus, not a product-agent application.
- Do not add new runtime implementations, provider adapters, or shared-contract ownership claims under `upstream/noderoom/`.
- A future resnapshot must be a dedicated migration that records the upstream revision, rebuilds the catalog, regenerates the corpus receipt, and reviews the resulting provenance delta.

This registration intentionally does not delete or move the vendored tree. Replacing it with content-addressed external provenance is separate migration work and must preserve every task source reference before removal.
