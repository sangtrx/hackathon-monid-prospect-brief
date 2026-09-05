import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

export class MonidCliError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "MonidCliError";
    this.details = details;
  }
}

export function parseJsonOutput(stdout) {
  const text = String(stdout ?? "").trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const firstObject = text.indexOf("{");
  const firstArray = text.indexOf("[");
  const starts = [firstObject, firstArray].filter((x) => x >= 0).sort((a,b) => a-b);
  for (const start of starts) {
    try { return JSON.parse(text.slice(start)); } catch {}
  }
  throw new MonidCliError("Monid did not return machine-readable JSON", { stdout: text.slice(0, 2000) });
}

export function execMonid(args, { timeoutMs = 125_000, spawnImpl = spawn } = {}) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawnImpl("monid", args, {
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => { stdout += d; });
    child.stderr?.on("data", (d) => { stderr += d; });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new MonidCliError("Monid command timed out", { args, timeoutMs }));
    }, timeoutMs);
    child.once("error", (err) => {
      clearTimeout(timer);
      reject(new MonidCliError(`Unable to start Monid CLI: ${err.message}`, { args }));
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - started);
      if (code !== 0) {
        reject(new MonidCliError("Monid command failed", { args, code, stderr: stderr.trim(), stdout: stdout.trim(), latencyMs }));
        return;
      }
      try {
        resolve({ data: parseJsonOutput(stdout), stderr: stderr.trim(), latencyMs });
      } catch (err) { reject(err); }
    });
  });
}

export async function discover(query, limit = 8) {
  if (!query?.trim()) throw new TypeError("discover query is required");
  return execMonid(["discover", "-q", query.trim(), "-l", String(limit), "-j"]);
}

export async function inspect(provider, endpoint) {
  if (!provider || !endpoint) throw new TypeError("provider and endpoint are required");
  return execMonid(["inspect", "-p", provider, "-e", endpoint, "-j"]);
}

export async function runEndpoint({ provider, endpoint, inputLocation = "body", input, maxWaitSeconds = 30 }) {
  const args = ["run", "-p", provider, "-e", endpoint];
  const encoded = JSON.stringify(input ?? {});
  if (inputLocation === "body") args.push("-i", encoded);
  else if (inputLocation === "query") args.push("--query", encoded);
  else if (inputLocation === "path") args.push("--path", encoded);
  else throw new TypeError(`Unsupported inputLocation: ${inputLocation}`);
  args.push("-w", String(Math.min(Math.max(Number(maxWaitSeconds) || 30, 1), 120)), "-j");
  return execMonid(args, { timeoutMs: 125_000 });
}

export function extractRunMeta(result) {
  const data = result?.data ?? {};
  const status = data.status ?? data.run?.status ?? data.result?.status ?? "UNKNOWN";
  const cost = data.cost?.value ?? data.run?.cost?.value ?? data.result?.cost?.value ?? null;
  const currency = data.cost?.currency ?? data.run?.cost?.currency ?? data.result?.cost?.currency ?? null;
  const output = data.output ?? data.result?.output ?? data.data ?? data.result ?? data;
  return { status, cost, currency, output, latencyMs: result?.latencyMs ?? null };
}
