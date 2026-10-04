import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
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

test("12 demo/evaluation fixtures agree with expected bounded behavior", () => {
  let pass = 0;
  for (const [input, expectedStatus, expectedIdPrefix] of fixtures) {
    const result = analyzeList(input);
    const idMatch = result.findings.some(f => f.id.startsWith(expectedIdPrefix));
    if (result.topStatus === expectedStatus && idMatch) pass += 1;
  }
  console.log("RXCHECK_FIXTURE_AGREEMENT " + pass + "/" + fixtures.length);
  assert.equal(pass, fixtures.length);
});

test("local rule engine benchmark stays comfortably sub-second", () => {
  const loops = 10000;
  const t0 = performance.now();
  for (let i = 0; i < loops; i++) analyzeList("sertraline, ibuprofen, warfarin");
  const elapsed = performance.now() - t0;
  const perCheck = elapsed / loops;
  console.log("RXCHECK_BENCHMARK " + loops + " checks " + elapsed.toFixed(2) + "ms total " + perCheck.toFixed(4) + "ms/check");
  assert.ok(perCheck < 10, "bounded local check should remain well below 1 second");
});

test("static PWA builds and critical browser scripts parse", async () => {
  execFileSync(process.execPath, ["--check", "public/app.js"], { stdio: "pipe" });
  execFileSync(process.execPath, ["--check", "public/sw.js"], { stdio: "pipe" });
  execFileSync(process.execPath, ["scripts/build.mjs"], { stdio: "pipe" });

  for (const path of [
    "dist/index.html",
    "dist/app.js",
    "dist/sw.js",
    "dist/manifest.webmanifest",
    "dist/src/core.mjs",
    "dist/src/data.mjs"
  ]) {
    await access(path);
  }

  const html = await readFile("dist/index.html", "utf8");
  const sw = await readFile("dist/sw.js", "utf8");
  assert.match(html, /RxCheck Pocket/);
  assert.match(html, /app\.js/);
  assert.match(sw, /src\/core\.mjs/);
  console.log("RXCHECK_STATIC_BUILD PASS");
});
