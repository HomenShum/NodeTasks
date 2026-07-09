import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

const root = process.cwd();
const upstreamRoot = join(root, "upstream", "noderoom");
const catalogDir = join(root, "catalog");

const liveTasks = [
  task("noderoom.graph.nodeagent.review-gaps.v1", "graph-nodeagent", "NodeRoom", "#upscalex", "host", "Ask NodeAgent to find review blockers from the entity graph.", ["Open seeded UpScaleX room.", "Open work surface graph through the graph-tab DOM contract."], ["Wait for knowledge graph.", "Wait for graph-nodeagent-panel.", "Submit review-gaps prompt."], ["Graph panel renders.", "NodeAgent request is accepted.", "Room trace or public chat can carry the workpaper."], ["browser screenshot", "chat message", "trace receipt"], ["upstream/noderoom/proofloop/benchmarks/common/live-room-scenario.spec.ts", "upstream/noderoom/tests/commandPalette.test.tsx"], "agent-ui-integration"),
  task("noderoom.graph.nodeagent.evidence.v1", "graph-nodeagent", "NodeRoom", "#upscalex", "host", "Ask NodeAgent for source-backed evidence around a selected graph node.", ["Open graph.", "Select a company node when present."], ["Submit evidence prompt.", "Inspect returned status."], ["needs_review is not treated as source-backed.", "Selected node context is included."], ["trace receipt", "graph screenshot"], ["upstream/noderoom/proofloop/benchmarks/common/live-room-scenario.spec.ts"], "provenance"),
  task("noderoom.graph.people-clusters.v1", "graph-nodeagent", "NodeRoom", "#upscalex", "host", "Trace person-to-company relationships and connected project or achievement clusters.", ["Open entity graph.", "Focus person/company node."], ["Search or select a person.", "Expand neighborhood.", "Ask NodeAgent who researched the company."], ["People nodes remain connected to companies.", "Projects/achievements remain visible when present."], ["graph screenshot", "tool trace"], ["upstream/noderoom/tests/proofloopExternalAdapterTasks.test.ts"], "relationship-navigation"),
  task("streamlit.nodegraph.chat.evidence.v1", "streamlit-nodegraph", "Streamlit", "http://127.0.0.1:8501/?focus=company:cardionova", "analyst", "Use the Streamlit quick prompt to ask NodeAgent for evidence.", ["Start nodeagent_server.mjs.", "Start Streamlit app."], ["Click Evidence.", "Wait for assistant reply.", "Open tool trace expander."], ["Assistant reply mentions NodeAgent.", "Tool trace exists.", "Graph iframe remains rendered."], ["browser screenshot", "tool trace"], ["upstream/noderoom/proofloop/benchmarks/common/browser-scenario.ts"], "external-demo"),
  task("streamlit.nodegraph.chat.typed-at-mention.v1", "streamlit-nodegraph", "Streamlit", "http://127.0.0.1:8501/?focus=company:cardionova", "analyst", "Type an @nodeagent chat prompt in Streamlit and receive a second turn.", ["Start bridge.", "Start Streamlit."], ["Type @nodeagent who researched this company?", "Press Enter.", "Wait for reply."], ["Message persists in session state.", "Assistant reply uses graph bridge.", "No Streamlit exception is shown."], ["browser screenshot", "chat transcript"], ["upstream/noderoom/proofloop/benchmarks/common/browser-scenario.ts"], "external-demo"),
  task("noderoom.chat.public-nodeagent.company-research.v1", "public-chat", "NodeRoom", "?demo=1", "host", "Ask public NodeAgent to research a company row from chat.", ["Open demo room.", "Ensure public chat is selected."], ["Send @nodeagent company research prompt.", "Wait for streaming/status.", "Inspect final message."], ["User message visible.", "Agent stream/job status visible.", "Final response appears in public chat."], ["chat transcript", "node trace", "cost ledger"], ["upstream/noderoom/proofloop/benchmarks/common/live-room-scenario.spec.ts", "upstream/noderoom/tests/chatReasoningFrames.test.tsx"], "public-agent"),
  task("noderoom.chat.public-nodeagent.runway-gaps.v1", "public-chat", "NodeRoom", "?demo=1", "host", "Ask public NodeAgent to identify runway or evidence gaps.", ["Open demo room.", "Select public chat."], ["Send @nodeagent runway gaps.", "Wait for progress.", "Open trace."], ["Gaps are called out as review items.", "No backend mutation bypass is required."], ["chat transcript", "trace receipt"], ["upstream/noderoom/tests/chatReasoningFrames.test.tsx"], "public-agent"),
  task("noderoom.trace.open-filter-group.v1", "trace-surface", "NodeRoom", "?demo=1", "host", "Open trace, filter by event kind, and group runs.", ["Open room with trace events."], ["Open Run trace.", "Toggle group by run.", "Filter an event kind."], ["Trace list remains bounded.", "Grouped row expands on demand."], ["trace screenshot", "trace JSON"], ["upstream/noderoom/tests/cellHistoryUi.test.tsx", "upstream/noderoom/tests/runTrace.test.ts"], "trace-observability"),
  task("noderoom.proposals.accept-reject.v1", "proposal-review", "NodeRoom", "?demo=1", "host", "Review pending agent proposals without direct mutation bypass.", ["Seed proposal or run NodeAgent in review mode."], ["Open review queue.", "Accept one proposal.", "Reject one proposal."], ["Accepted proposal mutates through review path.", "Rejected proposal remains auditable.", "Trace receipt records decision."], ["proposal receipt", "trace receipt"], ["upstream/noderoom/tests/proofloopPipeline.test.ts", "upstream/noderoom/tests/agentJobsSource.test.ts"], "human-approval"),
  task("noderoom.sheet.edit-evidence-export.v1", "spreadsheet", "NodeRoom", "?demo=1", "host", "Edit a spreadsheet cell, inspect evidence, and export XLSX.", ["Open demo room.", "Open Q3 variance sheet."], ["Double-click a cell.", "Edit value.", "Open evidence popover.", "Export XLSX."], ["Cell edit persists.", "Evidence popover is visible.", "Export action completes."], ["xlsx file", "browser screenshot"], ["upstream/noderoom/tests/evidencePopover.test.tsx", "upstream/noderoom/tests/sheetVirtualization.test.ts"], "spreadsheet-workflow"),
  task("noderoom.sheet.generic-company-research.v1", "spreadsheet", "NodeRoom", "?demo=1", "host", "Drive the generic company research grid through pending/enriched statuses.", ["Open Company research sheet."], ["Ask NodeAgent to enrich pending rows.", "Wait for visible status changes."], ["Statuses update through store actions.", "Evidence/source cells are present."], ["node trace", "sheet screenshot"], ["upstream/noderoom/tests/workflowEvals.test.ts"], "spreadsheet-agent"),
  task("noderoom.notebook.agent-outline.v1", "notebook", "NodeRoom", "?demo=1", "host", "Ask NodeAgent to create or update a notebook outline.", ["Open notebook artifact."], ["Submit outline prompt.", "Inspect block/citation metadata."], ["Notebook writes are versioned.", "Private/public access constraints are preserved."], ["notebook screenshot", "trace receipt"], ["upstream/noderoom/tests/notebookAgentOutline.test.ts", "upstream/noderoom/tests/notebookPaper.test.tsx"], "notebook-agent"),
  task("noderoom.notebook.block-edit.v1", "notebook", "NodeRoom", "?demo=1", "host", "Apply a governed single-block notebook edit.", ["Open notebook.", "Select block."], ["Run block edit.", "Inspect diff/history."], ["CAS hash protects stale writes.", "Human prose is annotated instead of blindly replaced."], ["diff receipt", "trace receipt"], ["upstream/noderoom/tests/notebookAgentOutline.test.ts"], "notebook-governance"),
  task("noderoom.upload.csv-xlsx-pdf.v1", "upload", "NodeRoom", "?demo=1", "host", "Upload CSV/XLSX/text/PDF inputs and verify artifacts appear.", ["Open binder upload affordance."], ["Upload supported files.", "Open created artifacts."], ["Artifact appears in binder.", "Parsed content is accessible.", "No partial upload after failure."], ["artifact manifest", "browser screenshot"], ["upstream/noderoom/tests/leftRailUpload.test.tsx", "upstream/noderoom/tests/uploadedArtifact.test.ts"], "import"),
  task("noderoom.upload.bad-file-rollback.v1", "upload", "NodeRoom", "?demo=1", "host", "Reject an oversized or invalid file without partial commit.", ["Prepare mixed valid/invalid upload batch."], ["Drop files.", "Wait for error state."], ["Bad file named.", "Spinner clears.", "No partial artifact commit."], ["error screenshot"], ["upstream/noderoom/tests/leftRailUpload.test.tsx"], "import-safety"),
  task("noderoom.multiuser.lock-cas-draft.v1", "multi-user", "NodeRoom", "live room", "host+guest", "Prove managed locks, CAS, drafts, and cleanup across actors.", ["Open two clients.", "Join same room as host and guest."], ["Actor A locks cell.", "Actor B attempts stale edit.", "Release lock.", "Merge draft."], ["CAS conflict is safe.", "Draft path is visible.", "Release cleanup completes."], ["multiuser proof JSON", "trace receipt"], ["upstream/noderoom/tests/multiUserCoordinationProof.test.ts"], "collaboration"),
  task("noderoom.audit.bundle-export.v1", "audit-export", "NodeRoom", "?demo=1", "host", "Export signed evidence bundle with visibility boundaries.", ["Open seeded room."], ["Run export.", "Inspect manifest."], ["Private artifacts do not leak.", "Manifest hash is stable.", "Bad proof token creates nothing."], ["bundle manifest", "csv", "hash"], ["upstream/noderoom/tests/auditBundle.test.ts"], "privacy-export"),
  task("noderoom.roomhome.work-lanes.v1", "room-home", "NodeRoom", "?demo=1", "host", "Verify room home work lanes and open artifact routing.", ["Open room home."], ["Open work lane.", "Navigate to artifact."], ["Lane counts render.", "Artifact opens without losing room state."], ["browser screenshot"], ["upstream/noderoom/tests/roomHomeWorkLanes.test.tsx"], "navigation"),
  task("noderoom.command-palette.open-graph-trace.v1", "command-palette", "NodeRoom", "?demo=1", "host", "Use command palette to open graph and trace surfaces.", ["Open workspace."], ["Summon palette.", "Run Open Graph.", "Run Open Trace."], ["Graph and trace open through DOM-level contracts.", "Listeners clean up after repeated use."], ["browser screenshot"], ["upstream/noderoom/tests/commandPalette.test.tsx"], "navigation"),
  task("noderoom.voice.chat-composer.v1", "voice", "NodeRoom", "?demo=1", "host", "Verify voice/chat composer provider path where available.", ["Open chat composer."], ["Toggle voice control.", "Submit transcribed prompt when provider exists."], ["Provider failures are honest.", "Composer remains usable."], ["browser screenshot", "voice receipt"], ["upstream/noderoom/tests/chatVoiceComposer.test.tsx", "upstream/noderoom/tests/chatVoiceComposerProviderMic.test.tsx"], "voice"),
  task("adapter.finch.local-story.v1", "benchmark-proxy", "ProofLoop", "/#story", "emulated-user", "Run Finch local product-path proxy without claiming official score.", ["Load local task.", "Start browser scenario."], ["Open story route.", "Edit Q3 revenue C2.", "Send story prompt."], ["Computed D2 = C2 - B2 = 3,250.", "officialScoreClaim is false."], ["browser-proof.json", "local-task-manifest.json", "visual-proof.png"], ["upstream/noderoom/proofloop/benchmarks/finch/adapter.json", "upstream/noderoom/proofloop/benchmarks/common/local-tasks.ts"], "external-benchmark-proxy", false),
  task("adapter.finauditing.local-story.v1", "benchmark-proxy", "ProofLoop", "/#story", "emulated-user", "Run FinAuditing local risk/misstatement review proxy.", ["Load local task.", "Start browser scenario."], ["Open story route.", "Edit visible spreadsheet.", "Send audit prompt."], ["Visible computed proof.", "No official score claim."], ["browser-proof.json", "visual-proof.png"], ["upstream/noderoom/proofloop/benchmarks/finauditing/adapter.json", "upstream/noderoom/proofloop/benchmarks/common/local-tasks.ts"], "external-benchmark-proxy", false),
  task("adapter.workstreambench.local-story.v1", "benchmark-proxy", "ProofLoop", "/#story", "emulated-user", "Run WorkstreamBench local spreadsheet-workstream proxy.", ["Load local task."], ["Open story route.", "Run spreadsheet workstream prompt."], ["Edited input remains intact.", "D2 recomputes."], ["browser-proof.json", "visual-proof.png"], ["upstream/noderoom/proofloop/benchmarks/workstreambench/adapter.json", "upstream/noderoom/proofloop/benchmarks/common/local-tasks.ts"], "external-benchmark-proxy", false),
  task("adapter.finch.live-room.v1", "benchmark-proxy-live", "ProofLoop", "fresh live room", "emulated-user", "Run Finch proxy through fresh live room public @nodeagent.", ["Create fresh room.", "Upload proxy inputs."], ["Send public @nodeagent prompt.", "Wait for completion phrase or final answer."], ["Fresh room created.", "Inputs uploaded through UI.", "Visible stream/status evidence captured."], ["live-user-contract.json", "node-trace-v2.json", "node-eval.json"], ["upstream/noderoom/proofloop/benchmarks/common/live-room-scenario.spec.ts"], "external-benchmark-proxy", false),
  task("adapter.finauditing.live-room.v1", "benchmark-proxy-live", "ProofLoop", "fresh live room", "emulated-user", "Run FinAuditing proxy through fresh live room public @nodeagent.", ["Create fresh room.", "Upload risk/source inputs."], ["Send public @nodeagent prompt.", "Capture visual proof."], ["Official score remains blocked unless verifier accepts artifacts."], ["live-user-contract.json", "verifier-receipt.json"], ["upstream/noderoom/proofloop/benchmarks/common/live-room-scenario.spec.ts"], "external-benchmark-proxy", false),
  task("adapter.workstreambench.live-room.v1", "benchmark-proxy-live", "ProofLoop", "fresh live room", "emulated-user", "Run WorkstreamBench proxy through fresh live room public @nodeagent.", ["Create fresh room.", "Upload spreadsheet inputs."], ["Invoke @nodeagent.", "Inspect sheet and trace."], ["Product path completion is separate from official semantic score."], ["scorecard.md", "cost-ledger.json"], ["upstream/noderoom/proofloop/benchmarks/common/live-room-scenario.spec.ts"], "external-benchmark-proxy", false),
  task("adapter.bankertoolbench.live-suite.v1", "benchmark-proxy-live", "ProofLoop", "BankerToolBench live room", "emulated-banker", "Run BankerToolBench live suite through NodeRoom browser path.", ["Stage BankerToolBench task.", "Open live browser suite."], ["Seed inputs through UI.", "Produce expected deliverables.", "Run proof check."], ["XLSX/PPTX/DOCX/PDF artifacts expected.", "Reopen proof exists."], ["live-user-contract.json", "exported-files-reopen-proof.json", "official-scorer-receipt.json"], ["upstream/noderoom/proofloop/benchmarks/bankertoolbench/adapter.json", "upstream/noderoom/tests/bankerToolBenchRunner.test.ts"], "finance-deliverables"),
  task("gate.prod-browser-adapters.ledger.v1", "benchmark-gate", "NodeRoom eval", "script", "maintainer", "Build ledger of prod browser adapter contracts.", ["Run adapter ledger script."], ["Render markdown.", "Inspect missing browser scenarios."], ["Adapters tracked count is recorded.", "Blocked adapter families are explicit."], ["proofloop-prod-browser-adapters.json", "PROOFLOOP_PROD_BROWSER_ADAPTERS.md"], ["upstream/noderoom/scripts/proofloop-prod-browser-adapters.ts", "upstream/noderoom/tests/proofloopProdBrowserAdapters.test.ts"], "governance"),
  task("gate.prod-proxy-matrix.v1", "benchmark-gate", "NodeRoom eval", "script", "maintainer", "Build prod proxy benchmark matrix across models and task targets.", ["Run matrix script."], ["Inspect runnable/blocked/all-task winner fields."], ["No full all-task winner is claimed from adapter-only smoke.", "Task denominator is preserved."], ["proofloop-prod-proxy-benchmark-matrix.json", "PROOFLOOP_PROD_PROXY_BENCHMARK_MATRIX.md"], ["upstream/noderoom/scripts/proofloop-prod-proxy-benchmark-matrix.ts", "upstream/noderoom/tests/proofloopProdProxyBenchmarkMatrix.test.ts"], "governance"),
  task("gate.prod-proxy-longrun.v1", "benchmark-gate", "NodeRoom eval", "script", "maintainer", "Plan long-run prod proxy queue.", ["Run long-run planner."], ["Inspect queue, budget, and blocked lanes."], ["Every model-task attempt is planned.", "Blocked adapter families remain visible."], ["longrun state", "queue JSON", "dashboard"], ["upstream/noderoom/scripts/proofloop-prod-proxy-longrun.ts", "upstream/noderoom/tests/proofloopProdProxyLongRun.test.ts"], "governance"),
  task("proofloop.proximitty.intake.v1", "proofloop-suite", "ProofLoop", "proximitty-underwriting-pr0", "underwriting-demo-user", "Run Proximitty intake scenario with synthetic underwriting data.", ["Load synthetic dataset."], ["Run intake spec.", "Write scorecard and verifier receipt."], ["Synthetic-only disclaimer preserved.", "Required artifacts exist."], ["scorecard.md", "verifier-receipt.json"], ["upstream/noderoom/proofloop/scenarios/proximitty-intake.spec.ts", "upstream/noderoom/proofloop/suites/proximitty-underwriting-pr0.json"], "synthetic-underwriting"),
  task("proofloop.proximitty.risk-research.v1", "proofloop-suite", "ProofLoop", "proximitty-underwriting-pr0", "underwriting-demo-user", "Run Proximitty risk research scenario.", ["Load source pack and risk notes."], ["Run risk research spec."], ["Evidence rubric applies.", "No real financial decision claim."], ["node-trace-v2.json", "node-eval.json"], ["upstream/noderoom/proofloop/scenarios/proximitty-risk-research.spec.ts"], "synthetic-underwriting"),
  task("proofloop.proximitty.packet.v1", "proofloop-suite", "ProofLoop", "proximitty-underwriting-pr0", "underwriting-demo-user", "Generate underwriting packet proof artifacts.", ["Load synthetic company profile."], ["Run underwriting packet spec.", "Generate clips if enabled."], ["Packet artifacts are present.", "Verifier receipt records local-only status."], ["clips", "scorecard.md"], ["upstream/noderoom/proofloop/scenarios/proximitty-underwriting-packet.spec.ts"], "synthetic-underwriting"),
  task("proofloop.accounting.variance-analysis.v1", "proofloop-accounting", "ProofLoop", "accounting", "accountant", "Run accounting variance-analysis scenario.", ["Seed accounting datasets."], ["Run variance-analysis YAML scenario."], ["Accounting rubric applies.", "Dataset registry resolves."], ["scorecard.md", "node-eval.json"], ["upstream/noderoom/proofloop/accounting/scenarios/variance-analysis.yaml", "upstream/noderoom/proofloop/accounting/rubrics/accounting-rubric.yaml"], "accounting"),
  task("proofloop.accounting.spreadsheet-reconciliation.v1", "proofloop-accounting", "ProofLoop", "accounting", "accountant", "Run spreadsheet reconciliation scenario.", ["Seed reconciliation dataset."], ["Run scenario.", "Inspect proof receipt."], ["Reconciliation output matches rubric.", "Inputs remain traceable."], ["scorecard.md"], ["upstream/noderoom/proofloop/accounting/scenarios/spreadsheet-reconciliation.yaml"], "accounting"),
  task("proofloop.accounting.invoice-extraction.v1", "proofloop-accounting", "ProofLoop", "accounting", "accountant", "Run invoice extraction scenario.", ["Seed invoice dataset."], ["Run invoice extraction YAML scenario."], ["Extracted fields are grounded.", "Rubric result is recorded."], ["node-eval.json"], ["upstream/noderoom/proofloop/accounting/scenarios/invoice-extraction.yaml"], "accounting"),
  task("proofloop.accounting.financial-statement-qa.v1", "proofloop-accounting", "ProofLoop", "accounting", "accountant", "Run financial statement QA scenario.", ["Seed financial statement dataset."], ["Run QA scenario."], ["Question answer cites statement evidence."], ["scorecard.md"], ["upstream/noderoom/proofloop/accounting/scenarios/financial-statement-qa.yaml"], "accounting"),
  task("proofloop.notion.warm-intro.v1", "proofloop-notion", "ProofLoop", "notion", "sales-ops", "Run Notion warm-intro scenario.", ["Seed Notion-like datasets."], ["Run warm intro scenario."], ["Lead and meeting context are used.", "Sales rubric applies."], ["scorecard.md"], ["upstream/noderoom/proofloop/notion/scenarios/01-warm-intro.yaml", "upstream/noderoom/proofloop/notion/rubrics/sales-agent-rubric.yaml"], "notion-workflow"),
  task("proofloop.notion.follow-up.v1", "proofloop-notion", "ProofLoop", "notion", "sales-ops", "Run Notion follow-up scenario.", ["Seed pipeline and notes."], ["Run follow-up spec."], ["Follow-up action is grounded in meeting notes."], ["scorecard.md"], ["upstream/noderoom/proofloop/notion/scenarios/02-follow-up.yaml"], "notion-workflow"),
  task("proofloop.notion.pipeline.v1", "proofloop-notion", "ProofLoop", "notion", "sales-ops", "Run automated pipeline scenario.", ["Seed pipeline dataset."], ["Run automated pipeline spec."], ["Pipeline transitions are auditable."], ["node-trace-v2.json"], ["upstream/noderoom/proofloop/notion/scenarios/03-automated-pipeline.yaml"], "notion-workflow"),
  task("proofloop.notion.meeting-prep.v1", "proofloop-notion", "ProofLoop", "notion", "sales-ops", "Run meeting prep scenario.", ["Seed meetings and discovery notes."], ["Run meeting prep spec."], ["Prep output cites relevant records."], ["scorecard.md"], ["upstream/noderoom/proofloop/notion/scenarios/04-meeting-prep.yaml"], "notion-workflow"),
  task("dataset.sec-xbrl.fixture-qa.v1", "dataset", "ProofLoop", "sec-xbrl", "financial-qa", "Run SEC/XBRL fixture task against benchmark manifest.", ["Load SEC/XBRL fixtures."], ["Run scorer or audit task."], ["Fixture ids resolve.", "Benchmark manifest is intact."], ["benchmark receipt"], ["upstream/noderoom/proofloop/datasets/sec-xbrl/benchmark.json", "upstream/noderoom/proofloop/datasets/sec-xbrl/fixtures.json"], "financial-data"),
  task("noderl.anti-reward-hacking-doctrine.v1", "doctrine", "Noderl", "spec", "maintainer", "Validate that certification and exploration loops stay separate.", ["Read doctrine spec."], ["Inspect scaffold proposal acceptance rule.", "Check verifier weakening guard."], ["Repair loop cannot grade its own homework.", "Promoted regressions use tracked ledger."], ["doctrine review"], ["upstream/noderoom/noderl/spec/anti-reward-hacking-doctrine.md", "upstream/noderoom/proofloop/regressions/promoted-regressions.json"], "governance")
];

