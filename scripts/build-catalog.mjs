import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

const root = process.cwd();
const upstreamRoot = join(root, "upstream", "noderoom");
const catalogDir = join(root, "catalog");

const liveTasks = [
  task("nodeagent.storyboard.capture.v1", "public-node-repo", "NodeAgent", "https://github.com/HomenShum/NodeAgent", "agent engineer", "Regenerate the NodeAgent storyboard proof clip and bind it to smoke receipts.", ["Clone NodeAgent.", "Install dependencies.", "Open docs/FEATURE_PROOF_STORYBOARD.md."], ["Run npm run clip:capture.", "Run nodeagent frame/local-dashboard smokes.", "Inspect README media and docs/eval receipts."], ["README GIF and MP4 exist.", "Storyboard names the proof contract.", "Frame and dashboard smoke receipts pass."], ["docs/walkthroughs/nodeagent-local-dashboard-walkthrough.gif", "docs/eval/nodeagent-frame-smoke.json", "docs/eval/nodeagent-local-dashboard-scaffold-smoke.json"], ["https://github.com/HomenShum/NodeAgent/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeAgent/blob/main/scripts/render-walkthrough-media.mjs"], "public-node-repo"),
  task("nodeagent.frame-spine.smoke.v1", "public-node-repo", "NodeAgent", "https://github.com/HomenShum/NodeAgent", "agent engineer", "Verify the portable NodeAgent frame spine without provider keys.", ["Clone NodeAgent.", "Use deterministic demo inputs."], ["Run npm run nodeagent:frame:smoke.", "Run npm run nodeagent:durable:smoke.", "Run npm run nodeagent:sqlite:smoke."], ["Frame status is completed.", "Durable adapter path remains provider-neutral.", "SQLite path writes a local receipt."], ["docs/eval/nodeagent-frame-smoke.json", "docs/eval/nodeagent-durable-smoke.json", "docs/eval/nodeagent-sqlite-smoke.json"], ["https://github.com/HomenShum/NodeAgent/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeAgent/blob/main/README.md"], "public-node-repo"),
  task("nodeagent.chat-ui-adoption.v1", "public-node-repo", "NodeAgent", "https://github.com/HomenShum/NodeAgent", "demo builder", "Prove the assistant-ui chat scaffold keeps NodeAgent tool surfaces visible.", ["Clone NodeAgent.", "Inspect docs/CHAT_UI_ADOPTION.md."], ["Run npm run nodeagent:chat-ui:smoke.", "Open the generated chat scaffold guidance.", "Confirm no-key local adapter path is described."], ["Chat scaffold smoke passes.", "Tool UI surfaces remain visible.", "Runtime adapters stay injectable."], ["docs/eval/nodeagent-chat-ui-scaffold-smoke.json", "docs/CHAT_UI_ADOPTION.md"], ["https://github.com/HomenShum/NodeAgent/blob/main/docs/CHAT_UI_ADOPTION.md"], "public-node-repo"),
  task("nodemem.passive-memory.smoke.v1", "public-node-repo", "NodeMem", "https://github.com/HomenShum/NodeMem", "agent engineer", "Verify NodeMem passive scan, dedupe, dismissal learning, and policy gates.", ["Clone NodeMem.", "Use deterministic demo activity."], ["Run npm run nodemem:smoke.", "Run npm run nodemem:in-memory:smoke.", "Inspect dismissal and policy assertions."], ["No job auto-executes from passive scan.", "Duplicate entity is suppressed.", "Dismissed entity is suppressed.", "Policy off suppresses suggestions."], ["docs/eval/nodemem-smoke.json", "docs/eval/nodemem-in-memory-smoke.json"], ["https://github.com/HomenShum/NodeMem/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeMem/blob/main/scripts/nodemem-smoke.ts"], "public-node-repo"),
  task("nodemem.storyboard.receipt.v1", "public-node-repo", "NodeMem", "https://github.com/HomenShum/NodeMem", "demo builder", "Validate the NodeMem README media as an explicit storyboard proof receipt.", ["Clone NodeMem.", "Open docs/FEATURE_PROOF_STORYBOARD.md."], ["Run npm run clip:capture.", "Inspect docs/eval/nodemem-storyboard-proof.json.", "Compare README caption to the proof contract."], ["GIF checksum and byte size are recorded.", "Storyboard includes passive scan, suggestion, approval, dismissal, storage.", "README links to NodeRoom with canonical casing."], ["assets/noderoom-review-approve.gif", "docs/eval/nodemem-storyboard-proof.json"], ["https://github.com/HomenShum/NodeMem/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeMem/blob/main/scripts/capture-storyboard.mjs"], "public-node-repo"),
  task("nodemem.nodegraph-clusters.v1", "public-node-repo", "NodeMem + NodeGraph", "https://github.com/HomenShum/NodeMem", "demo builder", "Design the NodeGraph memory-cluster view for NodeMem suggestions and dismissals.", ["Load NodeMem suggestion/dismissal fixtures.", "Load NodeGraph semantic graph primitives."], ["Map entity, mention, suggestion, approval, dismissal, policy, and job nodes.", "Select an entity cluster.", "Ask NodeAgent why the suggestion is noteworthy."], ["Relevant connections are highlighted.", "Dismissal and approval state are visible.", "The graph does not imply an automatic job ran."], ["graph screenshot", "NodeAgent tool trace", "memory policy receipt"], ["https://github.com/HomenShum/NodeGraph/blob/main/docs/semantic-entity-graph-research.md", "https://github.com/HomenShum/NodeMem/blob/main/docs/FEATURE_PROOF_STORYBOARD.md"], "public-node-repo"),
  task("nodetrace.storyboard.capture.v1", "public-node-repo", "NodeTrace", "https://github.com/HomenShum/NodeTrace", "demo builder", "Regenerate the NodeTrace walkthrough media from storyboard-governed screenshots.", ["Clone NodeTrace.", "Install dependencies.", "Open docs/FEATURE_PROOF_STORYBOARD.md."], ["Run npm run clip:capture.", "Inspect README GIF/MP4.", "Confirm Trace Lens story beats are visible."], ["Walkthrough GIF and MP4 regenerate.", "Storyboard covers no-key install, tagged surfaces, Trace Lens, proof/runtime split, Builder safety.", "README uses canonical NodeTrace GitHub shorthand."], ["docs/walkthroughs/nodetrace-walkthrough.gif", "docs/walkthroughs/nodetrace-walkthrough.mp4"], ["https://github.com/HomenShum/NodeTrace/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeTrace/blob/main/scripts/render-walkthrough-media.mjs"], "public-node-repo"),
  task("nodetrace.capture-plan.smoke.v1", "public-node-repo", "NodeTrace", "https://github.com/HomenShum/NodeTrace", "test engineer", "Run the standalone NodeTrace capture-plan smoke without requiring a sibling NodeRoom checkout.", ["Clone NodeTrace.", "Install dependencies."], ["Run npm run capture:plan:smoke.", "Inspect generated disposable fixture receipt.", "Run npm run smoke for CLI and MCP validation."], ["Capture dry run passes with one fixture step.", "CLI smoke passes.", "MCP validate_capture_plan returns ok."], ["docs/eval/nodetrace-capture-plan-smoke.json", "docs/eval/nodetrace-cli-smoke.json"], ["https://github.com/HomenShum/NodeTrace/blob/main/scripts/capture-plan-smoke.mjs", "https://github.com/HomenShum/NodeTrace/blob/main/scripts/mcp-smoke.mjs"], "public-node-repo"),
  task("nodetrace.trace-coach.sqlite.v1", "public-node-repo", "NodeTrace", "https://github.com/HomenShum/NodeTrace", "repo explorer", "Generate the NodeTrace Trace Coach SQLite proof from live NodeRoom source or embedded snapshots.", ["Clone NodeTrace.", "Optionally place a sibling NodeRoom checkout."], ["Run npm run trace-coach:sqlite.", "Open public/nodetrace-state.json.", "Inspect minimap and trace-coach screenshots."], ["Script works in snapshot mode without a sibling checkout.", "Six codebase steps are written.", "Source/UI capture metadata remains explicit."], ["docs/eval/nodetrace-trace-coach-sqlite.json", "public/nodetrace-state.json", "docs/eval/nodetrace-trace-coach-sqlite.png"], ["https://github.com/HomenShum/NodeTrace/blob/main/scripts/trace-coach-sqlite.mjs", "https://github.com/HomenShum/NodeTrace/blob/main/examples/trace-coach-sqlite/README.md"], "public-node-repo"),
  task("nodetrace.nodegraph-causality.v1", "public-node-repo", "NodeTrace + NodeGraph", "https://github.com/HomenShum/NodeTrace", "repo explorer", "Use NodeGraph to show trace causality across UI surface, runtime event, proof card, source file, screenshot, and receipt.", ["Load NodeTrace trace-coach state.", "Load NodeGraph graph primitives."], ["Build nodes from surface ids, trace ids, proof cards, events, source files, screenshots, and receipts.", "Select a UI surface.", "Expand one-hop and two-hop neighborhoods."], ["Surface-to-trace relationship is visible.", "Proof/runtime regions remain separate.", "Source file and screenshot evidence can be inspected."], ["graph JSON", "graph screenshot", "trace receipt"], ["https://github.com/HomenShum/NodeGraph/blob/main/docs/semantic-entity-graph-research.md", "https://github.com/HomenShum/NodeTrace/blob/main/docs/FEATURE_PROOF_STORYBOARD.md"], "public-node-repo"),
  task("noderl.episode-storyboard.v1", "public-node-repo", "NodeRL", "https://github.com/HomenShum/NodeRL", "benchmark maintainer", "Create a public NodeRL episode storyboard from trace to reward to memory to repair to export.", ["Clone NodeRL.", "Pick one proven example episode."], ["Document the episode goal, action, observation, evaluation, reward, memory, repair, and dataset export.", "Bind each stage to a receipt or spec file."], ["Certification and exploration loops remain separated.", "Reward is not self-graded by the proposing agent.", "Exported dataset lineage is explicit."], ["episode storyboard", "proof receipt", "reward spec"], ["https://github.com/HomenShum/NodeRL/blob/main/README.md", "https://github.com/HomenShum/NodeRL/blob/main/spec/reward-design.md"], "public-node-repo"),
  task("noderl.reward-memory-export.v1", "public-node-repo", "NodeRL", "https://github.com/HomenShum/NodeRL", "model evaluator", "Verify NodeRL reward, memory, and dataset-export boundaries for one benchmark-style task.", ["Clone NodeRL.", "Select a trace/eval example."], ["Run or inspect the eval receipt.", "Trace how reward fields are derived.", "Confirm memory/export records do not include answer keys or self-promoted scores."], ["Visual judge/test/verifier signals are separated.", "Memory records are provenance-backed.", "Dataset export remains auditably derived."], ["reward JSON", "memory record", "dataset export manifest"], ["https://github.com/HomenShum/NodeRL/blob/main/spec/proof-receipt-contract.md", "https://github.com/HomenShum/NodeRL/blob/main/spec/anti-reward-hacking-doctrine.md"], "public-node-repo"),
  task("nodeseo.storyboard.audit.v1", "public-node-repo", "NodeSEO", "https://github.com/HomenShum/NodeSEO", "growth engineer", "Run the NodeSEO static audit under the storyboard proof contract.", ["Clone NodeSEO.", "Open docs/FEATURE_PROOF_STORYBOARD.md.", "Use the example site config."], ["Run npm run validate.", "Inspect SEO_AUDIT.md and seo-audit.latest.json.", "Confirm private route noindex and static SEO checks are separated."], ["Static audit passes.", "Generated receipts identify pass/warn/fail counts.", "No ranking success is claimed from static checks alone."], ["docs/reports/SEO_AUDIT.md", "docs/reports/seo-audit.latest.json"], ["https://github.com/HomenShum/NodeSEO/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeSEO/blob/main/src/audit-static.ts"], "public-node-repo"),
  task("nodeseo.search-console-boundary.v1", "public-node-repo", "NodeSEO", "https://github.com/HomenShum/NodeSEO", "growth engineer", "Generate a Search Console report without scraping rankings or simulating clicks.", ["Clone NodeSEO.", "Provide Search Console credentials when available."], ["Run npm run search-console with a site URL.", "Inspect the JSON and Markdown report.", "Compare query/page evidence to visual QA output."], ["Search Console is treated as query-performance source of truth.", "Credential absence is labeled honestly.", "No fake click or ranking scrape workflow is introduced."], ["docs/reports/search-console.latest.json", "docs/reports/SEARCH_CONSOLE_REPORT.md"], ["https://github.com/HomenShum/NodeSEO/blob/main/README.md", "https://github.com/HomenShum/NodeSEO/blob/main/src/search-console-report.ts"], "public-node-repo"),
  task("nodeseo.visual-qa-journey.v1", "public-node-repo", "NodeSEO", "https://github.com/HomenShum/NodeSEO", "product QA", "Capture a landing/search-origin journey and pass review media to Gemini visual QA.", ["Clone NodeSEO.", "Install Playwright Chromium.", "Configure target URL and optional Gemini key."], ["Run Playwright journey or Chrome CDP capture.", "Convert frames to video.", "Run judge-video when credentials exist."], ["Journey artifact exists.", "Video review is compressed.", "Gemini output is labeled visual QA, not official SEO proof."], ["artifacts/chrome-cdp-search.review.mp4", "visual QA report", "Playwright trace"], ["https://github.com/HomenShum/NodeSEO/blob/main/docs/FEATURE_PROOF_STORYBOARD.md", "https://github.com/HomenShum/NodeSEO/blob/main/src/judge-video-gemini.ts"], "public-node-repo"),
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

const KIND_BASE_STEPS = {
  "source-reference": 1,
  "unit-test-case": 2,
  "rubric": 2,
  "scenario": 3,
  "suite": 3,
  "browser-test-case": 4,
  "local-proxy-task": 5,
  "benchmark-target": 5,
  "model-attempt": 6,
  "qa-feature": 6,
  "benchmark-adapter": 7,
  "benchmark-family": 8,
  "curated-live": 8
};

const KIND_DIFFICULTY_WEIGHT = {
  "source-reference": 1,
  "unit-test-case": 2,
  "rubric": 2,
  "scenario": 3,
  "suite": 3,
  "browser-test-case": 4,
  "local-proxy-task": 4,
  "benchmark-target": 5,
  "model-attempt": 6,
  "qa-feature": 5,
  "benchmark-adapter": 6,
  "benchmark-family": 7,
  "curated-live": 6
};

const DOMAIN_ORDER = [
  "Spreadsheet & Office Automation",
  "Banking & Finance",
  "Audit, Risk & Compliance",
  "Agent Runtime & NodeAgent",
  "Collaboration & Room UX",
  "ProofLoop Governance",
  "Data, Documents & Retrieval",
  "Source & Infrastructure"
];

const SAVED_VIEW_DEFINITIONS = [
  {
    id: "first-hour",
    title: "First hour onboarding",
    persona: "New contributor",
    description: "Low-cost source and test tasks that explain the corpus before a user runs browser or provider flows.",
    query: "nodeagent graph source test intro",
    sort: "difficulty",
    filters: { maxDifficulty: "intermediate", maxCostRank: 2 }
  },
  {
    id: "cheap-spreadsheetbench-models",
    title: "Cheapest SpreadsheetBench model attempts",
    persona: "Model evaluator",
    description: "Provider-backed SpreadsheetBench attempts sorted by low estimated cost before widening the matrix.",
    query: "spreadsheetbench model-attempt",
    sort: "cost",
    filters: { domain: "Spreadsheet & Office Automation", kind: ["model-attempt"], maxCostRank: 4 }
  },
  {
    id: "browser-proof-surfaces",
    title: "Browser proof surfaces",
    persona: "Product QA",
    description: "Live UI and browser-test tasks for chat, trace, graph, notebook, upload, and room flows.",
    query: "browser chat trace graph notebook upload room",
    sort: "difficulty",
    filters: { kind: ["browser-test-case", "curated-live"], maxCostRank: 5 }
  },
  {
    id: "finance-evidence-work",
    title: "Finance and evidence work",
    persona: "Finance analyst",
    description: "Finance, spreadsheet, accounting, and evidence-backed tasks with score boundaries called out.",
    query: "finance spreadsheet accounting bankertoolbench evidence xbrl",
    sort: "domain",
    filters: { domain: "Banking & Finance" }
  },
  {
    id: "proofloop-governance-gates",
    title: "ProofLoop governance gates",
    persona: "Benchmark maintainer",
    description: "Benchmark gates, verifier boundaries, scaffold doctrine, and anti-reward-hacking checks.",
    query: "proofloop benchmark official scorer verifier gate doctrine",
    sort: "difficulty",
    filters: { domain: "ProofLoop Governance" }
  },
  {
    id: "nodeagent-runtime-spine",
    title: "NodeAgent runtime spine",
    persona: "Agent engineer",
    description: "Frame, trace, model, and tool-loop tasks that map the agent runtime and receipts.",
    query: "nodeagent frame trace runtime model tool receipt",
    sort: "difficulty",
    filters: { domain: "Agent Runtime & NodeAgent" }
  },
  {
    id: "public-node-repo-proofs",
    title: "Public Node repo proofs",
    persona: "Repo maintainer",
    description: "Cross-repo proof tasks for NodeAgent, NodeMem, NodeTrace, NodeRL, NodeSEO, and NodeGraph integrations.",
    query: "NodeAgent NodeMem NodeTrace NodeRL NodeSEO NodeGraph storyboard proof capture smoke",
    sort: "difficulty",
    filters: { tag: "public-node-repo" }
  },
  {
    id: "collaboration-interiors",
    title: "Collaboration interiors",
    persona: "Product QA",
    description: "Room UX interiors for graph, chat, notebook, trace, multi-user, upload, and command-palette flows.",
    query: "graph chat notebook trace multi-user command-palette upload",
    sort: "difficulty",
    filters: { domain: "Collaboration & Room UX" }
  },
  {
    id: "official-score-boundaries",
    title: "Official score boundaries",
    persona: "Benchmark maintainer",
    description: "Tasks that separate product-path proxy proof from official semantic benchmark claims.",
    query: "official score claim scorer verifier proxy product path",
    sort: "difficulty-desc",
    filters: { tag: "proxy" }
  }
];

await mkdir(catalogDir, { recursive: true });
const adapters = await loadAdapters();
const localTasks = await loadExternalLocalTasks();
const sourceFiles = await listSourceFiles();
const extractedTasks = await buildExtractedTasks(sourceFiles, adapters, localTasks);
const searchableTasks = rankTasks([...liveTasks.map(normalizeLiveTask), ...extractedTasks]);
const hierarchy = buildTaskHierarchy(searchableTasks);
const tagIndex = buildTagIndex(searchableTasks);
const savedViews = buildSavedViews(searchableTasks);
const taskBundles = buildTaskBundles(searchableTasks, savedViews.views);
const provenanceIndex = buildProvenanceIndex(searchableTasks);
const searchRecords = searchableTasks.map(toSearchRecord);
const taskIndex = {
  schema: "nodetasks-index-v1",
  generatedAt: new Date().toISOString(),
  summary: {
    liveInteractionTasks: liveTasks.length,
    extractedTasks: extractedTasks.length,
    searchableTasks: searchableTasks.length,
    benchmarkProxyAdapters: adapters.length,
    externalLocalProxyTasks: localTasks.length,
    sourceFiles: sourceFiles.length,
    savedViews: savedViews.views.length,
    taskBundles: taskBundles.bundles.length,
    provenanceVerifierTypes: Object.keys(provenanceIndex.verifierTypes).length,
    sourceBytes: sourceFiles.reduce((sum, file) => sum + file.bytes, 0)
  },
  families: countBy(searchableTasks, (task) => task.family),
  kinds: countBy(searchableTasks, (task) => task.kind),
  domains: countBy(searchableTasks, (task) => task.rank.domain),
  difficultyTiers: countBy(searchableTasks, (task) => task.rank.difficultyTier),
  costTiers: countBy(searchableTasks, (task) => task.rank.costTier),
  surfaces: countBy(searchableTasks, (task) => task.surface),
  adapters: adapters.map((adapter) => ({
    id: adapter.id,
    sourceName: adapter.source?.name,
    scoringMode: adapter.scoringMode,
    liveUserCommand: adapter.liveUserCommand,
    officialScoreClaim: false
  })),
  catalogs: [
    "catalog/all-tasks.json",
    "catalog/ranked-tasks.json",
    "catalog/hierarchy.json",
    "catalog/tag-index.json",
    "catalog/saved-views.json",
    "catalog/task-bundles.json",
    "catalog/provenance-index.json",
    "catalog/live-interaction-tasks.json",
    "catalog/extracted-tasks.json",
    "catalog/benchmark-proxy-adapters.json",
    "catalog/source-files.json",
    "catalog/search-index.jsonl",
    "catalog/task-browser.html",
    "catalog/task-families.md"
  ]
};

await writeJson("catalog/all-tasks.json", { schema: "nodetasks-all-tasks-v1", generatedAt: taskIndex.generatedAt, tasks: searchableTasks });
await writeJson("catalog/ranked-tasks.json", { schema: "nodetasks-ranked-tasks-v1", generatedAt: taskIndex.generatedAt, tasks: searchableTasks });
await writeJson("catalog/hierarchy.json", { schema: "nodetasks-hierarchy-v1", generatedAt: taskIndex.generatedAt, hierarchy });
await writeJson("catalog/tag-index.json", { schema: "nodetasks-tag-index-v1", generatedAt: taskIndex.generatedAt, tags: tagIndex });
await writeJson("catalog/saved-views.json", { schema: "nodetasks-saved-views-v1", generatedAt: taskIndex.generatedAt, views: savedViews.views });
await writeJson("catalog/task-bundles.json", { schema: "nodetasks-task-bundles-v1", generatedAt: taskIndex.generatedAt, bundles: taskBundles.bundles });
await writeJson("catalog/provenance-index.json", { schema: "nodetasks-provenance-index-v1", generatedAt: taskIndex.generatedAt, ...provenanceIndex });
await writeJson("catalog/live-interaction-tasks.json", { schema: "nodetasks-live-interaction-catalog-v1", generatedAt: taskIndex.generatedAt, tasks: liveTasks });
await writeJson("catalog/extracted-tasks.json", { schema: "nodetasks-extracted-task-catalog-v1", generatedAt: taskIndex.generatedAt, tasks: extractedTasks });
await writeJson("catalog/benchmark-proxy-adapters.json", { schema: "nodetasks-benchmark-proxy-adapters-v1", generatedAt: taskIndex.generatedAt, adapters, externalLocalTasks: localTasks });
await writeJson("catalog/source-files.json", { schema: "nodetasks-source-files-v1", generatedAt: taskIndex.generatedAt, files: sourceFiles });
await writeText("catalog/search-index.jsonl", `${searchRecords.map((record) => JSON.stringify(record)).join("\n")}\n`);
await writeText("catalog/search-index.js", `window.NODETASKS_SEARCH_INDEX = ${JSON.stringify(searchRecords)};\n`);
await writeText("catalog/task-browser.html", renderTaskBrowserHtml(taskIndex.generatedAt));
await writeJson("catalog/task-index.json", taskIndex);
await writeText("catalog/task-families.md", renderFamiliesMarkdown(taskIndex, adapters, localTasks, liveTasks, savedViews, taskBundles, provenanceIndex));

console.log(`NodeTasks catalog: ${searchableTasks.length} searchable tasks (${liveTasks.length} curated, ${extractedTasks.length} extracted), ${adapters.length} adapters, ${sourceFiles.length} files`);

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

function normalizeLiveTask(item) {
  return {
    id: item.id,
    kind: "curated-live",
    family: item.family,
    surface: item.surface,
    title: item.goal,
    goal: item.goal,
    persona: item.persona,
    route: item.route,
    setup: item.setup,
    steps: item.steps,
    assertions: item.assertions,
    artifacts: item.artifacts,
    sourceRefs: item.sourceRefs ?? [],
    tags: compact(["curated", item.risk, item.family, item.surface, item.persona]),
    timeoutMs: item.timeoutMs,
    officialScoreClaim: false
  };
}

async function buildExtractedTasks(sourceFiles, adapters, localTasks) {
  const tasks = [];
  tasks.push(...buildAdapterSearchTasks(adapters, localTasks));
  tasks.push(...await extractProdProxyMatrixTasks());
  tasks.push(...await extractFullSweepFamilyTasks());
  tasks.push(...await extractQaFeatureTasks());
  tasks.push(...await extractTestCaseTasks(sourceFiles));
  tasks.push(...await extractScenarioFileTasks(sourceFiles));
  tasks.push(...buildSourceReferenceTasks(sourceFiles));
  return dedupeTasks(tasks).sort((a, b) => a.id.localeCompare(b.id));
}

function buildAdapterSearchTasks(adapters, localTasks) {
  const tasks = [];
  for (const adapter of adapters) {
    tasks.push(searchTask({
      id: `adapter.${slug(adapter.id)}`,
      kind: "benchmark-adapter",
      family: "benchmark-adapter",
      surface: "ProofLoop",
      title: `${adapter.source?.name ?? adapter.id} benchmark proxy adapter`,
      goal: `Run the ${adapter.id} proxy adapter through NodeRoom product-path proof without claiming an official benchmark score.`,
      command: adapter.liveUserCommand,
      status: adapter.scoringMode,
      sourceRefs: [adapter.sourcePath],
      tags: compact([adapter.id, adapter.source?.name, adapter.scoringMode, "proxy", "adapter"])
    }));
  }
  for (const localTask of localTasks) {
    tasks.push(searchTask({
      id: `local-proxy.${slug(localTask.adapterId)}.${slug(localTask.taskId)}`,
      kind: "local-proxy-task",
      family: localTask.adapterId,
      surface: "ProofLoop",
      title: localTask.title,
      goal: localTask.userPrompt,
      status: localTask.workflowId,
      sourceRefs: [localTask.sourcePath],
      tags: compact([localTask.adapterId, localTask.taskId, localTask.workflowId, localTask.benchmarkMapping])
    }));
  }
  return tasks;
}

async function extractProdProxyMatrixTasks() {
  const sourcePath = join(upstreamRoot, "docs", "eval", "proofloop-prod-proxy-benchmark-matrix.json");
  if (!existsSync(sourcePath)) return [];
  const matrix = JSON.parse(await readFile(sourcePath, "utf8"));
  const sourceRef = rel(sourcePath);
  const models = Array.isArray(matrix.models) ? matrix.models : [];
  const modelCostById = new Map((matrix.modelSummaries ?? []).map((summary) => {
    const denominator = Math.max(1, Number(summary.prodAdapterSmokeTotal ?? summary.prodAdapterSmokePassed ?? 1));
    const value = Number(summary.estimatedCostUsdAtOpenRouterList ?? summary.measuredCostUsd);
    return [summary.modelId, Number.isFinite(value) ? value / denominator : null];
  }));
  const tasks = [];
  for (const family of matrix.families ?? []) {
    for (const target of family.tasks ?? []) {
      const familyId = target.familyId ?? family.id;
      const targetId = String(target.taskId ?? "task");
      const evidenceRefs = existingEvidenceRefs(target.evidence ?? []);
      tasks.push(searchTask({
        id: `benchmark-target.${slug(familyId)}.${slug(targetId)}`,
        kind: "benchmark-target",
        family: familyId,
        surface: "ProofLoop",
        title: `${family.title ?? familyId}: ${targetId}`,
        goal: target.title ?? `Run ${targetId} through ${family.title ?? familyId}.`,
        command: target.runner?.command,
        route: matrix.baseUrl,
        status: target.status,
        sourceRefs: [sourceRef, ...evidenceRefs],
        tags: compact([
          "prod-proxy-matrix",
          familyId,
          targetId,
          target.status,
          target.runner?.kind,
          target.prodLiveBrowserPassed ? "prod-live-passed" : "prod-live-pending",
          target.localLiveBrowserOnly ? "local-live-only" : undefined
        ]),
        metadata: {
          familyId,
          taskId: targetId,
          prodLiveBrowserPassed: Boolean(target.prodLiveBrowserPassed),
          localLiveBrowserOnly: Boolean(target.localLiveBrowserOnly),
          runner: target.runner?.kind,
          blockers: target.blockers ?? []
        }
      }));

      for (const modelId of models) {
        tasks.push(searchTask({
          id: `model-attempt.${slug(modelId)}.${slug(familyId)}.${slug(targetId)}`,
          kind: "model-attempt",
          family: familyId,
          surface: "ProofLoop",
          title: `${modelId} on ${family.title ?? familyId} / ${targetId}`,
          goal: `Run model ${modelId} on benchmark target ${targetId}: ${target.title ?? family.title ?? familyId}.`,
          command: target.runner?.command,
          route: matrix.baseUrl,
          status: target.status,
          sourceRefs: [sourceRef, ...evidenceRefs],
          tags: compact(["prod-proxy-model-matrix", modelId, familyId, targetId, target.status, target.runner?.kind]),
          metadata: {
            modelId,
            familyId,
            taskId: targetId,
            estimatedCostUsd: modelCostById.get(modelId),
            attemptSource: "derived from proofloop-prod-proxy-benchmark-matrix.models x families.tasks",
            officialScoreClaim: false
          }
        }));
      }
    }
  }
  return tasks;
}

async function extractFullSweepFamilyTasks() {
  const sourcePath = join(upstreamRoot, "docs", "eval", "proofloop-full-proxy-benchmark-sweep.json");
  if (!existsSync(sourcePath)) return [];
  const sweep = JSON.parse(await readFile(sourcePath, "utf8"));
  const sourceRef = rel(sourcePath);
  return (sweep.families ?? []).map((family) => searchTask({
    id: `benchmark-family.${slug(family.id)}`,
    kind: "benchmark-family",
    family: family.family ?? "benchmark-family",
    surface: "ProofLoop",
    title: family.title ?? family.id,
    goal: `${family.title ?? family.id}: ${family.taskTargetCount ?? family.taskCount ?? "unknown"} tracked target(s). ${family.status ?? ""}`.trim(),
    command: Array.isArray(family.runnableCommands) ? family.runnableCommands.join(" && ") : undefined,
    status: family.status,
    sourceRefs: [sourceRef, ...existingEvidenceRefs(family.evidence ?? [])],
    tags: compact(["full-proxy-sweep", family.id, family.family, family.status]),
    metadata: {
      taskTargetCount: family.taskTargetCount,
      stagedTaskCount: family.stagedTaskCount,
      prodLiveBrowserVerifiedTaskCount: family.prodLiveBrowserVerifiedTaskCount,
      localLiveBrowserVerifiedTaskCount: family.localLiveBrowserVerifiedTaskCount,
      officialScoredTaskCount: family.officialScoredTaskCount,
      blockers: family.blockers ?? []
    }
  }));
}

async function extractQaFeatureTasks() {
  const sourcePath = join(upstreamRoot, "docs", "qa", "production-matrix.json");
  if (!existsSync(sourcePath)) return [];
  const matrix = JSON.parse(await readFile(sourcePath, "utf8"));
  const sourceRef = rel(sourcePath);
  return (matrix.features ?? []).map((feature) => {
    const evidenceRefs = (feature.evidence ?? [])
      .map((entry) => typeof entry === "string" ? entry : entry.ref)
      .filter(Boolean)
      .flatMap((ref) => existingEvidenceRefs([ref]));
    return searchTask({
      id: `qa-feature.${slug(feature.id ?? feature.area ?? feature.claim)}`,
      kind: "qa-feature",
      family: "qa-production-matrix",
      surface: "NodeRoom QA",
      title: feature.area ?? feature.id,
      goal: feature.claim ?? feature.productionGate ?? feature.id,
      status: feature.status,
      sourceRefs: [sourceRef, ...evidenceRefs],
      tags: compact(["qa", "production-matrix", feature.id, feature.area, feature.status]),
      setup: feature.deterministicChecks ?? [],
      steps: feature.liveChecks ?? [],
      assertions: compact([feature.productionGate, feature.nextReview]),
      metadata: {
        deterministicChecks: feature.deterministicChecks ?? [],
        liveChecks: feature.liveChecks ?? [],
        nextReview: feature.nextReview
      }
    });
  });
}

async function extractTestCaseTasks(sourceFiles) {
  const candidates = sourceFiles.filter((file) =>
    /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(file.path) ||
    file.path.includes("/e2e/") ||
    file.path.includes("/proofloop/benchmarks/")
  );
  const tasks = [];
  for (const file of candidates) {
    if (!["ts", "tsx", "js", "mjs"].includes(file.ext)) continue;
    const absolute = join(root, file.path);
    const text = await readFile(absolute, "utf8");
    const re = /\b(?:test|it)\s*(?:\.\s*(?:skip|only|fixme|slow))?\s*\(\s*(['"`])((?:\\.|(?!\1)[\s\S]){1,260})\1/g;
    let match;
    let index = 0;
    while ((match = re.exec(text))) {
      const title = cleanInline(match[2]);
      if (!title || title.length < 3) continue;
      const line = lineNumberAt(text, match.index);
      tasks.push(searchTask({
        id: `testcase.${slug(file.path.replace(/^upstream\/noderoom\//, ""))}.${index}-${slug(title)}`,
        kind: file.path.includes("/e2e/") || file.path.includes("/proofloop/benchmarks/") ? "browser-test-case" : "unit-test-case",
        family: inferFamilyFromPath(file.path),
        surface: file.path.includes("/e2e/") || file.path.includes("/proofloop/benchmarks/") ? "Browser" : "NodeRoom test",
        title,
        goal: `Run or preserve test case "${title}" from ${file.path}:${line}.`,
        sourceRefs: [file.path],
        tags: compact(["test-case", file.category, file.ext, inferFamilyFromPath(file.path), `line-${line}`]),
        metadata: { line, bytes: file.bytes, sha256: file.sha256 }
      }));
      index += 1;
    }
  }
  return tasks;
}

async function extractScenarioFileTasks(sourceFiles) {
  const candidates = sourceFiles.filter((file) =>
    file.path.includes("/proofloop/") &&
    (file.path.includes("/scenarios/") || file.path.includes("/suites/") || file.path.includes("/rubrics/")) &&
    ["yaml", "yml", "json", "md"].includes(file.ext)
  );
  const tasks = [];
  for (const file of candidates) {
    const text = await readFile(join(root, file.path), "utf8");
    const label = firstConfigLabel(text) ?? file.path.split("/").pop();
    tasks.push(searchTask({
      id: `scenario-file.${slug(file.path.replace(/^upstream\/noderoom\//, ""))}`,
      kind: file.path.includes("/rubrics/") ? "rubric" : file.path.includes("/suites/") ? "suite" : "scenario",
      family: inferFamilyFromPath(file.path),
      surface: "ProofLoop",
      title: label,
      goal: `Use ${label} from ${file.path} as a proof-loop task/rubric source.`,
      sourceRefs: [file.path],
      tags: compact(["proofloop", file.category, file.ext, inferFamilyFromPath(file.path), label]),
      metadata: { bytes: file.bytes, sha256: file.sha256 }
    }));
  }
  return tasks;
}

function buildSourceReferenceTasks(sourceFiles) {
  return sourceFiles.map((file) => searchTask({
    id: `source.${slug(file.path.replace(/^upstream\/noderoom\//, ""))}`,
    kind: "source-reference",
    family: file.category,
    surface: "Source",
    title: file.path.replace(/^upstream\/noderoom\//, ""),
    goal: `Reference source file ${file.path} while researching or assembling a NodeTasks benchmark task.`,
    sourceRefs: [file.path],
    tags: compact(["source", file.category, file.ext]),
    metadata: { bytes: file.bytes, ext: file.ext, sha256: file.sha256 }
  }));
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

function renderFamiliesMarkdown(index, adapters, localTasks, tasks, savedViews, taskBundles, provenanceIndex) {
  const familyRows = Object.entries(index.families)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, count]) => `| ${family} | ${count} |`)
    .join("\n");
  const kindRows = Object.entries(index.kinds)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join("\n");
  const domainRows = Object.entries(index.domains)
    .sort(([a], [b]) => domainRank(a) - domainRank(b))
    .map(([domain, count]) => `| ${domain} | ${count} |`)
    .join("\n");
  const difficultyRows = Object.entries(index.difficultyTiers)
    .sort(([a], [b]) => difficultyTierRank(a) - difficultyTierRank(b))
    .map(([tier, count]) => `| ${tier} | ${count} |`)
    .join("\n");
  const costRows = Object.entries(index.costTiers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tier, count]) => `| ${tier} | ${count} |`)
    .join("\n");
  const adapterRows = adapters
    .map((adapter) => `| ${adapter.id} | ${adapter.source?.name ?? ""} | ${adapter.scoringMode} | ${adapter.liveUserCommand ?? ""} |`)
    .join("\n");
  const localRows = localTasks
    .map((task) => `| ${task.adapterId} | ${task.taskId} | ${task.title} | false |`)
    .join("\n");
  const savedViewRows = savedViews.views
    .map((view) => `| ${view.id} | ${view.persona} | ${view.count} | ${view.sort} | ${view.query} |`)
    .join("\n");
  const bundleRows = taskBundles.bundles
    .map((bundle) => `| ${bundle.id} | ${bundle.persona} | ${bundle.taskCount} | ${bundle.estimatedStepTotal} | ${bundle.maxDifficultyScore} |`)
    .join("\n");
  const verifierRows = Object.entries(provenanceIndex.verifierTypes)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `| ${type} | ${count} |`)
    .join("\n");
  const scoreRows = Object.entries(provenanceIndex.scoreStatuses)
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => `| ${status} | ${count} |`)
    .join("\n");
  const examples = tasks.slice(0, 12).map((task) => `- \`${task.id}\`: ${task.goal}`).join("\n");
  return `# NodeTasks Catalog\n\nGenerated: ${index.generatedAt}\n\n## Summary\n\n- Searchable tasks: ${index.summary.searchableTasks}\n- Curated live interaction tasks: ${index.summary.liveInteractionTasks}\n- Extracted tasks: ${index.summary.extractedTasks}\n- Benchmark proxy adapters: ${index.summary.benchmarkProxyAdapters}\n- External local proxy tasks: ${index.summary.externalLocalProxyTasks}\n- Saved views: ${index.summary.savedViews}\n- Task bundles: ${index.summary.taskBundles}\n- Source files: ${index.summary.sourceFiles}\n\n## Domains\n\n| Domain | Tasks |\n| --- | ---: |\n${domainRows}\n\n## Difficulty Tiers\n\n| Difficulty | Tasks |\n| --- | ---: |\n${difficultyRows}\n\n## Cost Tiers\n\n| Cost | Tasks |\n| --- | ---: |\n${costRows}\n\n## Task Kinds\n\n| Kind | Tasks |\n| --- | ---: |\n${kindRows}\n\n## Task Families\n\n| Family | Tasks |\n| --- | ---: |\n${familyRows}\n\n## Saved Views\n\n| View | Persona | Tasks | Sort | Query |\n| --- | --- | ---: | --- | --- |\n${savedViewRows}\n\n## Shareable Task Bundles\n\n| Bundle | Persona | Tasks | Estimated steps | Max difficulty score |\n| --- | --- | ---: | ---: | ---: |\n${bundleRows}\n\n## Provenance\n\n| Verifier type | Tasks |\n| --- | ---: |\n${verifierRows}\n\n| Score status | Tasks |\n| --- | ---: |\n${scoreRows}\n\n## Benchmark Proxy Adapters\n\n| Adapter | Source | Scoring | Live command |\n| --- | --- | --- | --- |\n${adapterRows}\n\n## External Local Proxy Tasks\n\n| Adapter | Task | Title | Official score claim |\n| --- | --- | --- | --- |\n${localRows}\n\n## Example Curated Live Tasks\n\n${examples}\n\n## Search Surfaces\n\n- \`catalog/all-tasks.json\`: normalized task objects with rank, curation, and provenance metadata.\n- \`catalog/ranked-tasks.json\`: same task set sorted by domain, difficulty, cost, and steps.\n- \`catalog/hierarchy.json\`: domain > difficulty > cost hierarchy.\n- \`catalog/tag-index.json\`: ranked tags with domain, kind, difficulty, and cost counts.\n- \`catalog/saved-views.json\`: reusable search views for common personas.\n- \`catalog/task-bundles.json\`: shareable ranked bundles from the saved views.\n- \`catalog/provenance-index.json\`: verifier type, source kind, suite lineage, and score-boundary rollups.\n- \`catalog/search-index.jsonl\`: one searchable JSON record per task.\n- \`catalog/task-browser.html\`: local browser search UI.\n- \`npm run search -- <query>\`: CLI search.\n- \`npm run streamlit\`: interactive Streamlit explorer and NodeAgent catalog chat.\n\n## Contract\n\nEvery task should preserve product-path proof separately from official benchmark scoring. A proxy task can pass its product UI proof while still recording \`officialScoreClaim: false\` until an upstream verifier accepts the artifacts.\n`;
}

