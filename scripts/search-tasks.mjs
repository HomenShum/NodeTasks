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
  id: ""
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
  } else {
    terms.push(arg);
  }
}

const records = await readJsonl("catalog/search-index.jsonl");
const query = terms.join(" ").trim();
const queryTerms = tokenize(query);

let ranked = records
  .filter((record) => !options.kind || record.kind === options.kind)
  .filter((record) => !options.family || record.family === options.family)
  .filter((record) => !options.surface || record.surface === options.surface)
  .filter((record) => !options.id || record.id === options.id)
  .map((record) => ({ record, score: score(record, queryTerms, query) }))
  .filter((item) => options.id || queryTerms.length === 0 || item.score > 0)
  .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
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
    console.log(`  ${record.title}`);
    if (record.goal && record.goal !== record.title) console.log(`  ${record.goal}`);
    if (record.command) console.log(`  command: ${record.command}`);
    if (record.sourceRefs?.length) console.log(`  source: ${record.sourceRefs.slice(0, 3).join(", ")}`);
    if (record.tags?.length) console.log(`  tags: ${record.tags.slice(0, 10).join(", ")}`);
    console.log("");
  }
}

function printHelp() {
  console.log(`NodeTasks search

Usage:
  npm run search -- <query>
  npm run search -- graph nodeagent --kind curated-live
  npm run search -- spreadsheetbench --family spreadsheetbench-v1-full-912 --limit 5
  npm run search -- --id model-attempt.z-ai-glm-5-2.spreadsheetbench-v1-full-912.102-20 --json

Options:
  --kind <kind>       Filter by task kind.
  --family <family>   Filter by task family.
  --surface <surface> Filter by surface.
  --id <id>           Exact id lookup.
  --limit, -n <n>     Number of results, default 20.
  --json              Print JSON.
`);
}
