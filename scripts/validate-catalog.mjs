import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RECEIPT_PATH = "proof/corpus-receipt.json";
export const RECEIPT_SCHEMA_VERSION = "nodetasks.corpus-receipt/v1";

const OFFICIAL_SCORE_STATUSES = new Set([
  "no-official-score-claim",
  "official-boundary-blocked",
]);

const CONTENT_PATHS = [
  "catalog/all-tasks.json",
  "catalog/benchmark-proxy-adapters.json",
  "catalog/extracted-tasks.json",
  "catalog/hierarchy.json",
  "catalog/live-interaction-tasks.json",
  "catalog/provenance-index.json",
  "catalog/ranked-tasks.json",
  "catalog/saved-views.json",
  "catalog/search-index.js",
  "catalog/search-index.jsonl",
  "catalog/source-files.json",
  "catalog/tag-index.json",
  "catalog/task-browser.html",
  "catalog/task-bundles.json",
  "catalog/task-families.md",
  "catalog/task-index.json",
  "schemas/corpus-receipt.schema.json",
  "schemas/node-task.schema.json",
].sort();

export async function validateCatalog(root = process.cwd()) {
  const problems = [];
  const contentHashes = new Map();
  const assert = (condition, message) => {
    if (!condition) problems.push(message);
  };

  const readTracked = async (path) => {
    const bytes = await readFile(join(root, path));
    contentHashes.set(path, hashRecord(path, bytes));
    return bytes.toString("utf8");
  };
  const readJson = async (path) => JSON.parse(await readTracked(path));
  const readJsonl = async (path) => (await readTracked(path))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const live = await readJson("catalog/live-interaction-tasks.json");
  const allTasks = await readJson("catalog/all-tasks.json");
  const extracted = await readJson("catalog/extracted-tasks.json");
  const ranked = await readJson("catalog/ranked-tasks.json");
  const hierarchy = await readJson("catalog/hierarchy.json");
  const tagIndex = await readJson("catalog/tag-index.json");
  const savedViews = await readJson("catalog/saved-views.json");
  const taskBundles = await readJson("catalog/task-bundles.json");
  const provenanceIndex = await readJson("catalog/provenance-index.json");
  const adapters = await readJson("catalog/benchmark-proxy-adapters.json");
  const sources = await readJson("catalog/source-files.json");
  const index = await readJson("catalog/task-index.json");
  const searchRecords = await readJsonl("catalog/search-index.jsonl");

  assert(Array.isArray(live.tasks), "live tasks array exists");
  assert(Array.isArray(allTasks.tasks), "all tasks array exists");
  assert(Array.isArray(extracted.tasks), "extracted tasks array exists");
  assert(Array.isArray(ranked.tasks), "ranked tasks array exists");
  assert(Array.isArray(tagIndex.tags), "tag index array exists");
  assert(Array.isArray(savedViews.views), "saved views array exists");
  assert(Array.isArray(taskBundles.bundles), "task bundles array exists");
  assert(provenanceIndex.counts?.tasks === allTasks.tasks.length, "provenance index task count matches");
  assert(Array.isArray(adapters.adapters), "adapters array exists");
  assert(Array.isArray(adapters.externalLocalTasks), "external local tasks array exists");
  assert(Array.isArray(sources.files), "source files array exists");
  assert(index.summary.liveInteractionTasks === live.tasks.length, "task index live count matches");
  assert(index.summary.extractedTasks === extracted.tasks.length, "task index extracted count matches");
  assert(index.summary.searchableTasks === allTasks.tasks.length, "task index searchable count matches");
  assert(ranked.tasks.length === allTasks.tasks.length, "ranked tasks count matches all tasks");
  assert(hierarchy.hierarchy?.counts?.tasks === allTasks.tasks.length, "hierarchy task count matches");
  assert(tagIndex.tags.length > 0, "tag index is populated");
  assert(savedViews.views.length > 0, "saved views are populated");
  assert(taskBundles.bundles.length > 0, "task bundles are populated");
  assert(index.summary.benchmarkProxyAdapters === adapters.adapters.length, "task index adapter count matches");
  assert(index.summary.externalLocalProxyTasks === adapters.externalLocalTasks.length, "task index local proxy count matches");
  assert(index.summary.savedViews === savedViews.views.length, "task index saved view count matches");
  assert(index.summary.taskBundles === taskBundles.bundles.length, "task index bundle count matches");
  assert(index.summary.sourceFiles === sources.files.length, "task index source file count matches");
  assert(searchRecords.length === allTasks.tasks.length, "search index count matches all tasks");

  const taskIds = new Set();
  let tasksClaimingOfficialScore = 0;
  for (const task of allTasks.tasks) {
    assert(typeof task.id === "string" && task.id.length > 3, `task id valid: ${task.id}`);
    assert(!taskIds.has(task.id), `task id unique: ${task.id}`);
    taskIds.add(task.id);
    if (task.officialScoreClaim !== false) tasksClaimingOfficialScore += 1;
    assert(task.officialScoreClaim === false, `task does not claim official score: ${task.id}`);
    assert(typeof task.kind === "string" && task.kind.length > 1, `task has kind: ${task.id}`);
    assert(typeof task.title === "string" && task.title.length > 1, `task has title: ${task.id}`);
    assert(typeof task.goal === "string" && task.goal.length > 1, `task has goal: ${task.id}`);
    assert(task.rank && typeof task.rank === "object", `task has rank: ${task.id}`);
    assert(typeof task.rank.domain === "string" && task.rank.domain.length > 1, `task has rank domain: ${task.id}`);
    assert(Number.isFinite(task.rank.estimatedSteps), `task has estimated steps: ${task.id}`);
    assert(Number.isFinite(task.rank.difficultyScore), `task has difficulty score: ${task.id}`);
    assert(typeof task.rank.difficultyTier === "string", `task has difficulty tier: ${task.id}`);
    assert(typeof task.rank.costTier === "string", `task has cost tier: ${task.id}`);
    assert(Array.isArray(task.rank.topTags), `task has ranked tags: ${task.id}`);
    assert(task.curation && typeof task.curation.summary === "string", `task has curation summary: ${task.id}`);
    assert(Array.isArray(task.curation.recommendedFor), `task has curation audiences: ${task.id}`);
    assert(task.provenance && typeof task.provenance.verifierType === "string", `task has provenance verifier: ${task.id}`);
    assert(OFFICIAL_SCORE_STATUSES.has(task.provenance.scoreStatus), `task has explicit score boundary: ${task.id}`);
    assert(task.provenance.officialSemanticScore === "not-claimed", `task official semantic score is not claimed: ${task.id}`);
    assert(Array.isArray(task.provenance.suiteLineage), `task has suite lineage: ${task.id}`);
    for (const sourceRef of task.sourceRefs ?? []) {
      assert(isExternalRef(sourceRef) || existsSync(join(root, sourceRef)), `sourceRef exists for ${task.id}: ${sourceRef}`);
    }
  }

  for (const view of savedViews.views) {
    assert(typeof view.id === "string" && view.id.length > 1, `saved view id valid: ${view.id}`);
    assert(typeof view.title === "string" && view.title.length > 1, `saved view title valid: ${view.id}`);
    assert(Number.isFinite(view.count), `saved view count valid: ${view.id}`);
    assert(Array.isArray(view.sampleTaskIds), `saved view sample ids valid: ${view.id}`);
    for (const id of view.sampleTaskIds) assert(taskIds.has(id), `saved view task exists: ${view.id}/${id}`);
  }

  for (const bundle of taskBundles.bundles) {
    assert(typeof bundle.id === "string" && bundle.id.length > 1, `bundle id valid: ${bundle.id}`);
    assert(Array.isArray(bundle.taskIds), `bundle task ids valid: ${bundle.id}`);
    assert(bundle.taskIds.length === bundle.taskCount, `bundle task count matches: ${bundle.id}`);
    for (const id of bundle.taskIds) assert(taskIds.has(id), `bundle task exists: ${bundle.id}/${id}`);
  }

  const adapterIds = new Set();
  let adaptersClaimingOfficialScore = 0;
  for (const adapter of adapters.adapters) {
    assert(!adapterIds.has(adapter.id), `adapter id unique: ${adapter.id}`);
    adapterIds.add(adapter.id);
    if (adapter.officialScoreClaim !== false) adaptersClaimingOfficialScore += 1;
    assert(adapter.officialScoreClaim === false, `adapter does not claim official score: ${adapter.id}`);
    assert(existsSync(join(root, adapter.sourcePath)), `adapter source path exists: ${adapter.id}`);
  }

  let localProxyTasksClaimingOfficialScore = 0;
  for (const task of adapters.externalLocalTasks) {
    if (task.officialScoreClaim !== false) localProxyTasksClaimingOfficialScore += 1;
    assert(task.officialScoreClaim === false, `local proxy task does not claim official score: ${task.taskId}`);
    assert(existsSync(join(root, task.sourcePath)), `local proxy source path exists: ${task.taskId}`);
  }

  const blockedPatterns = [
    /\.env(?!\.example$)/,
    /node_modules\//,
    /\.proofloop\//,
    /test-results\//,
    /\.log$/,
    /secret/i,
  ];
  const sourcePaths = new Set();
  const sourceIndexDrift = [];
  const vendoredSourceRecords = [];
  let verifiedSourceBytes = 0;
  let sourceIndexContentMismatches = 0;
  for (const file of sources.files) {
    assert(typeof file.path === "string" && file.path.startsWith("upstream/noderoom/"), `source is vendored NodeRoom provenance: ${file.path}`);
    assert(!sourcePaths.has(file.path), `source path unique: ${file.path}`);
    sourcePaths.add(file.path);
    for (const pattern of blockedPatterns) {
      assert(!pattern.test(file.path), `source path is public-safe: ${file.path}`);
    }
    if (!existsSync(join(root, file.path))) {
      assert(false, `source file exists: ${file.path}`);
      continue;
    }
    const bytes = await readFile(join(root, file.path));
    verifiedSourceBytes += bytes.byteLength;
    const actualHash = sha256(bytes);
    vendoredSourceRecords.push({ path: file.path, bytes: bytes.byteLength, sha256: actualHash });
    if (file.bytes !== bytes.byteLength || file.sha256 !== actualHash) {
      sourceIndexContentMismatches += 1;
      sourceIndexDrift.push({
        path: file.path,
        indexedBytes: file.bytes,
        actualBytes: bytes.byteLength,
        indexedSha256: file.sha256,
        actualSha256: actualHash,
      });
    }
  }

  for (const path of CONTENT_PATHS) {
    if (contentHashes.has(path)) continue;
    const bytes = await readFile(join(root, path));
    contentHashes.set(path, hashRecord(path, bytes));
  }

  const counts = {
    searchableTasks: allTasks.tasks.length,
    liveInteractionTasks: live.tasks.length,
    extractedTasks: extracted.tasks.length,
    rankedTasks: ranked.tasks.length,
    searchRecords: searchRecords.length,
    benchmarkProxyAdapters: adapters.adapters.length,
    externalLocalProxyTasks: adapters.externalLocalTasks.length,
    sourceFiles: sources.files.length,
    sourceBytes: verifiedSourceBytes,
    savedViews: savedViews.views.length,
    taskBundles: taskBundles.bundles.length,
    tags: tagIndex.tags.length,
    sourceIndexContentMismatches,
  };
  const officialScoreBoundary = {
    officialScoreClaim: false,
    tasksClaimingOfficialScore,
    adaptersClaimingOfficialScore,
    localProxyTasksClaimingOfficialScore,
    officialSemanticScoreStatus: "not-claimed",
    productPathCompletionIsOfficialScore: false,
    statement: "This receipt validates corpus structure and content only. It is not an official benchmark score or leaderboard result.",
  };
  const catalogValid = problems.length === 0;
  const sourceIndexValid = sourceIndexContentMismatches === 0;
  const passed = catalogValid && sourceIndexValid;
  const core = {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    repository: "HomenShum/NodeTasks",
    status: !catalogValid
      ? "catalog-invalid"
      : sourceIndexValid
        ? "valid"
        : "catalog-valid-with-known-source-index-drift",
    catalogValid,
    sourceIndexValid,
    passed,
    releaseReady: passed,
    hashAlgorithm: "sha256",
    counts,
    officialScoreBoundary,
    sourceIndexDrift: {
      mismatchCount: sourceIndexContentMismatches,
      sampleLimit: 10,
      samples: sourceIndexDrift
        .sort(comparePathRecords)
        .slice(0, 10),
    },
    vendoredSource: {
      root: "upstream/noderoom",
      aggregateFormat: "sha256(JSON.stringify([{path,bytes,sha256},...])) with records sorted by path",
      sha256: sha256(Buffer.from(JSON.stringify(
        vendoredSourceRecords.sort(comparePathRecords),
      ))),
    },
    contentHashes: [...contentHashes.values()].sort(comparePathRecords),
  };
  const receipt = {
    ...core,
    corpusHash: sha256(Buffer.from(JSON.stringify(core))),
  };

  return { problems, receipt };
}