function searchTask(input) {
  return {
    id: input.id,
    kind: input.kind,
    family: input.family ?? "uncategorized",
    surface: input.surface ?? "Unknown",
    title: input.title ?? input.goal ?? input.id,
    goal: input.goal ?? input.title ?? input.id,
    persona: input.persona,
    route: input.route,
    setup: input.setup ?? [],
    steps: input.steps ?? [],
    assertions: input.assertions ?? [],
    artifacts: input.artifacts ?? [],
    command: input.command,
    status: input.status,
    sourceRefs: [...new Set((input.sourceRefs ?? []).filter(Boolean))],
    tags: [...new Set(compact(input.tags ?? []))],
    metadata: input.metadata ?? {},
    officialScoreClaim: false
  };
}

function rankTasks(tasks) {
  return tasks.map((task) => {
    const domain = inferDomain(task);
    const steps = estimateSteps(task);
    const cost = estimateCost(task);
    const difficulty = estimateDifficulty(task, steps, cost.rank);
    const topTags = rankTags(task, domain);
    const domainRank = DOMAIN_ORDER.indexOf(domain.domain) >= 0 ? DOMAIN_ORDER.indexOf(domain.domain) + 1 : DOMAIN_ORDER.length + 1;
    const kindRank = KIND_DIFFICULTY_WEIGHT[task.kind] ?? 4;
    const personaFit = inferPersonaFit(task, domain, difficulty.tier);
    const provenance = inferProvenance(task, domain);
    return {
      ...task,
      curation: curateTask(task, domain, difficulty, cost, personaFit),
      provenance,
      rank: {
        domain: domain.domain,
        subdomain: domain.subdomain,
        domainPath: [domain.domain, domain.subdomain].filter(Boolean),
        domainRank,
        estimatedSteps: steps,
        stepTier: tierSteps(steps),
        costTier: cost.tier,
        costRank: cost.rank,
        estimatedCostUsd: cost.estimatedUsd,
        costBasis: cost.basis,
        difficultyScore: difficulty.score,
        difficultyTier: difficulty.tier,
        difficultyReasons: difficulty.reasons,
        kindRank,
        topTags,
        personaFit,
        sortScore: domainRank * 1000000 + difficulty.score * 1000 + cost.rank * 100 + steps
      }
    };
  }).sort((a, b) => a.rank.sortScore - b.rank.sortScore || a.id.localeCompare(b.id));
}

