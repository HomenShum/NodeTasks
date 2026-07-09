import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const problems = [];

const live = await readJson("catalog/live-interaction-tasks.json");
const adapters = await readJson("catalog/benchmark-proxy-adapters.json");
const sources = await readJson("catalog/source-files.json");
const index = await readJson("catalog/task-index.json");

assert(Array.isArray(live.tasks), "live tasks array exists");
assert(Array.isArray(adapters.adapters), "adapters array exists");
assert(Array.isArray(sources.files), "source files array exists");
assert(index.summary.liveInteractionTasks === live.tasks.length, "task index live count matches");
assert(index.summary.benchmarkProxyAdapters === adapters.adapters.length, "task index adapter count matches");

const taskIds = new Set();
for (const task of live.tasks) {
  assert(typeof task.id === "string" && task.id.length > 3, `task id valid: ${task.id}`);
  assert(!taskIds.has(task.id), `task id unique: ${task.id}`);
  taskIds.add(task.id);
  assert(task.officialScoreClaim === false, `task does not claim official score: ${task.id}`);
  assert(Array.isArray(task.steps) && task.steps.length > 0, `task has steps: ${task.id}`);
  assert(Array.isArray(task.assertions) && task.assertions.length > 0, `task has assertions: ${task.id}`);
  for (const sourceRef of task.sourceRefs ?? []) {
    assert(existsSync(join(root, sourceRef)), `sourceRef exists for ${task.id}: ${sourceRef}`);
  }
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

console.log(`NodeTasks catalog valid: ${live.tasks.length} tasks, ${adapters.adapters.length} adapters, ${sources.files.length} source files`);

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

function assert(condition, message) {
  if (!condition) problems.push(message);
}