export function serializeReceipt(receipt) {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const supported = new Set(["--check-receipt", "--write-receipt"]);
  const unknown = [...args].filter((arg) => !supported.has(arg));
  if (unknown.length > 0 || (args.has("--check-receipt") && args.has("--write-receipt"))) {
    console.error("Usage: node scripts/validate-catalog.mjs [--check-receipt|--write-receipt]");
    process.exitCode = 2;
    return;
  }

  const root = process.cwd();
  const { problems, receipt } = await validateCatalog(root);
  const serialized = serializeReceipt(receipt);

  if (args.has("--check-receipt")) {
    const receiptPath = join(root, RECEIPT_PATH);
    if (!existsSync(receiptPath)) {
      problems.push(`${RECEIPT_PATH} is missing; run npm run validate`);
    } else if (await readFile(receiptPath, "utf8") !== serialized) {
      problems.push(`${RECEIPT_PATH} is stale; run npm run validate`);
    }
  }

  if (problems.length > 0) {
    console.error(problems.map((problem) => `- ${problem}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  if (args.has("--write-receipt")) {
    const receiptPath = join(root, RECEIPT_PATH);
    await mkdir(dirname(receiptPath), { recursive: true });
    await writeFile(receiptPath, serialized, "utf8");
  }

  process.stdout.write(serialized);
  if (!receipt.passed) {
    console.error(
      `NodeTasks proof blocked: ${receipt.status} (${receipt.sourceIndexDrift.mismatchCount} source-index mismatch(es))`,
    );
    process.exitCode = 1;
  }
}

function hashRecord(path, bytes) {
  return { path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function comparePathRecords(left, right) {
  if (left.path < right.path) return -1;
  if (left.path > right.path) return 1;
  return 0;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isExternalRef(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) await main();
