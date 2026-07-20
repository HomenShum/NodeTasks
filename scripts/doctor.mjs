import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = await readFile(resolve(root, "nodekit.yaml"), "utf8");
const requiredPaths = [
  "catalog/all-tasks.json",
  "catalog/source-files.json",
  "catalog/task-index.json",
  "docs/UPSTREAM_PROVENANCE.md",
  "proof/corpus-receipt.json",
  "schemas/corpus-receipt.schema.json",
  "scripts/validate-catalog.mjs",
];

const checks = [
  {
    id: "node-version",
    passed: Number(process.versions.node.split(".")[0]) >= 20,
    detail: process.versions.node,
  },
  ...requiredPaths.map((path) => ({
    id: `required:${path}`,
    passed: existsSync(resolve(root, path)),
    detail: path,
  })),
  {
    id: "flat-nodekit-manifest",
    passed: /^schemaVersion:\s*nodekit\.repo\/v1\s*$/m.test(manifest),
    detail: "nodekit.repo/v1",
  },
  {
    id: "no-product-agent-manifest",
    passed: !existsSync(resolve(root, "nodeagent.yaml")),
    detail: "nodeagent.yaml must remain absent",
  },
  {
    id: "corpus-receipt-only-ownership",
    passed:
      /^canonicalFor:\s*\r?\n\s+-\s+nodetasks\.corpus-receipt\s*\r?\n\s*\r?\nconsumes:/m.test(manifest) &&
      !/^canonicalFor:[\s\S]*?^\s+-\s+nodeagent\./m.test(manifest),
    detail: "NodeTasks owns its corpus receipt; vendored runtime contracts remain provenance only",
  },
];

const result = {
  schemaVersion: "nodetasks.doctor/v1",
  passed: checks.every((check) => check.passed),
  externalAccountsRequired: 0,
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
