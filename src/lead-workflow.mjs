import { extractRunMeta, runEndpoint } from "./monid.mjs";

export const LIVE_ENDPOINTS = [
  { id: "person_match", provider: "apollo", endpoint: "/people/match", inputLocation: "query" },
  { id: "email_validate", provider: "api.strale.io", endpoint: "/x402/email-validate", inputLocation: "query" },
  { id: "company_enrich", provider: "pdl", endpoint: "/v5/company/enrich", inputLocation: "body" }
];

export const INCUMBENT = {
  name: "Apollo Organization",
  publicPrice: "$119/user/month billed annually; 3-user minimum",
  annualMinimumUsd: 4284,
  priceSource: "https://www.apollo.io/pricing",
  scope: "This demo replaces one prospect enrichment/research workflow, not Apollo as a whole."
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function normalizeDomain(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.includes(".") || host.length > 253) return "";
    if (host === "localhost" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return "";
    return host;
  } catch { return ""; }
}

export function validateLeadInput(input) {
  const person = String(input?.person ?? "").trim();
  const domain = normalizeDomain(input?.domain);
  if (!person) return { ok: false, error: "Enter a person's name." };
  if (!domain) return { ok: false, error: "Enter a public company domain." };
  if (person.length > 160) return { ok: false, error: "Person name is too long." };
  return { ok: true, person, domain };
}

function walk(value, path = [], out = []) {
  if (Array.isArray(value)) value.forEach((item, i) => walk(item, [...path, String(i)], out));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => walk(item, [...path, key], out));
  else out.push({ path, value });
  return out;
}

export function findWorkEmail(output) {
  const candidates = walk(output)
    .filter(({ value }) => typeof value === "string" && emailRe.test(value.trim()))
    .map(({ path, value }) => {
      const key = path.join(".").toLowerCase();
      let score = 0;
      if (key.includes("work_email") || key.includes("workemail")) score += 100;
      if (key.endsWith(".email") || key === "email") score += 50;
      if (key.includes("email")) score += 20;
      if (key.includes("personal") || key.includes("home")) score -= 80;
      return { email: value.trim().toLowerCase(), path: path.join("."), score };
    })
    .sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function callRecord(step, meta, error) {
  return {
    id: step.id,
    provider: step.provider,
    endpoint: step.endpoint,
    status: error ? "ERROR" : meta.status,
    cost: error ? null : meta.cost,
    currency: error ? null : meta.currency,
    latencyMs: error ? null : meta.latencyMs,
    error: error?.message ?? null
  };
}

async function execute(step, input, runner) {
  try {
    const raw = await runner({ ...step, input, maxWaitSeconds: 30 });
    const meta = extractRunMeta(raw);
    return { meta, record: callRecord(step, meta, null) };
  } catch (error) {
    return { meta: null, record: callRecord(step, null, error) };
  }
}

export async function buildVerifiedLeadBrief(input, { runner = runEndpoint } = {}) {
  const valid = validateLeadInput(input);
  if (!valid.ok) return { ok: false, kind: "bad_input", error: valid.error };

  const personStep = LIVE_ENDPOINTS[0];
  const verifyStep = LIVE_ENDPOINTS[1];
  const companyStep = LIVE_ENDPOINTS[2];

  const [personResult, companyResult] = await Promise.all([
    execute(personStep, { name: valid.person, domain: valid.domain }, runner),
    execute(companyStep, { website: valid.domain, min_likelihood: 4 }, runner)
  ]);

  const calls = [personResult.record, companyResult.record];
  const personOutput = personResult.meta?.output ?? null;
  const companyOutput = companyResult.meta?.output ?? null;
  const email = findWorkEmail(personOutput);

  let verification = null;
  if (email) {
    verification = await execute(verifyStep, { email: email.email }, runner);
    calls.splice(1, 0, verification.record);
  }

  const successfulOutputs = [personOutput, companyOutput, verification?.meta?.output].filter((value) => value != null);
  const errors = calls.filter((call) => call.status === "ERROR" || ["FAILED", "BLOCKED", "STOPPED", "TIMED_OUT"].includes(call.status));
  const totalCost = calls.reduce((sum, call) => sum + (typeof call.cost === "number" ? call.cost : 0), 0);
  const currencies = [...new Set(calls.map((call) => call.currency).filter(Boolean))];

  const kind = successfulOutputs.length === 0
    ? "provider_error"
    : !email || errors.length > 0
      ? "partial_result"
      : "complete";

  return {
    ok: successfulOutputs.length > 0,
    kind,
    target: INCUMBENT,
    input: { person: valid.person, domain: valid.domain },
    lead: {
      workEmail: email?.email ?? null,
      workEmailSourcePath: email?.path ?? null,
      person: personOutput,
      emailVerification: verification?.meta?.output ?? null,
      company: companyOutput
    },
    cost: { value: totalCost, currency: currencies.length === 1 ? currencies[0] : null },
    calls,
    generatedAt: new Date().toISOString(),
    caveat: email ? "Email was returned by a provider and checked for deliverability; this does not grant outreach consent." : "No work email was returned; the app did not guess one."
  };
}