function curateTask(task, domain, difficulty, cost, personaFit) {
  const kindName = task.kind.replace(/-/g, " ");
  const domainLabel = `${domain.domain}${domain.subdomain ? ` / ${domain.subdomain}` : ""}`;
  const scoreBoundary = task.officialScoreClaim === false
    ? "Treat this as product-path or catalog proof unless an official verifier receipt is attached."
    : "Official-score claims require the referenced verifier receipt.";
  const firstRun = firstRunGuidance(task);
  const caution = cost.rank >= 4
    ? "Budget or provider setup may be required before running this task."
    : "This is a low-cost starting point for local review or planning.";
  return {
    summary: `${task.title} is a ${kindName} in ${domainLabel}. ${task.goal}`,
    whyItMatters: whyTaskMatters(task, domain),
    firstRun,
    caution,
    scoreBoundary,
    recommendedFor: personaFit,
    quality: "curated-template-v2"
  };
}

function whyTaskMatters(task, domain) {
  if (task.kind === "model-attempt") return "It turns a model, benchmark family, and task target into a searchable run candidate with cost and proof-boundary context.";
  if (task.kind === "curated-live") return "It names a user-visible workflow that should be tested through the product surface, not by replacing the behavior with a mock.";
  if (task.kind === "browser-test-case") return "It maps directly to a browser-level regression surface future contributors can reproduce.";
  if (task.kind === "benchmark-adapter" || task.kind === "local-proxy-task") return "It keeps proxy adapter proof separate from official benchmark scoring.";
  if (task.kind === "source-reference") return "It is useful for orientation, provenance lookup, and building a focused task bundle.";
  if (domain.domain === "ProofLoop Governance") return "It protects the boundary between exploration, product proof, and certification.";
  return "It is a source-backed task candidate that future users can search, rank, and cite.";
}

