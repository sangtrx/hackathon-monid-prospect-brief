import { CLASS_REVIEW, DATASET_VERSION, DRUGS, RULES } from "./data.mjs";

const STATUS_WEIGHT = { RED: 4, AMBER: 3, REVIEW: 2, UNKNOWN: 1 };

export function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[()]/g, " ")
    .replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)\b.*$/i, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const aliasIndex = (() => {
  const m = new Map();
  for (const [canonical, meta] of Object.entries(DRUGS)) {
    m.set(normalizeName(canonical), canonical);
    for (const alias of meta.aliases) m.set(normalizeName(alias), canonical);
  }
  return m;
})();

function levenshtein(a, b) {
  const x = normalizeName(a);
  const y = normalizeName(b);
  const dp = Array.from({ length: x.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[x.length][y.length];
}

export function resolveDrug(raw) {
  const normalized = normalizeName(raw);
  if (!normalized) return { ok: false, raw, normalized, suggestion: null };
  const exact = aliasIndex.get(normalized);
  if (exact) return { ok: true, raw, normalized, canonical: exact, meta: DRUGS[exact] };

  let best = null;
  for (const [candidate, canonical] of aliasIndex.entries()) {
    const distance = levenshtein(normalized, candidate);
    if (!best || distance < best.distance) best = { candidate, canonical, distance };
  }
  return {
    ok: false,
    raw,
    normalized,
    suggestion: best && best.distance <= 2 ? best.canonical : null
  };
}

export function parseList(input) {
  return String(input ?? "").split(/[\n,;]+/).map(v => v.trim()).filter(Boolean);
}

function pairMatches(rule, a, b) {
  return (rule.left.includes(a) && rule.right.includes(b)) ||
    (rule.left.includes(b) && rule.right.includes(a));
}

export function analyzeList(input) {
  const tokens = parseList(input);
  const errors = [];
  if (tokens.length < 2) errors.push("Enter at least two medicines.");
  if (tokens.length > 6) errors.push("This demo accepts up to six medicines at a time.");

  const resolved = tokens.slice(0, 6).map(resolveDrug);
  const known = resolved.filter(x => x.ok);
  const unknown = resolved.filter(x => !x.ok);
  const findings = [];

  for (const item of unknown) {
    findings.push({
      id: "unknown:" + (item.normalized || "blank"),
      status: "UNKNOWN",
      label: "Name not confirmed",
      summary: item.suggestion
        ? "“" + item.raw + "” is not in the bounded dataset. Did you mean “" + item.suggestion + "”?"
        : "“" + item.raw + "” is not in the bounded dataset.",
      rationale: "RxCheck Pocket does not silently autocorrect medicine names.",
      action: "Confirm the medicine name before using any result.",
      source: null,
      drugs: [item.raw]
    });
  }

  const canonicals = known.map(x => x.canonical);
  const unique = [...new Set(canonicals)];

  for (const canonical of unique) {
    const count = canonicals.filter(x => x === canonical).length;
    if (count > 1) {
      findings.push({
        id: "exact-duplicate:" + canonical,
        status: "REVIEW",
        label: "Duplicate medicine entry",
        summary: canonical + " appears more than once after explicit alias resolution.",
        rationale: "Brand and generic names can describe the same active ingredient.",
        action: "Confirm whether this is a duplicate entry in the medication list.",
        source: null,
        drugs: [canonical]
      });
    }
  }

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i];
      const b = unique[j];
      for (const rule of RULES) {
        if (pairMatches(rule, a, b)) findings.push({ ...rule, drugs: [a, b] });
      }
      const classA = DRUGS[a]?.class;
      const classB = DRUGS[b]?.class;
      if (classA && classA === classB && CLASS_REVIEW[classA]) {
        findings.push({
          id: "class-review:" + classA + ":" + [a, b].sort().join("+"),
          drugs: [a, b],
          ...CLASS_REVIEW[classA]
        });
      }
    }
  }

  if (!errors.length && known.length >= 2 && findings.length === 0) {
    findings.push({
      id: "bounded-coverage",
      status: "REVIEW",
      label: "No curated rule matched",
      summary: "No rule matched this pair in the bounded hackathon dataset.",
      rationale: "Absence from this small dataset does not mean the combination is safe.",
      action: "Use an authoritative medication reference or clinician/pharmacist review for a complete check.",
      source: null,
      drugs: unique
    });
  }

  findings.sort((a, b) => (STATUS_WEIGHT[b.status] || 0) - (STATUS_WEIGHT[a.status] || 0) || a.id.localeCompare(b.id));

  return {
    datasetVersion: DATASET_VERSION,
    inputCount: tokens.length,
    resolved,
    known: unique,
    unknownCount: unknown.length,
    findings,
    topStatus: findings[0]?.status ?? "REVIEW",
    errors
  };
}
