import assert from "node:assert/strict";
import { existsSync, realpathSync } from "node:fs";
import fs from "node:fs/promises";
import { cp, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
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
  assert.equal(receipt.status, "valid");
  assert.equal(receipt.catalogValid, true);
  assert.equal(receipt.sourceIndexValid, true);
  assert.equal(receipt.passed, true);
  assert.equal(receipt.releaseReady, true);
  assert.equal(receipt.officialScoreBoundary.officialScoreClaim, false);
  assert.equal(receipt.officialScoreBoundary.tasksClaimingOfficialScore, 0);
  assert.equal(receipt.officialScoreBoundary.adaptersClaimingOfficialScore, 0);
  assert.equal(receipt.officialScoreBoundary.localProxyTasksClaimingOfficialScore, 0);
  assert.equal(receipt.officialScoreBoundary.productPathCompletionIsOfficialScore, false);
  assert.equal(
    receipt.semanticBoundary.sha256,
    "c6f046baeb7cd5fa6bac7ea0695922696e23e66aaa7c52a3ccc03daf4f3a35b3",
    "task IDs/order, official-score flags, and provenance must remain unchanged",
  );
  assert.match(receipt.vendoredSource.sha256, /^[a-f0-9]{64}$/);
  assert.equal(receipt.counts.sourceIndexContentMismatches, 0);
  assert.equal(
    receipt.sourceIndexDrift.mismatchCount,
    receipt.counts.sourceIndexContentMismatches,
  );
  assert.equal(receipt.sourceIndexDrift.sampleLimit, 10);
  assert.equal(receipt.sourceIndexDrift.samples.length, 0);
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
  assert.match(
    manifest,
    /^canonicalFor:\s*\r?\n\s+-\s+nodetasks\.corpus-receipt\s*\r?\n\s*\r?\nconsumes:/m,
  );
  assert.equal(existsSync(resolve(root, "nodeagent.yaml")), false);

  const declarationModes = [...manifest.matchAll(/^\s+mode:\s*(\S+)\s*$/gm)]
    .map((match) => match[1]);
  assert.ok(declarationModes.length > 0);
  assert.equal(declarationModes.length, 4);
  assert.ok(declarationModes.every((mode) => mode === "migration-copy"));
  const consumes = manifest.split("consumes:\n")[1].split("\n\n")[0];
  assert.deepEqual(consumes.trim().split("\n").map((line) => line.trim()), [
    "- nodeplatform.repo-contract", "- nodeagent.agent-run",
    "- nodeagent.provider-pi", "- nodeagent.trace-workpaper",
  ]);
});

async function corpusFixture(t) {
  const parent = await fs.realpath(tmpdir());
  const fixture = await mkdtemp(join(parent, "nodetasks-corpus-review-"));
  for (const name of ["catalog", "schemas", "proof", "upstream"]) {
    await cp(join(root, name), join(fixture, name), { recursive: true });
  }
  t.after(async () => {
    // Remove only this newly created fixture, with a verified physical parent.
    assert.equal(dirname(await fs.realpath(fixture)), parent);
    assert.ok(fixture.startsWith(join(parent, "nodetasks-corpus-review-")));
    await rm(fixture, { recursive: true });
  });
  return fixture;
}