function firstRunGuidance(task) {
  if (task.command) return `Start with the recorded command: ${task.command}`;
  if (task.kind === "source-reference") return "Open the cited source file first, then follow nearby tests or docs.";
  if (task.kind === "model-attempt") return "Run a small representative attempt before broadening the matrix.";
  if (task.kind === "browser-test-case" || task.kind === "curated-live") return "Start the relevant demo or production-safe harness, then capture the listed proof artifacts.";
  return "Inspect the source refs, then run the closest deterministic test or proof command.";
}

function inferProvenance(task, domain) {
  const refs = task.sourceRefs ?? [];
  const text = searchableText(task).toLowerCase();
  const suiteLineage = inferSuiteLineage(refs, task);
  const verifierType = inferVerifierType(task, text);
  const scoreStatus = task.officialScoreClaim
    ? "official-claim-recorded"
    : hasAny(text, ["official", "scorer", "verifier", "leaderboard"])
      ? "official-boundary-blocked"
      : "no-official-score-claim";
  return {
    suiteLineage,
    primarySuite: suiteLineage[0] ?? domain.subdomain ?? task.family,
    verifierType,
    scoreStatus,
    productPathCompletion: verifierType === "source-reference" ? "not-applicable" : "requires-run-receipt",
    officialSemanticScore: task.officialScoreClaim ? "claimed-with-receipt" : "not-claimed",
    sourceCount: refs.length,
    sourceKinds: inferSourceKinds(refs),
    receiptExpectations: expectedReceipts(task, verifierType)
  };
}

