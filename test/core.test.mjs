import test from "node:test";
import assert from "node:assert/strict";
import { analyzeList, normalizeName, resolveDrug } from "../src/core.mjs";

test("normalizes case, spaces and a trailing strength", () => {
  assert.equal(normalizeName("  WARFARIN 5 mg  "), "warfarin");
});

test("resolves explicit brand aliases", () => {
  assert.equal(resolveDrug("Coumadin").canonical, "warfarin");
  assert.equal(resolveDrug("Viagra").canonical, "sildenafil");
});

test("does not silently autocorrect a typo", () => {
  const r = resolveDrug("sildnafil");
  assert.equal(r.ok, false);
  assert.equal(r.suggestion, "sildenafil");
});

test("flags nitrate plus sildenafil as RED", () => {
  const r = analyzeList("sildenafil, nitroglycerin");
  assert.equal(r.topStatus, "RED");
  assert.ok(r.findings.some(f => f.id === "sildenafil-nitrates"));
});

test("flags clarithromycin plus warfarin as AMBER", () => {
  const r = analyzeList("clarithromycin, warfarin");
  assert.equal(r.topStatus, "AMBER");
  assert.ok(r.findings.some(f => f.id === "clarithromycin-warfarin"));
});

test("detects brand plus generic duplicate", () => {
  const r = analyzeList("warfarin, Coumadin");
  assert.ok(r.findings.some(f => f.id === "exact-duplicate:warfarin"));
});

test("detects NSAID class reconciliation review", () => {
  const r = analyzeList("ibuprofen, naproxen");
  assert.equal(r.topStatus, "REVIEW");
  assert.ok(r.findings.some(f => f.id.startsWith("class-review:nsaid")));
});

test("no rule match never claims safety", () => {
  const r = analyzeList("sildenafil, warfarin");
  assert.equal(r.topStatus, "REVIEW");
  assert.ok(r.findings.some(f => f.id === "bounded-coverage"));
});