await mkdir(catalogDir, { recursive: true });
const adapters = await loadAdapters();
const localTasks = await loadExternalLocalTasks();
const sourceFiles = await listSourceFiles();
const taskIndex = {
  schema: "nodetasks-index-v1",
  generatedAt: new Date().toISOString(),
  summary: {
    liveInteractionTasks: liveTasks.length,
    benchmarkProxyAdapters: adapters.length,
    externalLocalProxyTasks: localTasks.length,
    sourceFiles: sourceFiles.length,
    sourceBytes: sourceFiles.reduce((sum, file) => sum + file.bytes, 0)
  },
  families: countBy(liveTasks, (task) => task.family),
  surfaces: countBy(liveTasks, (task) => task.surface),
  adapters: adapters.map((adapter) => ({
    id: adapter.id,
    sourceName: adapter.source?.name,
    scoringMode: adapter.scoringMode,
    liveUserCommand: adapter.liveUserCommand,
    officialScoreClaim: false
  })),
  catalogs: [
    "catalog/live-interaction-tasks.json",
    "catalog/benchmark-proxy-adapters.json",
    "catalog/source-files.json",
    "catalog/task-families.md"
  ]
};

await writeJson("catalog/live-interaction-tasks.json", { schema: "nodetasks-live-interaction-catalog-v1", generatedAt: taskIndex.generatedAt, tasks: liveTasks });
await writeJson("catalog/benchmark-proxy-adapters.json", { schema: "nodetasks-benchmark-proxy-adapters-v1", generatedAt: taskIndex.generatedAt, adapters, externalLocalTasks: localTasks });
await writeJson("catalog/source-files.json", { schema: "nodetasks-source-files-v1", generatedAt: taskIndex.generatedAt, files: sourceFiles });
await writeJson("catalog/task-index.json", taskIndex);
await writeText("catalog/task-families.md", renderFamiliesMarkdown(taskIndex, adapters, localTasks, liveTasks));

