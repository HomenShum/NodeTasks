import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);

const options = {
  limit: 20,
  json: false,
  kind: "",
  family: "",
  surface: "",
  id: "",
  domain: "",
  tag: "",
  view: "",
  maxDifficulty: "",
  maxCost: "",
  sort: "relevance"
};
const terms = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  }
  if (arg === "--json") {
    options.json = true;
  } else if (arg === "--limit" || arg === "-n") {
    options.limit = Number(args[++i] ?? "20");
  } else if (arg === "--kind") {
    options.kind = args[++i] ?? "";
  } else if (arg === "--family") {
    options.family = args[++i] ?? "";
  } else if (arg === "--surface") {
    options.surface = args[++i] ?? "";
  } else if (arg === "--id") {
    options.id = args[++i] ?? "";
  } else if (arg === "--domain") {
    options.domain = args[++i] ?? "";
  } else if (arg === "--tag") {
    options.tag = args[++i] ?? "";
  } else if (arg === "--view") {
    options.view = args[++i] ?? "";
  } else if (arg === "--max-difficulty") {
    options.maxDifficulty = args[++i] ?? "";
  } else if (arg === "--max-cost") {
    options.maxCost = args[++i] ?? "";
  } else if (arg === "--sort") {
    options.sort = args[++i] ?? "relevance";
  } else {
    terms.push(arg);
  }
}

const records = await readJsonl("catalog/search-index.jsonl");
const savedViews = await readJson("catalog/saved-views.json").catch(() => ({ views: [] }));
const activeView = options.view ? savedViews.views?.find((view) => view.id === options.view) : undefined;
if (options.view && !activeView) {
  console.error(`Unknown saved view: ${options.view}`);
  process.exit(1);
}
const viewFilters = activeView?.filters ?? {};
const query = terms.join(" ").trim() || activeView?.query || "";
if (activeView?.sort && options.sort === "relevance") options.sort = activeView.sort;
const queryTerms = tokenize(query);

let ranked = records
  .filter((record) => !viewFilters.domain || record.rank?.domain === viewFilters.domain)
  .filter((record) => !viewFilters.kind || asArray(viewFilters.kind).includes(record.kind))
  .filter((record) => !viewFilters.maxDifficulty || difficultyRank(record.rank?.difficultyTier) <= difficultyRank(viewFilters.maxDifficulty))
  .filter((record) => !viewFilters.maxCostRank || Number(record.rank?.costRank ?? 99) <= Number(viewFilters.maxCostRank))
  .filter((record) => !viewFilters.tag || (record.rank?.topTags ?? record.tags ?? []).some((tag) => tag.toLowerCase().includes(String(viewFilters.tag).toLowerCase())))
  .filter((record) => !options.kind || record.kind === options.kind)
  .filter((record) => !options.family || record.family === options.family)
  .filter((record) => !options.surface || record.surface === options.surface)
  .filter((record) => !options.id || record.id === options.id)
  .filter((record) => !options.domain || record.rank?.domain === options.domain)
  .filter((record) => !options.tag || (record.rank?.topTags ?? record.tags ?? []).some((tag) => tag.toLowerCase().includes(options.tag.toLowerCase())))
  .filter((record) => !options.maxDifficulty || difficultyRank(record.rank?.difficultyTier) <= difficultyRank(options.maxDifficulty))
  .filter((record) => !options.maxCost || Number(record.rank?.costRank ?? 99) <= Number(options.maxCost))
  .map((record) => ({ record, score: score(record, queryTerms, query) }))
  .filter((item) => options.id || queryTerms.length === 0 || item.score > 0)
  .sort(sorter(options.sort))
  .slice(0, Math.max(1, options.limit));

if (options.json) {
  console.log(JSON.stringify(ranked.map(({ record, score }) => ({ score, ...record })), null, 2));
} else {
  printResults(ranked, query);
}