test("a maintainer rejects unsafe source entries before reading any owned sentinel", async (t) => {
  const fixture = await corpusFixture(t);
  const indexPath = join(fixture, "catalog/source-files.json");
  const originalIndex = await readFile(indexPath);
  const sentinel = Buffer.from("Harmless maintainer boundary fixture.\n");
  const owned = [join(fixture, "fixture-sentinel.txt"), join(fixture, "upstream/noderoom/secret-fixture.txt"), join(fixture, "owned-probe/regular.txt")];
  for (const file of owned) {
    assert.ok(resolve(file).startsWith(fixture + sep));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, sentinel, { flag: "wx" });
  }
  const unsafe = [
    "upstream/noderoom/../../fixture-sentinel.txt",
    "upstream/noderoom/secret-fixture.txt",
    "upstream/noderoom/SECRET-fixture.txt",
    "upstream/noderoom/./fixture.txt",
    "upstream/noderoom//fixture.txt",
    "upstream/noderoom/..\\..\\fixture-sentinel.txt",
    "C:/fixture-sentinel.txt", "//localhost/fixture-sentinel.txt",
    "upstream/noderoom/file.txt:stream", "upstream/noderoom/file.txt.",
    "upstream/noderoom/file.txt ", "upstream/noderoom/NUL.txt",
    "upstream/noderoom/COM¹", "upstream/noderoom/src",
    "upstream/noderoom/missing-file.txt", null,
  ];
  const link = join(fixture, "upstream/noderoom/linked-parent");
  try {
    await symlink(join(fixture, "owned-probe"), link, process.platform === "win32" ? "junction" : "dir");
    unsafe.push("upstream/noderoom/linked-parent/regular.txt");
    t.diagnostic("Parent link/junction created and tested");
  } catch (error) {
    if (!["EPERM", "EACCES", "ENOSYS"].includes(error.code)) throw error;
    t.diagnostic(`Parent link creation unavailable: ${error.code}; this case is untested`);
  }
  const index = JSON.parse(originalIndex);
  for (const [i, path] of unsafe.entries()) {
    index.files[i] = { ...index.files[i], path, bytes: sentinel.length, sha256: createHash("sha256").update(sentinel).digest("hex") };
  }
  await writeFile(indexPath, JSON.stringify(index));
  const originalRead = fs.readFile;
  const reads = [];
  fs.readFile = async (file, ...args) => {
    const requested = file instanceof URL ? fileURLToPath(file) : String(file);
    const actual = existsSync(requested) ? realpathSync(requested) : resolve(requested);
    if (owned.some((name) => name.toLowerCase() === actual.toLowerCase())) reads.push(actual);
    return originalRead(file, ...args);
  };
  syncBuiltinESMExports();
  try {
    const { problems, receipt } = await validateCatalog(fixture);
    assert.deepEqual(reads, [], "failed status alone cannot certify no forbidden read");
    assert.ok(problems.length >= unsafe.length);
    assert.equal(receipt.passed, false);
    assert.equal(receipt.sourceIndexValid, false);
    assert.equal(receipt.status, "catalog-invalid");
  } finally {
    fs.readFile = originalRead;
    syncBuiltinESMExports();
    await writeFile(indexPath, originalIndex);
  }
  assert.equal((await validateCatalog(fixture)).receipt.passed, true, "restored public index recovers without changing the receipt");
});

test("a new developer's actual doctor accepts registered consumers but rejects added or replaced NodeAgent ownership", async (t) => {
  const fixture = await corpusFixture(t);
  await mkdir(join(fixture, "scripts"));
  await mkdir(join(fixture, "docs"));
  for (const name of ["scripts/doctor.mjs", "scripts/validate-catalog.mjs", "docs/UPSTREAM_PROVENANCE.md", "nodekit.yaml"]) {
    await cp(join(root, name), join(fixture, name));
  }
  const manifestPath = join(fixture, "nodekit.yaml");
  const original = await readFile(manifestPath, "utf8");
  const run = promisify(execFile);
  const doctor = () => run(process.execPath, [join(fixture, "scripts/doctor.mjs")], { cwd: fixture, timeout: 10_000, windowsHide: true });
  assert.equal(JSON.parse((await doctor()).stdout).passed, true);
  for (const value of [
    original.replace("  - nodetasks.corpus-receipt", "  - nodetasks.corpus-receipt\n  - nodeagent.agent-run"),
    original.replace("  - nodetasks.corpus-receipt", "  - nodeagent.agent-run"),
  ]) {
    await writeFile(manifestPath, value);
    await assert.rejects(doctor, (error) => {
      const result = JSON.parse(error.stdout);
      return error.code === 1 && !result.passed
        && result.checks.find((check) => check.id === "corpus-receipt-only-ownership").passed === false;
    });
  }
  await writeFile(manifestPath, original);
  assert.equal(JSON.parse((await doctor()).stdout).passed, true);
});

