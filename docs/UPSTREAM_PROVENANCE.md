# Vendored NodeRoom provenance boundary

`upstream/noderoom/` is a read-only migration source for the NodeTasks corpus. It preserves the source files referenced by task, adapter, rubric, and proof metadata. It is not a NodeTasks product runtime, package boundary, or claim that NodeTasks owns NodeRoom or NodeAgent contracts.

The exact upstream NodeRoom commit was not recorded when the snapshot was created. This repository does not invent that missing revision. `catalog/source-files.json` preserves the historical per-file metadata. `npm run proof` independently hashes the current vendored files into a deterministic aggregate and records how many historical metadata entries differ, so existing drift remains visible without silently rebuilding the generated catalog.

The NodeKit registration found 16 historical metadata entries produced from pre-commit CRLF or mixed-line-ending worktree bytes. The committed vendored blobs had already been normalized to LF and had never changed after the initial corpus commit. The derived index was regenerated with the prior `generatedAt` preserved; only source byte/hash projections changed. No vendored content, task identity/order, score claim, or provenance field changed, and the current receipt is a clean pass.

## Ownership rules

- `canonicalFor` must remain empty in `nodekit.yaml` unless NodeTasks later introduces a genuinely independent, reviewed contract outside the vendored snapshot.
- Contract signatures found below `upstream/noderoom/` must be classified as `migration-source`, with their existing Node Platform owner named as the origin.
- Do not add `nodeagent.yaml`: NodeTasks is a deterministic evaluation corpus, not a product-agent application.
- Do not add new runtime implementations, provider adapters, or shared-contract ownership claims under `upstream/noderoom/`.
- A future resnapshot must be a dedicated migration that records the upstream revision, rebuilds the catalog, regenerates the corpus receipt, and reviews the resulting provenance delta.

This registration intentionally does not delete or move the vendored tree. Replacing it with content-addressed external provenance is separate migration work and must preserve every task source reference before removal.