function inferSuiteLineage(refs, task) {
  const lineage = new Set();
  for (const ref of refs) {
    const normalized = ref.replace(/\\/g, "/");
    const benchmark = normalized.match(/proofloop\/benchmarks\/([^/]+)/);
    if (benchmark) lineage.add(`proofloop/benchmarks/${benchmark[1]}`);
    const proofloop = normalized.match(/proofloop\/([^/]+)/);
    if (proofloop && proofloop[1] !== "benchmarks") lineage.add(`proofloop/${proofloop[1]}`);
    if (normalized.includes("/tests/")) lineage.add("noderoom/tests");
    if (normalized.includes("/src/nodeagent/")) lineage.add("noderoom/src/nodeagent");
    if (normalized.includes("/convex/")) lineage.add("noderoom/convex");
    if (normalized.includes("/noderl/")) lineage.add("noderl");
  }
  if (!lineage.size && task.family) lineage.add(task.family);
  return [...lineage];
}

function inferVerifierType(task, text) {
  if (task.kind === "source-reference") return "source-reference";
  if (task.kind === "model-attempt") return "model-proxy-receipt";
  if (hasAny(text, ["playwright", "browser", "live room", "screenshot"])) return "browser-proof";
  if (hasAny(text, ["official scorer", "verifier", "scorecard", "receipt"])) return "verifier-receipt";
  if (hasAny(text, ["rubric", "scenario", "yaml"])) return "rubric-scenario";
  if (task.kind.includes("test")) return "deterministic-test";
  if (task.kind.includes("adapter") || task.kind.includes("proxy")) return "proxy-adapter-contract";
  return "catalog-derived";
}

