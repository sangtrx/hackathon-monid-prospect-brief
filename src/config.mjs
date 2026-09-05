import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function loadWorkflowConfig(path = process.env.WORKFLOW_CONFIG || "config/endpoints.local.json") {
  const full = resolve(path);
  let text;
  try { text = await readFile(full, "utf8"); }
  catch (err) {
    if (err.code === "ENOENT") throw new Error(`Missing ${path}. Copy config/endpoints.example.json and fill it from monid inspect output.`);
    throw err;
  }
  const cfg = JSON.parse(text);
  if (!Array.isArray(cfg.steps) || cfg.steps.length === 0) throw new Error("Workflow must contain at least one step");
  for (const step of cfg.steps) {
    const s = JSON.stringify(step);
    if (s.includes("REPLACE_AFTER_INSPECT")) throw new Error(`Step ${step.id ?? "unknown"} still contains REPLACE_AFTER_INSPECT; refusing to guess a Monid schema.`);
    if (!step.provider || !step.endpoint || !step.inputTemplate) throw new Error(`Step ${step.id ?? "unknown"} is incomplete`);
  }
  return cfg;
}

export function renderTemplate(value, vars) {
  if (Array.isArray(value)) return value.map((v) => renderTemplate(v, vars));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, renderTemplate(v, vars)]));
  if (typeof value !== "string") return value;
  return value.replace(/\{\{(company|person)\}\}/g, (_, key) => vars[key] ?? "");
}