async function readJsonl(path) {
  const text = await readFile(join(root, path), "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

function score(record, terms, phrase) {
  if (!terms.length) return 1;
  const haystack = String(record.text ?? "").toLowerCase();
  const title = String(record.title ?? "").toLowerCase();
  const goal = String(record.goal ?? "").toLowerCase();
  const id = String(record.id ?? "").toLowerCase();
  const tags = (record.tags ?? []).join(" ").toLowerCase();
  let total = 0;
  if (phrase && haystack.includes(phrase.toLowerCase())) total += 10;
  for (const term of terms) {
    if (id.includes(term)) total += 12;
    if (title.includes(term)) total += 8;
    if (goal.includes(term)) total += 5;
    if (tags.includes(term)) total += 4;
    if (haystack.includes(term)) total += 1;
  }
  return total;
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9_.:/-]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function printResults(items, query) {
  console.log(`NodeTasks search${query ? `: ${query}` : ""}`);
  console.log(`${items.length} result(s)\n`);
  for (const { record, score } of items) {
    console.log(`[${score}] ${record.id}`);
    console.log(`  ${record.kind} | ${record.family} | ${record.surface}`);
    if (record.rank) {
      console.log(`  ${record.rank.domain} > ${record.rank.subdomain} | ${record.rank.difficultyTier} (${record.rank.difficultyScore}) | ${record.rank.estimatedSteps} steps | ${record.rank.costTier}`);
    }
    console.log(`  ${record.title}`);
    if (record.goal && record.goal !== record.title) console.log(`  ${record.goal}`);
    if (record.command) console.log(`  command: ${record.command}`);
    if (record.sourceRefs?.length) console.log(`  source: ${record.sourceRefs.slice(0, 3).join(", ")}`);
    if (record.tags?.length) console.log(`  tags: ${record.tags.slice(0, 10).join(", ")}`);
    console.log("");
  }
}

function sorter(mode) {
  return (a, b) => {
    const relevance = b.score - a.score;
    if (mode === "difficulty") return relevance || Number(a.record.rank?.difficultyScore ?? 0) - Number(b.record.rank?.difficultyScore ?? 0);
    if (mode === "difficulty-desc") return relevance || Number(b.record.rank?.difficultyScore ?? 0) - Number(a.record.rank?.difficultyScore ?? 0);
    if (mode === "steps") return relevance || Number(a.record.rank?.estimatedSteps ?? 0) - Number(b.record.rank?.estimatedSteps ?? 0);
    if (mode === "cost") return relevance || Number(a.record.rank?.costRank ?? 0) - Number(b.record.rank?.costRank ?? 0);
    if (mode === "domain") return relevance || Number(a.record.rank?.sortScore ?? 0) - Number(b.record.rank?.sortScore ?? 0);
    return b.score - a.score || Number(a.record.rank?.sortScore ?? 0) - Number(b.record.rank?.sortScore ?? 0) || a.record.id.localeCompare(b.record.id);
  };
}

function difficultyRank(value) {
  return { intro: 1, intermediate: 2, advanced: 3, expert: 4 }[String(value).toLowerCase()] ?? 99;
}

function asArray(value) {
  return Array.isArray(value) ? value : [value].filter(Boolean);
}

function printHelp() {
  console.log(`NodeTasks search

Usage:
  npm run search -- <query>
  npm run search -- graph nodeagent --kind curated-live
  npm run search -- spreadsheetbench --family spreadsheetbench-v1-full-912 --limit 5
  npm run search -- graph --domain "Collaboration & Room UX" --sort difficulty
  npm run search -- --id model-attempt.z-ai-glm-5-2.spreadsheetbench-v1-full-912.102-20 --json

Options:
  --kind <kind>       Filter by task kind.
  --family <family>   Filter by task family.
  --surface <surface> Filter by surface.
  --id <id>           Exact id lookup.
  --domain <domain>   Filter by inferred domain.
  --tag <tag>         Filter by ranked tag substring.
  --view <id>         Apply a saved view from catalog/saved-views.json.
  --max-difficulty <intro|intermediate|advanced|expert>
  --max-cost <1-5>    Filter by cost rank.
  --sort <mode>       relevance, difficulty, difficulty-desc, steps, cost, domain.
  --limit, -n <n>     Number of results, default 20.
  --json              Print JSON.
`);
}