function inferSourceKinds(refs) {
  const kinds = new Set();
  for (const ref of refs) {
    if (/\.(test|spec)\.(ts|tsx|js|mjs)$/.test(ref)) kinds.add("test");
    else if (/\.ya?ml$/.test(ref)) kinds.add("yaml");
    else if (/\.json$/.test(ref)) kinds.add("json");
    else if (/\.md$/.test(ref)) kinds.add("docs");
    else if (/\.(ts|tsx|js|mjs)$/.test(ref)) kinds.add("source");
    else kinds.add("asset");
  }
  return [...kinds];
}

function expectedReceipts(task, verifierType) {
  const receipts = new Set(task.artifacts ?? []);
  if (verifierType === "browser-proof") {
    receipts.add("browser screenshot");
    receipts.add("live-user-contract.json");
  }
  if (verifierType === "verifier-receipt" || verifierType === "model-proxy-receipt") {
    receipts.add("scorecard.md");
    receipts.add("verifier-receipt.json");
    receipts.add("cost-ledger.json");
  }
  if (task.kind === "source-reference") receipts.add("source ref");
  return [...receipts].slice(0, 12);
}

function inferDomain(task) {
  const text = searchableText(task).toLowerCase();
  if (hasAny(text, ["spreadsheetbench", "spreadsheet", "workbook", "excel", "xlsx", "sheet", "formula", "vba", "csv"])) {
    return { domain: "Spreadsheet & Office Automation", subdomain: task.family.includes("spreadsheetbench") ? task.family : "spreadsheet-workflows" };
  }
  if (hasAny(text, ["bankertoolbench", "banker", "finch", "finance", "credit", "underwriting", "proximitty", "sec-xbrl", "xbrl", "runway", "revenue", "q3 variance"])) {
    return { domain: "Banking & Finance", subdomain: task.family };
  }
  if (hasAny(text, ["finauditing", "audit", "risk", "compliance", "misstatement", "evidence", "privacy", "governance"])) {
    return { domain: "Audit, Risk & Compliance", subdomain: task.family };
  }
  if (hasAny(text, ["nodeagent", "agent", "model-attempt", "model ", "frame", "trace", "tool", "retrieval", "provider", "llm"])) {
    return { domain: "Agent Runtime & NodeAgent", subdomain: task.family };
  }
  if (hasAny(text, ["chat", "room", "multi-user", "presence", "notebook", "graph", "voice", "upload", "command-palette", "left rail", "public", "private"])) {
    return { domain: "Collaboration & Room UX", subdomain: task.family };
  }
  if (hasAny(text, ["proofloop", "noderl", "regression", "doctrine", "benchmark", "gate", "qa-feature", "scorer", "verifier"])) {
    return { domain: "ProofLoop Governance", subdomain: task.family };
  }
  if (hasAny(text, ["dataset", "document", "pdf", "source", "citation", "capture", "parser", "embedding"])) {
    return { domain: "Data, Documents & Retrieval", subdomain: task.family };
  }
  return { domain: "Source & Infrastructure", subdomain: task.family };
}

function estimateSteps(task) {
  const explicit = [
    ...(task.setup ?? []),
    ...(task.steps ?? []),
    ...(task.assertions ?? []),
    ...(task.artifacts ?? [])
  ].filter(Boolean).length;
  let steps = Math.max(explicit, KIND_BASE_STEPS[task.kind] ?? 3);
  if (task.command) steps += 1;
  if (task.route && String(task.route).includes("http")) steps += 1;
  if (task.metadata?.blockers?.length) steps += 1;
  if (task.kind === "model-attempt" && task.metadata?.modelId) steps += 1;
  return Math.min(24, Math.max(1, steps));
}

function estimateCost(task) {
  const explicit = Number(task.metadata?.estimatedCostUsd);
  if (Number.isFinite(explicit) && explicit > 0) {
    return costFromUsd(explicit, "matrix model cost hint");
  }
  const text = searchableText(task).toLowerCase();
  if (task.kind === "source-reference" || task.kind === "unit-test-case" || task.kind === "rubric" || task.kind === "scenario" || task.kind === "suite") {
    return { tier: "free-static", rank: 1, estimatedUsd: 0, basis: "static catalog/test asset" };
  }
  if (hasAny(text, ["prod", "live", "provider", "openrouter", "openai", "anthropic", "gemini", "model-attempt"])) {
    return { tier: task.kind === "model-attempt" ? "provider-variable" : "external-variable", rank: task.kind === "model-attempt" ? 4 : 5, estimatedUsd: null, basis: "requires provider, deployment, or external scorer" };
  }
  if (hasAny(text, ["browser", "playwright", "streamlit", "localhost"])) {
    return { tier: "local-runtime", rank: 2, estimatedUsd: 0, basis: "local browser/runtime only" };
  }
  return { tier: "free-static", rank: 1, estimatedUsd: 0, basis: "static catalog asset" };
}

function costFromUsd(value, basis) {
  if (value <= 0.02) return { tier: "provider-low", rank: 3, estimatedUsd: roundUsd(value), basis };
  if (value <= 0.12) return { tier: "provider-medium", rank: 4, estimatedUsd: roundUsd(value), basis };
  return { tier: "provider-high", rank: 5, estimatedUsd: roundUsd(value), basis };
}

function estimateDifficulty(task, steps, costRank) {
  const text = searchableText(task).toLowerCase();
  const reasons = [];
  let score = steps * 2 + (KIND_DIFFICULTY_WEIGHT[task.kind] ?? 4) * 3 + costRank * 2;
  if (hasAny(text, ["prod", "live", "deployment", "external", "official", "scorer"])) {
    score += 8;
    reasons.push("external or production dependency");
  }
  if (task.kind === "model-attempt") {
    score += 6;
    reasons.push("model routing and cost tracking");
  }
  if (task.kind === "benchmark-target" || task.kind === "benchmark-family") {
    score += 5;
    reasons.push("benchmark harness coordination");
  }
  if (task.metadata?.blockers?.length) {
    score += Math.min(10, task.metadata.blockers.length * 2);
    reasons.push("recorded blocker(s)");
  }
  if ((task.sourceRefs ?? []).length >= 4) {
    score += 3;
    reasons.push("multi-file evidence trail");
  }
  if (hasAny(text, ["privacy", "approval", "cas", "lock", "reconciliation", "underwriting", "audit"])) {
    score += 4;
    reasons.push("governed workflow");
  }
  const tier = score < 22 ? "intro" : score < 42 ? "intermediate" : score < 64 ? "advanced" : "expert";
  return { score, tier, reasons: reasons.length ? reasons : ["inferred from kind and step count"] };
}

