import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  RECEIPT_PATH,
  RECEIPT_SCHEMA_VERSION,
  serializeReceipt,
  validateCatalog,
} from "../scripts/validate-catalog.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("catalog validation reproduces the committed corpus receipt", async () => {
  const { problems, receipt } = await validateCatalog(root);
  assert.deepEqual(problems, []);
  assert.equal(receipt.schemaVersion, RECEIPT_SCHEMA_VERSION);
  assert.equal(receipt.status, "catalog-valid-with-known-source-index-drift");
  assert.equal(receipt.catalogValid, true);
  assert.equal(receipt.sourceIndexValid, false);
  assert.equal(receipt.passed, false);
  assert.equal(receipt.releaseReady, false);
  assert.equal(receipt.officialScoreBoundary.officialScoreClaim, false);
  assert.equal(receipt.officialScoreBoundary.tasksClaimingOfficialScore, 0);
  assert.equal(receipt.officialScoreBoundary.adaptersClaimingOfficialScore, 0);
  assert.equal(receipt.officialScoreBoundary.localProxyTasksClaimingOfficialScore, 0);
  assert.equal(receipt.officialScoreBoundary.productPathCompletionIsOfficialScore, false);
  assert.match(receipt.vendoredSource.sha256, /^[a-f0-9]{64}$/);
  assert.ok(receipt.counts.sourceIndexContentMismatches > 0);
  assert.equal(
    receipt.sourceIndexDrift.mismatchCount,
    receipt.counts.sourceIndexContentMismatches,
  );
  assert.equal(receipt.sourceIndexDrift.sampleLimit, 10);
  assert.equal(receipt.sourceIndexDrift.samples.length, 10);
  assert.deepEqual(
    receipt.sourceIndexDrift.samples.map((sample) => sample.path),
    [...receipt.sourceIndexDrift.samples.map((sample) => sample.path)].sort(),
  );
  assert.match(receipt.corpusHash, /^[a-f0-9]{64}$/);

  const paths = receipt.contentHashes.map((entry) => entry.path);
  assert.deepEqual(paths, [...paths].sort());
  assert.equal(new Set(paths).size, paths.length);
  for (const entry of receipt.contentHashes) {
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isInteger(entry.bytes));
  }

  assert.equal(
    await readFile(resolve(root, RECEIPT_PATH), "utf8"),
    serializeReceipt(receipt),
  );
});

test("NodeKit registration stays corpus-only", async () => {
  const manifest = await readFile(resolve(root, "nodekit.yaml"), "utf8");
  assert.match(manifest, /^schemaVersion:\s*nodekit\.repo\/v1\s*$/m);
  assert.match(manifest, /^commandProfile:\s*protocol\s*$/m);
  assert.match(manifest, /^canonicalFor:\s*\[\]\s*$/m);
  assert.equal(existsSync(resolve(root, "nodeagent.yaml")), false);

  const declarationModes = [...manifest.matchAll(/^\s+mode:\s*(\S+)\s*$/gm)]
    .map((match) => match[1]);
  assert.ok(declarationModes.length > 0);
  assert.ok(declarationModes.every((mode) => mode === "migration-source"));
});
