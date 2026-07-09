import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const problems = [];

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
assert(index.summary.savedViews === savedViews.views.length, "task index saved view count matches");
assert(index.summary.taskBundles === taskBundles.bundles.length, "task index bundle count matches");
assert(searchRecords.length === allTasks.tasks.length, "search index count matches all tasks");

const taskIds = new Set();
for (const task of allTasks.tasks) {
  assert(typeof task.id === "string" && task.id.length > 3, `task id valid: ${task.id}`);
  assert(!taskIds.has(task.id), `task id unique: ${task.id}`);
  taskIds.add(task.id);
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
  assert(typeof task.provenance.scoreStatus === "string", `task has provenance score status: ${task.id}`);
  assert(Array.isArray(task.provenance.suiteLineage), `task has suite lineage: ${task.id}`);
  for (const sourceRef of task.sourceRefs ?? []) {
    assert(existsSync(join(root, sourceRef)), `sourceRef exists for ${task.id}: ${sourceRef}`);
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
for (const adapter of adapters.adapters) {
  assert(!adapterIds.has(adapter.id), `adapter id unique: ${adapter.id}`);
  adapterIds.add(adapter.id);
  assert(adapter.officialScoreClaim === false, `adapter does not claim official score: ${adapter.id}`);
  assert(existsSync(join(root, adapter.sourcePath)), `adapter source path exists: ${adapter.id}`);
}

const blockedPatterns = [
  /\.env(?!\.example$)/,
  /node_modules\//,
  /\.proofloop\//,
  /test-results\//,
  /\.log$/,
  /secret/i
];
for (const file of sources.files) {
  for (const pattern of blockedPatterns) {
    assert(!pattern.test(file.path), `source path is public-safe: ${file.path}`);
  }
}

if (problems.length) {
  console.error(problems.map((problem) => `- ${problem}`).join("\n"));
  process.exit(1);
}

console.log(`NodeTasks catalog valid: ${allTasks.tasks.length} searchable tasks (${live.tasks.length} curated, ${extracted.tasks.length} extracted), ${adapters.adapters.length} adapters, ${sources.files.length} source files`);

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

async function readJsonl(path) {
  const text = await readFile(join(root, path), "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function assert(condition, message) {
  if (!condition) problems.push(message);
}