test("a reviewer preserves the good receipt through stale, malformed and drifting inputs, then concurrent and sustained reads", async (t) => {
  const fixture = await corpusFixture(t);
  const receiptPath = join(fixture, RECEIPT_PATH);
  const goodReceipt = await readFile(receiptPath);
  const run = promisify(execFile);
  const proof = () => run(process.execPath, [join(root, "scripts/validate-catalog.mjs"), "--check-receipt"], { cwd: fixture, timeout: 30_000, maxBuffer: 2_000_000, windowsHide: true });
  await rename(receiptPath, receiptPath + ".held");
  await assert.rejects(proof, (error) => error.code === 1 && /is missing/.test(error.stderr));
  await rename(receiptPath + ".held", receiptPath);
  await writeFile(receiptPath, Buffer.concat([goodReceipt, Buffer.from(" ")]));
  await assert.rejects(proof, (error) => error.code === 1 && /is stale/.test(error.stderr));
  await writeFile(receiptPath, goodReceipt);

  const catalogPath = join(fixture, "catalog/all-tasks.json");
  const catalog = await readFile(catalogPath);
  try {
    await writeFile(catalogPath, "{ malformed");
    await assert.rejects(proof, (error) => error.code === 1 && /SyntaxError/.test(error.stderr));
    const duplicate = JSON.parse(catalog);
    duplicate.tasks[1].id = duplicate.tasks[0].id;
    await writeFile(catalogPath, JSON.stringify(duplicate));
    await assert.rejects(proof, (error) => error.code === 1 && /task id unique/.test(error.stderr));
  } finally { await writeFile(catalogPath, catalog); }

  const sources = JSON.parse(await readFile(join(fixture, "catalog/source-files.json"), "utf8"));
  const sourcePath = join(fixture, sources.files[0].path);
  const source = await readFile(sourcePath);
  const originalRead = fs.readFile;
  let changedAtRead = false;
  fs.readFile = async (file, ...args) => {
    if (resolve(String(file)) === sourcePath && !changedAtRead) {
      changedAtRead = true;
      await writeFile(sourcePath, Buffer.concat([source, Buffer.from("\ncontrolled review drift\n")]));
    }
    return originalRead(file, ...args);
  };
  syncBuiltinESMExports();
  try {
    const { receipt } = await validateCatalog(fixture);
    assert.equal(changedAtRead, true);
    assert.equal(receipt.sourceIndexValid, false);
    assert.equal(receipt.passed, false);
    assert.equal(receipt.sourceIndexDrift.mismatchCount, 1);
  } finally { fs.readFile = originalRead; syncBuiltinESMExports(); }
  await assert.rejects(proof, (error) => error.code === 1);
  await writeFile(sourcePath, source);

  const concurrent = await Promise.all(Array.from({ length: 4 }, () => validateCatalog(fixture)));
  for (const result of concurrent) assert.equal(serializeReceipt(result.receipt), goodReceipt.toString("utf8"));
  for (let later = 0; later < 3; later += 1) {
    assert.equal(serializeReceipt((await validateCatalog(fixture)).receipt), goodReceipt.toString("utf8"));
  }
  await proof();
  assert.deepEqual(await readFile(receiptPath), goodReceipt);
  assert.deepEqual(await readFile(catalogPath), catalog);
  assert.deepEqual(await readFile(sourcePath), source);
  t.diagnostic("4 concurrent +3 later frozen reads; controlled pre-read drift rejected. No hostile filesystem-swap guarantee.");
});
