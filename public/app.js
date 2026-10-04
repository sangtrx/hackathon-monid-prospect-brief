import { analyzeList } from "./src/core.mjs";

const meds = document.querySelector("#meds");
const checkBtn = document.querySelector("#checkBtn");
const clearBtn = document.querySelector("#clearBtn");
const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
const offlineBadge = document.querySelector("#offlineBadge");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));
}

function sourceBlock(source) {
  if (!source) {
    return '<details><summary>Why no source link?</summary><p class="source">This finding comes from name resolution, duplicate detection or the bounded-coverage guardrail, not a pair-specific clinical claim.</p></details>';
  }
  return '<details><summary>Source and provenance</summary><p class="source"><a href="' +
    esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.title) +
    "</a><br>" + esc(source.note) + "</p></details>";
}

function render() {
  const r = analyzeList(meds.value);
  summary.classList.remove("hidden");
  if (r.errors.length) {
    summary.innerHTML = "<strong>Input needs attention</strong><span>" + esc(r.errors.join(" ")) + "</span>";
  } else {
    summary.innerHTML = "<strong>Top status: " + esc(r.topStatus) + "</strong><span>" +
      r.known.length + " confirmed name(s), " + r.unknownCount +
      " unconfirmed · dataset " + esc(r.datasetVersion) + "</span>";
  }

  results.innerHTML = r.findings.map(f =>
    '<article class="finding ' + esc(f.status) + '">' +
      '<div class="finding-head"><span class="status">' + esc(f.status) +
      '</span><span class="drugs">' + esc((f.drugs || []).join(" + ")) + "</span></div>" +
      "<h3>" + esc(f.label) + "</h3>" +
      "<p>" + esc(f.summary) + "</p>" +
      "<p>" + esc(f.rationale) + "</p>" +
      '<p class="action"><b>Next:</b> ' + esc(f.action) + "</p>" +
      sourceBlock(f.source) +
    "</article>"
  ).join("");
}

checkBtn.addEventListener("click", render);
clearBtn.addEventListener("click", () => {
  meds.value = "";
  results.innerHTML = "";
  summary.classList.add("hidden");
  meds.focus();
});
document.querySelectorAll("[data-demo]").forEach(btn => btn.addEventListener("click", () => {
  meds.value = btn.dataset.demo;
  render();
}));

function updateNetworkBadge(cached = false) {
  const network = navigator.onLine ? "network available" : "network offline";
  offlineBadge.querySelector("b").textContent =
    (cached ? "Offline cache ready · " : "Local engine ready · ") + network;
}

window.addEventListener("online", () => updateNetworkBadge(true));
window.addEventListener("offline", () => updateNetworkBadge(true));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => updateNetworkBadge(true))
    .catch(() => updateNetworkBadge(false));
} else {
  updateNetworkBadge(false);
}