function tierSteps(steps) {
  if (steps <= 2) return "1-2";
  if (steps <= 5) return "3-5";
  if (steps <= 9) return "6-9";
  return "10+";
}

function rankTags(task, domain) {
  const weighted = new Map();
  const add = (tag, weight) => {
    if (!tag) return;
    const key = String(tag).trim();
    if (!key) return;
    weighted.set(key, (weighted.get(key) ?? 0) + weight);
  };
  add(domain.domain, 8);
  add(domain.subdomain, 6);
  add(task.kind, 5);
  add(task.family, 4);
  add(task.surface, 3);
  for (const tag of task.tags ?? []) add(tag, 2);
  for (const ref of task.sourceRefs ?? []) {
    const parts = ref.split("/");
    add(parts[2], 1);
    add(parts[3], 1);
  }
  return [...weighted.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag]) => tag);
}

function inferPersonaFit(task, domain, difficultyTier) {
  const fits = new Set();
  const text = searchableText(task).toLowerCase();
  if (domain.domain === "Spreadsheet & Office Automation") fits.add("spreadsheet builder");
  if (domain.domain === "Banking & Finance") fits.add("finance analyst");
  if (domain.domain === "Audit, Risk & Compliance") fits.add("risk reviewer");
  if (domain.domain === "Agent Runtime & NodeAgent") fits.add("agent engineer");
  if (domain.domain === "Collaboration & Room UX") fits.add("product QA");
  if (domain.domain === "ProofLoop Governance") fits.add("benchmark maintainer");
  if (task.kind === "model-attempt") fits.add("model evaluator");
  if (task.kind.includes("test")) fits.add("test engineer");
  if (task.kind === "source-reference") fits.add("repo explorer");
  if (hasAny(text, ["streamlit", "browser", "ui", "graph"])) fits.add("demo builder");
  if (difficultyTier === "intro") fits.add("new contributor");
  return [...fits];
}

function buildTaskHierarchy(tasks) {
  const domains = [];
  const byDomain = groupBy(tasks, (task) => task.rank.domain);
  for (const [domain, domainTasks] of Object.entries(byDomain).sort(([a], [b]) => domainRank(a) - domainRank(b))) {
    const difficultyGroups = [];
    const byDifficulty = groupBy(domainTasks, (task) => task.rank.difficultyTier);
    for (const tier of ["intro", "intermediate", "advanced", "expert"]) {
      const tierTasks = byDifficulty[tier] ?? [];
      if (!tierTasks.length) continue;
      const costGroups = [];
      const byCost = groupBy(tierTasks, (task) => task.rank.costTier);
      for (const [costTier, costTasks] of Object.entries(byCost).sort(([, a], [, b]) => (a[0]?.rank.costRank ?? 0) - (b[0]?.rank.costRank ?? 0))) {
        costGroups.push({
          costTier,
          count: costTasks.length,
          families: countBy(costTasks, (task) => task.family),
          tasks: costTasks.slice(0, 200).map(compactTask)
        });
      }
      difficultyGroups.push({ difficultyTier: tier, count: tierTasks.length, costGroups });
    }
    domains.push({
      domain,
      count: domainTasks.length,
      subdomains: countBy(domainTasks, (task) => task.rank.subdomain),
      difficultyGroups
    });
  }
  return {
    counts: {
      domains: domains.length,
      tasks: tasks.length,
      difficultyTiers: countBy(tasks, (task) => task.rank.difficultyTier),
      costTiers: countBy(tasks, (task) => task.rank.costTier)
    },
    domains
  };
}