console.log(`NodeTasks catalog: ${liveTasks.length} live tasks, ${adapters.length} adapters, ${sourceFiles.length} files`);

function task(id, family, surface, route, persona, goal, setup, steps, assertions, artifacts, sourceRefs, risk, officialScoreClaim = false) {
  return {
    id,
    family,
    surface,
    route,
    persona,
    goal,
    setup,
    steps,
    assertions,
    artifacts,
    sourceRefs,
    timeoutMs: family.includes("live") || surface === "ProofLoop" ? 600000 : 60000,
    officialScoreClaim,
    risk
  };
}

async function loadAdapters() {
  const dir = join(upstreamRoot, "proofloop", "benchmarks");
  const entries = await readdir(dir, { withFileTypes: true });
  const adapters = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name, "adapter.json");
    if (!existsSync(path)) continue;
    const adapter = JSON.parse(await readFile(path, "utf8"));
    adapters.push({
      ...adapter,
      sourcePath: rel(path),
      officialScoreClaim: false,
      localProxyOnlyUntilVerifier: adapter.scoringMode === "hybrid"
    });
  }
  return adapters.sort((a, b) => a.id.localeCompare(b.id));
}

async function loadExternalLocalTasks() {
  const path = join(upstreamRoot, "proofloop", "benchmarks", "common", "local-tasks.ts");
  const text = await readFile(path, "utf8");
  const tasks = [];
  const re = /adapterId:\s*"([^"]+)"[\s\S]*?taskId:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?workflowId:\s*"([^"]+)"[\s\S]*?benchmarkMapping:\s*"([^"]+)"[\s\S]*?userPrompt:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(text))) {
    tasks.push({
      adapterId: match[1],
      taskId: match[2],
      title: match[3],
      workflowId: match[4],
      benchmarkMapping: match[5],
      userPrompt: match[6],
      officialScoreClaim: false,
      sourcePath: rel(path)
    });
  }
  return tasks;
}

