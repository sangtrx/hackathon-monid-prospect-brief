import { runEndpoint, extractRunMeta } from "./monid.mjs";
import { renderTemplate } from "./config.mjs";

export function validateRequest(input) {
  const company = String(input?.company ?? "").trim();
  const person = String(input?.person ?? "").trim();
  if (!company && !person) return { ok: false, error: "Enter a company or person." };
  if (company.length > 160 || person.length > 160) return { ok: false, error: "Input is too long." };
  return { ok: true, company, person };
}

function summarizeOutput(output) {
  if (output == null) return { empty: true, preview: null };
  if (Array.isArray(output)) return { empty: output.length === 0, count: output.length, preview: output.slice(0, 5) };
  if (typeof output === "object") return { empty: Object.keys(output).length === 0, preview: output };
  return { empty: !String(output).trim(), preview: output };
}

export async function runProspectBrief(input, config, { runner = runEndpoint } = {}) {
  const valid = validateRequest(input);
  if (!valid.ok) return { ok: false, kind: "bad_input", error: valid.error };

  const calls = [];
  const evidence = [];
  for (const step of config.steps) {
    if (step.id === "person" && !valid.person && step.optional) continue;
    const endpointInput = renderTemplate(step.inputTemplate, valid);
    const startedAt = new Date().toISOString();
    try {
      const raw = await runner({ ...step, input: endpointInput });
      const meta = extractRunMeta(raw);
      const summary = summarizeOutput(meta.output);
      calls.push({ id: step.id, label: step.label, provider: step.provider, endpoint: step.endpoint, startedAt, status: meta.status, cost: meta.cost, currency: meta.currency, latencyMs: meta.latencyMs, empty: summary.empty });
      if (!summary.empty) evidence.push({ id: step.id, label: step.label, provider: step.provider, endpoint: step.endpoint, data: summary.preview });
    } catch (err) {
      calls.push({ id: step.id, label: step.label, provider: step.provider, endpoint: step.endpoint, startedAt, status: "ERROR", error: err.message, details: err.details ?? null });
    }
  }
  const successes = calls.filter((x) => !["ERROR", "FAILED", "BLOCKED", "STOPPED", "TIMED_OUT"].includes(x.status));
  const totalCost = calls.reduce((sum, x) => sum + (typeof x.cost === "number" ? x.cost : 0), 0);
  const currencies = [...new Set(calls.map((x) => x.currency).filter(Boolean))];
  const kind = evidence.length === 0 ? (successes.length ? "empty_result" : "provider_error") : (calls.some((x) => x.status === "ERROR") ? "partial_result" : "complete");
  return {
    ok: evidence.length > 0,
    kind,
    subject: { company: valid.company || null, person: valid.person || null },
    incumbent: config.incumbent,
    cost: { value: totalCost, currency: currencies.length === 1 ? currencies[0] : null },
    calls,
    evidence,
    generatedAt: new Date().toISOString(),
  };
}
