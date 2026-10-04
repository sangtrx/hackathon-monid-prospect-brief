import { performance } from "node:perf_hooks";
import { analyzeList } from "../src/core.mjs";

const fixtures = [
  ["sildenafil, nitroglycerin", "RED", "sildenafil-nitrates"],
  ["Viagra, Imdur", "RED", "sildenafil-nitrates"],
  ["clarithromycin, simvastatin", "RED", "clarithromycin-simvastatin-lovastatin"],
  ["Biaxin, Coumadin", "AMBER", "clarithromycin-warfarin"],
  ["sertraline, ibuprofen", "AMBER", "sertraline-bleeding-risk"],
  ["Zoloft, aspirin", "AMBER", "sertraline-bleeding-risk"],
  ["sertraline, pimozide", "RED", "sertraline-pimozide"],
  ["sertraline, phenelzine", "RED", "sertraline-maoi"],
  ["ibuprofen, naproxen", "REVIEW", "class-review:nsaid"],
  ["warfarin, Coumadin", "REVIEW", "exact-duplicate:warfarin"],
  ["sildnafil, nitroglycerin", "UNKNOWN", "unknown:sildnafil"],
  ["sildenafil, warfarin", "REVIEW", "bounded-coverage"]
];

let pass = 0;
for (const [input, expectedStatus, expectedIdPrefix] of fixtures) {
  const result = analyzeList(input);
  const idMatch = result.findings.some(f => f.id.startsWith(expectedIdPrefix));
  const ok = result.topStatus === expectedStatus && idMatch;
  pass += ok ? 1 : 0;
  console.log((ok ? "PASS" : "FAIL") + " | " + input + " | " + result.topStatus + " | " + result.findings.map(f => f.id).join(", "));
}

const loops = 10000;
const t0 = performance.now();
for (let i = 0; i < loops; i++) analyzeList("sertraline, ibuprofen, warfarin");
const elapsed = performance.now() - t0;

console.log("");
console.log("Fixture agreement: " + pass + "/" + fixtures.length);
console.log("Benchmark: " + loops + " local checks in " + elapsed.toFixed(2) + " ms (" + (elapsed / loops).toFixed(4) + " ms/check)");
console.log("Scope note: fixtures validate deterministic behavior of the bundled demo rules only, not clinical sensitivity or specificity.");

if (pass !== fixtures.length) process.exitCode = 1;