async function listSourceFiles() {
  const files = [];
  await walk(upstreamRoot, async (path) => {
    const info = await stat(path);
    const buffer = await readFile(path);
    const relativePath = rel(path);
    files.push({
      path: relativePath,
      bytes: info.size,
      ext: extname(path).slice(1) || "none",
      category: categorize(relativePath),
      sha256: createHash("sha256").update(buffer).digest("hex")
    });
  });
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function walk(dir, onFile) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".proofloop") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, onFile);
    else await onFile(path);
  }
}

function categorize(path) {
  if (path.includes("/proofloop/benchmarks/")) return "benchmark-adapter";
  if (path.includes("/proofloop/accounting/")) return "accounting-suite";
  if (path.includes("/proofloop/notion/")) return "notion-suite";
  if (path.includes("/proofloop/datasets/")) return "dataset";
  if (path.includes("/proofloop/rubrics/")) return "rubric";
  if (path.includes("/proofloop/scenarios/")) return "scenario";
  if (path.includes("/noderl/")) return "noderl";
  if (path.includes("/scripts/")) return "script";
  if (path.includes("/tests/")) return "test";
  if (path.includes("/docs/")) return "doc";
  if (path.includes("/e2e/")) return "e2e";
  return "other";
}

function countBy(items, keyOf) {
  return items.reduce((acc, item) => {
    const key = keyOf(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function renderFamiliesMarkdown(index, adapters, localTasks, tasks) {
  const familyRows = Object.entries(index.families)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, count]) => `| ${family} | ${count} |`)
    .join("\n");
  const adapterRows = adapters
    .map((adapter) => `| ${adapter.id} | ${adapter.source?.name ?? ""} | ${adapter.scoringMode} | ${adapter.liveUserCommand ?? ""} |`)
    .join("\n");
  const localRows = localTasks
    .map((task) => `| ${task.adapterId} | ${task.taskId} | ${task.title} | false |`)
    .join("\n");
  const examples = tasks.slice(0, 12).map((task) => `- \`${task.id}\`: ${task.goal}`).join("\n");
  return `# NodeTasks Catalog\n\nGenerated: ${index.generatedAt}\n\n## Summary\n\n- Live interaction tasks: ${index.summary.liveInteractionTasks}\n- Benchmark proxy adapters: ${index.summary.benchmarkProxyAdapters}\n- External local proxy tasks: ${index.summary.externalLocalProxyTasks}\n- Source files: ${index.summary.sourceFiles}\n\n## Task Families\n\n| Family | Tasks |\n| --- | ---: |\n${familyRows}\n\n## Benchmark Proxy Adapters\n\n| Adapter | Source | Scoring | Live command |\n| --- | --- | --- | --- |\n${adapterRows}\n\n## External Local Proxy Tasks\n\n| Adapter | Task | Title | Official score claim |\n| --- | --- | --- | --- |\n${localRows}\n\n## Example Live Tasks\n\n${examples}\n\n## Contract\n\nEvery task should preserve product-path proof separately from official benchmark scoring. A proxy task can pass its product UI proof while still recording \`officialScoreClaim: false\` until an upstream verifier accepts the artifacts.\n`;
}

async function writeJson(path, value) {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeText(path, value) {
  const absolute = join(root, path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, value, "utf8");
}

function rel(path) {
  return relative(root, path).replace(/\\/g, "/");
}
