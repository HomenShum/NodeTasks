import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { copyFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const assetsDir = join(root, "assets");
const port = process.env.NODETASKS_STREAMLIT_PORT ?? "8522";
const baseUrl = `http://127.0.0.1:${port}`;
const url = `${baseUrl}/?view=cheap-spreadsheetbench-models&persona=Model%20evaluator&ask=Which%20cheap%20SpreadsheetBench%20model%20attempts%20should%20I%20run%20first%3F`;
const frameDir = await mkdtemp(join(tmpdir(), "nodetasks-storyboard-"));
const palettePath = join(frameDir, "palette.png");
const gifPath = join(assetsDir, "nodetasks-streamlit-explorer.gif");

mkdirSync(assetsDir, { recursive: true });

const server = spawn("python", [
  "-m",
  "streamlit",
  "run",
  "apps/nodetasks_streamlit.py",
  "--server.headless",
  "true",
  "--server.port",
  port,
  "--server.fileWatcherType",
  "none",
  "--browser.gatherUsageStats",
  "false",
  "--theme.base",
  "dark",
  "--theme.primaryColor",
  "#ff695c",
  "--theme.backgroundColor",
  "#080b0f",
  "--theme.secondaryBackgroundColor",
  "#111820",
  "--theme.textColor",
  "#eef2f7",
], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  shell: process.platform === "win32",
});

let serverOutput = "";
server.stdout.on("data", (data) => { serverOutput += data.toString(); });
server.stderr.on("data", (data) => { serverOutput += data.toString(); });

try {
  await waitForServer(baseUrl, 45_000);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "load" });
  await page.getByText("9,140").waitFor({ timeout: 30_000 });
  await page.getByText("cheap-spreadsheetbench-models").waitFor({ timeout: 30_000 });

  const states = [
    {
      tab: "Search",
      file: "nodetasks-01-search.png",
      evidence: ["Ranked task table", "provider-low", "Spreadsheet & Office Automation"],
    },
    {
      tab: "Saved views",
      file: "nodetasks-02-saved-views.png",
      evidence: ["Saved views and shareable bundles", "cheap-spreadsheetbench-models"],
    },
    {
      tab: "Provenance",
      file: "nodetasks-03-provenance.png",
      evidence: ["Provenance and score boundaries", "Verifier types", "Score statuses"],
    },
    {
      tab: "NodeAgent",
      file: "nodetasks-04-nodeagent.png",
      evidence: ["NodeAgent catalog mode found", "Cited task ids", "official-boundary-blocked"],
    },
  ];

  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    await page.getByRole("tab", { name: state.tab, exact: true }).click();
    for (const text of state.evidence) {
      await waitForVisibleText(page, text, 30_000);
    }
    await waitForNotRunning(page, 30_000);
    await page.waitForTimeout(1500);
    const framePath = join(frameDir, `frame-${String(index + 1).padStart(3, "0")}.png`);
    await page.screenshot({ path: framePath, fullPage: false });
    await copyFile(framePath, join(assetsDir, state.file));
  }

  await browser.close();

  await run("ffmpeg", ["-y", "-framerate", "0.55", "-i", join(frameDir, "frame-%03d.png"), "-vf", "scale=1000:-1:flags=lanczos,palettegen=stats_mode=diff", palettePath]);
  await run("ffmpeg", ["-y", "-framerate", "0.55", "-i", join(frameDir, "frame-%03d.png"), "-i", palettePath, "-lavfi", "scale=1000:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", "-loop", "0", gifPath]);

  if (!existsSync(gifPath)) throw new Error(`GIF was not written: ${gifPath}`);
  console.log(`wrote ${gifPath}`);
} finally {
  stopServer(server);
  rmSync(frameDir, { recursive: true, force: true });
}

async function waitForServer(targetUrl, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(targetUrl);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${targetUrl}\n${serverOutput}`);
}

async function waitForVisibleText(page, text, timeoutMs) {
  await page.waitForFunction(
    (needle) => document.body.innerText.includes(needle),
    text,
    { timeout: timeoutMs },
  );
}

async function waitForNotRunning(page, timeoutMs) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("RUNNING"),
    undefined,
    { timeout: timeoutMs },
  ).catch(() => undefined);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "pipe" });
    let output = "";
    child.stdout.on("data", (data) => { output += data.toString(); });
    child.stderr.on("data", (data) => { output += data.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}\n${output}`));
    });
  });
}

function stopServer(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}
