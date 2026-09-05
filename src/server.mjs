import http from "node:http";
import { readFile } from "node:fs/promises";
import { loadWorkflowConfig } from "./config.mjs";
import { runProspectBrief } from "./workflow.mjs";

const port = Number(process.env.PORT || 8787);
const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

function json(res, code, value) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html); return;
  }
  if (req.method === "GET" && req.url === "/api/health") { json(res, 200, { ok: true }); return; }
  if (req.method === "POST" && req.url === "/api/brief") {
    let body = "";
    for await (const chunk of req) { body += chunk; if (body.length > 20_000) { json(res, 413, { ok:false, error:"Payload too large" }); return; } }
    try {
      const input = JSON.parse(body || "{}");
      const config = await loadWorkflowConfig();
      const result = await runProspectBrief(input, config);
      json(res, result.ok ? 200 : result.kind === "bad_input" ? 400 : 502, result);
    } catch (err) { json(res, 500, { ok:false, kind:"configuration_error", error:err.message }); }
    return;
  }
  json(res, 404, { ok:false, error:"Not found" });
});
server.listen(port, "127.0.0.1", () => console.log(`Prospect Brief listening on http://127.0.0.1:${port}`));
