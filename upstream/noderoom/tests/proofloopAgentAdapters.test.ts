import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildAgentRepairPrompt,
  setupProofloopAgentAdapter,
  writeAgentRepairAttemptReceipt,
  type AgentRunResult,
  type ProofloopVerdict,
} from "../src/eval/proofloopAgentAdapters";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ProofLoop agent adapters", () => {
  const verdict: ProofloopVerdict = {
    runId: "bankertoolbench-001",
    suite: "bankertoolbench",
    cmd: "npm run proofloop -- run bankertoolbench",
    passed: false,
    exitCode: 1,
    score: 50,
    minScore: 100,
    failedGates: ["artifact_reopen_validation"],
    receiptPaths: ["docs/eval/browser-receipts/bankertoolbench-live-room-proof.json"],
  };

  it("sets up Codex hooks and writes an agent adapter receipt", async () => {
    const root = tempRoot();

    const receipt = await setupProofloopAgentAdapter({
      adapterId: "codex",
      root,
      local: true,
      generatedAt: "2026-07-08T00:00:00.000Z",
    });

    expect(receipt).toMatchObject({
      schema: "proofloop-agent-adapter-setup-v1",
      adapterId: "codex",
      status: "ready",
      hookHost: "codex",
    });
    expect(existsSync(join(root, ".codex", "hooks.local.json"))).toBe(true);
    expect(existsSync(join(root, ".proofloop", "setup", "agents", "codex.json"))).toBe(true);
  });

  it("records adapter work still needed for Cursor/Windsurf/Devin-style hosts", async () => {
    const root = tempRoot();

    const receipt = await setupProofloopAgentAdapter({
      adapterId: "cursor",
      root,
      generatedAt: "2026-07-08T00:00:00.000Z",
    });

    expect(receipt.status).toBe("needs_adapter");
    expect(receipt.gateEnforcement.join(" ")).toContain("adapter-required");
    expect(readFileSync(join(root, ".proofloop", "setup", "agents", "cursor.json"), "utf8")).toContain("launch/trace/gate");
  });

  it("builds generic repair prompts and attempt receipts", () => {
    const root = tempRoot();
    const runDir = join(root, ".proofloop", "runs", verdict.runId);
    const promptPath = join(runDir, "generic-cli-repair-prompt.md");
    const prompt = buildAgentRepairPrompt({
      adapterId: "generic-cli",
      verdict,
      repairPrompt: "NodeEval says the exported artifact did not reopen.",
      attempt: 1,
      maxAttempts: 2,
    });
    expect(prompt).toContain("Adapter: generic-cli");
    expect(prompt).toContain("Do not weaken verifiers");
    expect(prompt).toContain("artifact_reopen_validation");

    const runResult: AgentRunResult = {
      adapterId: "generic-cli",
      status: "needs_command",
      launched: false,
      promptPath: ".proofloop/runs/bankertoolbench-001/generic-cli-repair-prompt.md",
      message: "dry run",
    };
    const receiptPath = writeAgentRepairAttemptReceipt({
      root,
      runDir,
      adapterId: "generic-cli",
      meta: verdict,
      repairPromptPath: promptPath,
      attempt: 1,
      maxAttempts: 2,
      runResult,
    });
    expect(JSON.parse(readFileSync(receiptPath, "utf8"))).toMatchObject({
      schema: "proofloop-agent-repair-attempt-v1",
      adapterId: "generic-cli",
      failedRunId: verdict.runId,
      runResult: { status: "needs_command" },
    });
  });
});

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "proofloop-agent-adapter-"));
  tempRoots.push(root);
  return root;
}