function buildTagIndex(tasks) {
  const tags = new Map();
  for (const task of tasks) {
    for (const tag of [...(task.rank.topTags ?? []), ...(task.tags ?? [])]) {
      const key = String(tag).trim();
      if (!key) continue;
      const entry = tags.get(key) ?? {
        tag: key,
        count: 0,
        domains: {},
        kinds: {},
        difficultyTiers: {},
        costTiers: {},
        sampleTaskIds: []
      };
      entry.count += 1;
      entry.domains[task.rank.domain] = (entry.domains[task.rank.domain] ?? 0) + 1;
      entry.kinds[task.kind] = (entry.kinds[task.kind] ?? 0) + 1;
      entry.difficultyTiers[task.rank.difficultyTier] = (entry.difficultyTiers[task.rank.difficultyTier] ?? 0) + 1;
      entry.costTiers[task.rank.costTier] = (entry.costTiers[task.rank.costTier] ?? 0) + 1;
      if (entry.sampleTaskIds.length < 100) entry.sampleTaskIds.push(task.id);
      tags.set(key, entry);
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function buildSavedViews(tasks) {
  return {
    views: SAVED_VIEW_DEFINITIONS.map((view) => {
      const matches = sortForView(tasks.filter((task) => matchesSavedView(task, view)), view.sort);
      const sample = matches.slice(0, 25).map(compactTask);
      return {
        ...view,
        count: matches.length,
        sampleTaskIds: matches.slice(0, 100).map((task) => task.id),
        sampleTasks: sample
      };
    })
  };
}

function buildTaskBundles(tasks, views) {
  return {
    bundles: views.map((view) => {
      const matches = sortForView(tasks.filter((task) => matchesSavedView(task, view)), view.sort).slice(0, 60);
      return {
        id: view.id,
        title: view.title,
        persona: view.persona,
        description: view.description,
        sort: view.sort,
        query: view.query,
        taskCount: matches.length,
        estimatedStepTotal: matches.reduce((sum, task) => sum + task.rank.estimatedSteps, 0),
        maxDifficultyScore: Math.max(0, ...matches.map((task) => task.rank.difficultyScore)),
        costTiers: countBy(matches, (task) => task.rank.costTier),
        domains: countBy(matches, (task) => task.rank.domain),
        taskIds: matches.map((task) => task.id),
        tasks: matches.map(compactTask)
      };
    })
  };
}

function matchesSavedView(task, view) {
  const filters = view.filters ?? {};
  if (filters.domain && task.rank.domain !== filters.domain) return false;
  if (filters.kind && !asArray(filters.kind).includes(task.kind)) return false;
  if (filters.maxDifficulty && difficultyTierRank(task.rank.difficultyTier) > difficultyTierRank(filters.maxDifficulty)) return false;
  if (filters.maxCostRank && Number(task.rank.costRank ?? 99) > Number(filters.maxCostRank)) return false;
  if (filters.tag) {
    const tags = [...(task.rank.topTags ?? []), ...(task.tags ?? [])].join(" ").toLowerCase();
    if (!tags.includes(String(filters.tag).toLowerCase())) return false;
  }
  const terms = tokenizeSearch(view.query);
  if (!terms.length) return true;
  const text = searchableText(task).toLowerCase();
  return terms.some((term) => text.includes(term));
}

function sortForView(tasks, sort) {
  return [...tasks].sort((a, b) => {
    if (sort === "cost") return a.rank.costRank - b.rank.costRank || nullLast(a.rank.estimatedCostUsd) - nullLast(b.rank.estimatedCostUsd) || a.rank.sortScore - b.rank.sortScore || a.id.localeCompare(b.id);
    if (sort === "difficulty") return a.rank.difficultyScore - b.rank.difficultyScore || a.rank.costRank - b.rank.costRank || a.id.localeCompare(b.id);
    if (sort === "difficulty-desc") return b.rank.difficultyScore - a.rank.difficultyScore || a.rank.costRank - b.rank.costRank || a.id.localeCompare(b.id);
    if (sort === "domain") return a.rank.sortScore - b.rank.sortScore || a.id.localeCompare(b.id);
    return a.rank.sortScore - b.rank.sortScore || a.id.localeCompare(b.id);
  });
}

function buildProvenanceIndex(tasks) {
  const verifierTypes = countBy(tasks, (task) => task.provenance.verifierType);
  const scoreStatuses = countBy(tasks, (task) => task.provenance.scoreStatus);
  const primarySuites = countBy(tasks, (task) => task.provenance.primarySuite);
  const sourceKinds = {};
  for (const task of tasks) {
    for (const kind of task.provenance.sourceKinds ?? []) sourceKinds[kind] = (sourceKinds[kind] ?? 0) + 1;
  }
  const samplesByVerifierType = {};
  for (const task of tasks) {
    const verifierType = task.provenance.verifierType;
    (samplesByVerifierType[verifierType] ??= []);
    if (samplesByVerifierType[verifierType].length < 25) samplesByVerifierType[verifierType].push(compactTask(task));
  }
  return {
    counts: {
      tasks: tasks.length,
      verifierTypes: Object.keys(verifierTypes).length,
      scoreStatuses: Object.keys(scoreStatuses).length,
      primarySuites: Object.keys(primarySuites).length
    },
    verifierTypes,
    scoreStatuses,
    primarySuites,
    sourceKinds,
    samplesByVerifierType
  };
}

function compactTask(task) {
  return {
    id: task.id,
    title: task.title,
    kind: task.kind,
    family: task.family,
    domain: task.rank.domain,
    subdomain: task.rank.subdomain,
    steps: task.rank.estimatedSteps,
    costTier: task.rank.costTier,
    difficultyTier: task.rank.difficultyTier,
    difficultyScore: task.rank.difficultyScore,
    verifierType: task.provenance?.verifierType,
    scoreStatus: task.provenance?.scoreStatus,
    topTags: task.rank.topTags.slice(0, 6)
  };
}

function toSearchRecord(task) {
  const searchable = [
    task.id,
    task.kind,
    task.family,
    task.surface,
    task.title,
    task.goal,
    task.persona,
    task.route,
    task.command,
    task.status,
    ...(task.setup ?? []),
    ...(task.steps ?? []),
    ...(task.assertions ?? []),
    ...(task.artifacts ?? []),
    ...(task.sourceRefs ?? []),
    ...(task.tags ?? []),
    JSON.stringify(task.metadata ?? {})
  ].filter(Boolean).join(" ");
  return {
    id: task.id,
    kind: task.kind,
    family: task.family,
    surface: task.surface,
    title: task.title,
    goal: task.goal,
    status: task.status,
    command: task.command,
    sourceRefs: task.sourceRefs,
    tags: task.tags,
    rank: task.rank,
    curation: task.curation,
    provenance: task.provenance,
    officialScoreClaim: false,
    text: searchable
  };
}

function dedupeTasks(tasks) {
  const seen = new Map();
  for (const item of tasks) {
    if (!item.id || seen.has(item.id)) continue;
    seen.set(item.id, item);
  }
  return [...seen.values()];
}

function existingEvidenceRefs(refs) {
  const out = [];
  for (const ref of refs) {
    if (typeof ref !== "string" || !ref.trim()) continue;
    const normalized = ref.replace(/\\/g, "/");
    const candidates = normalized.startsWith("upstream/")
      ? [join(root, normalized)]
      : [join(upstreamRoot, normalized), join(root, normalized)];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (found) out.push(rel(found));
  }
  return [...new Set(out)];
}

function inferFamilyFromPath(path) {
  const normalized = path.replace(/\\/g, "/");
  const benchmark = normalized.match(/proofloop\/benchmarks\/([^/]+)/);
  if (benchmark) return benchmark[1];
  const proofloop = normalized.match(/proofloop\/([^/]+)/);
  if (proofloop) return proofloop[1];
  if (normalized.includes("spreadsheet")) return "spreadsheet";
  if (normalized.includes("banker") || normalized.includes("btb")) return "bankertoolbench";
  if (normalized.includes("nodeagent") || normalized.includes("agent")) return "nodeagent";
  if (normalized.includes("trace")) return "trace";
  if (normalized.includes("notebook")) return "notebook";
  if (normalized.includes("graph")) return "graph";
  if (normalized.includes("chat")) return "chat";
  if (normalized.includes("voice")) return "voice";
  if (normalized.includes("/e2e/")) return "e2e";
  if (normalized.includes("/tests/")) return "unit";
  return categorize(normalized);
}

function firstConfigLabel(text) {
  const match = text.match(/^\s*(?:id|name|title|scenario|description):\s*["']?(.+?)["']?\s*$/m);
  return match ? cleanInline(match[1]) : undefined;
}

function cleanInline(value) {
  return String(value)
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\$\{[^}]+\}/g, "")
    .trim()
    .slice(0, 240);
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function slug(value) {
  const out = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
  return out || "item";
}

function compact(items) {
  return items
    .flat()
    .filter((item) => item !== undefined && item !== null && String(item).trim())
    .map((item) => String(item).trim());
}

function searchableText(task) {
  return [
    task.id,
    task.kind,
    task.family,
    task.surface,
    task.title,
    task.goal,
    task.persona,
    task.route,
    task.command,
    task.status,
    ...(task.setup ?? []),
    ...(task.steps ?? []),
    ...(task.assertions ?? []),
    ...(task.artifacts ?? []),
    ...(task.sourceRefs ?? []),
    ...(task.tags ?? []),
    JSON.stringify(task.metadata ?? {})
  ].filter(Boolean).join(" ");
}

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function groupBy(items, keyOf) {
  return items.reduce((acc, item) => {
    const key = keyOf(item) || "uncategorized";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

function domainRank(domain) {
  const index = DOMAIN_ORDER.indexOf(domain);
  return index >= 0 ? index + 1 : DOMAIN_ORDER.length + 1;
}

function difficultyTierRank(tier) {
  return { intro: 1, intermediate: 2, advanced: 3, expert: 4 }[tier] ?? 99;
}

function tokenizeSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9_.:/-]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function asArray(value) {
  return Array.isArray(value) ? value : [value].filter(Boolean);
}

function nullLast(value) {
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function roundUsd(value) {
  return Math.round(value * 1000000) / 1000000;
}

function renderTaskBrowserHtml(generatedAt) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NodeTasks Search</title>
  <script src="./search-index.js"></script>
  <style>
    :root { color-scheme: dark; --bg: #090b0d; --panel: #101418; --line: #252b31; --text: #edf2f7; --muted: #8f9aa6; --accent: #f28b68; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: var(--bg); color: var(--text); }
    .shell { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    aside { border-right: 1px solid var(--line); padding: 18px; background: #0b0e11; position: sticky; top: 0; height: 100vh; overflow: auto; }
    main { padding: 18px 22px 48px; }
    h1 { margin: 0 0 6px; font-size: 18px; }
    .meta { color: var(--muted); font-size: 12px; line-height: 1.5; }
    input, select { width: 100%; margin-top: 12px; border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 8px; padding: 10px 11px; font-size: 14px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
    button { border: 1px solid var(--line); background: #111820; color: var(--text); border-radius: 999px; padding: 5px 9px; cursor: pointer; font-size: 12px; }
    button:hover { border-color: var(--accent); }
    .bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; color: var(--muted); font-size: 13px; }
    .result { border-top: 1px solid var(--line); padding: 14px 0; }
    .result h2 { margin: 0 0 6px; font-size: 15px; }
    .result p { margin: 4px 0; color: #c9d2dc; line-height: 1.45; }
    .row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; color: var(--muted); font-size: 12px; }
    code { color: #9dc3ff; background: #111820; border: 1px solid var(--line); padding: 1px 5px; border-radius: 5px; }
    .tag { color: #ffba9f; }
    @media (max-width: 820px) { .shell { grid-template-columns: 1fr; } aside { position: relative; height: auto; } }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <h1>NodeTasks</h1>
      <div class="meta">Generated ${generatedAt}<br><span id="count"></span></div>
      <input id="query" placeholder="Search graph, nodeagent, spreadsheetbench, trace..." autofocus />
      <select id="kind"><option value="">All kinds</option></select>
      <select id="family"><option value="">All families</option></select>
      <div class="chips" id="quick"></div>
    </aside>
    <main>
      <div class="bar"><span id="summary"></span><span>Open locally or serve this folder; no backend needed.</span></div>
      <div id="results"></div>
    </main>
  </div>
  <script>
    const records = window.NODETASKS_SEARCH_INDEX || [];
    const q = document.getElementById("query");
    const kind = document.getElementById("kind");
    const family = document.getElementById("family");
    const results = document.getElementById("results");
    const summary = document.getElementById("summary");
    document.getElementById("count").textContent = records.length.toLocaleString() + " searchable tasks";
    for (const value of [...new Set(records.map(r => r.kind).filter(Boolean))].sort()) kind.append(new Option(value, value));
    for (const value of [...new Set(records.map(r => r.family).filter(Boolean))].sort()) family.append(new Option(value, value));
    for (const value of ["nodeagent", "graph", "spreadsheetbench", "bankertoolbench", "trace", "notebook", "streamlit", "model-attempt"]) {
      const b = document.createElement("button");
      b.textContent = value;
      b.onclick = () => { q.value = value; render(); };
      document.getElementById("quick").append(b);
    }
    function score(record, terms) {
      if (!terms.length) return 1;
      const hay = (record.text || "").toLowerCase();
      let total = 0;
      for (const term of terms) {
        if (record.id.toLowerCase().includes(term)) total += 8;
        if ((record.title || "").toLowerCase().includes(term)) total += 6;
        if ((record.goal || "").toLowerCase().includes(term)) total += 4;
        if (hay.includes(term)) total += 1;
      }
      return total;
    }
    function render() {
      const terms = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
      const kindValue = kind.value;
      const familyValue = family.value;
      const ranked = records
        .filter(r => !kindValue || r.kind === kindValue)
        .filter(r => !familyValue || r.family === familyValue)
        .map(r => ({ r, s: score(r, terms) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s || a.r.id.localeCompare(b.r.id))
        .slice(0, 200);
      summary.textContent = ranked.length.toLocaleString() + " shown";
      results.innerHTML = ranked.map(({ r, s }) => '<article class="result">' +
        '<div class="row"><code>' + escapeHtml(r.id) + '</code><span>' + escapeHtml(r.kind) + '</span><span>' + escapeHtml(r.family) + '</span><span>score ' + s + '</span></div>' +
        '<h2>' + escapeHtml(r.title || r.id) + '</h2>' +
        '<p>' + escapeHtml(r.goal || '') + '</p>' +
        '<div class="row">' + (r.tags || []).slice(0, 8).map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join(' ') + '</div>' +
        '<div class="row">' + (r.sourceRefs || []).slice(0, 4).map(x => '<code>' + escapeHtml(x) + '</code>').join(' ') + '</div>' +
      '</article>').join('');
    }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }
    q.addEventListener("input", render);
    kind.addEventListener("change", render);
    family.addEventListener("change", render);
    render();
  </script>
</body>
</html>
`;
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
