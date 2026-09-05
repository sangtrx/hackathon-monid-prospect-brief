import test from "node:test";
import assert from "node:assert/strict";
import { buildVerifiedLeadBrief, findWorkEmail, normalizeDomain, validateLeadInput } from "../src/lead-workflow.mjs";

function result(output, cost = 0.01) {
  return { data: { status:"COMPLETED", cost:{value:cost,currency:"USD"}, output }, latencyMs:9 };
}

test("normalizes company domains and rejects incomplete input", () => {
  assert.equal(normalizeDomain("https://www.Acme.com/path"), "acme.com");
  assert.equal(validateLeadInput({domain:"acme.com"}).ok, false);
  assert.equal(validateLeadInput({person:"Ada",domain:"localhost"}).ok, false);
});

test("prefers work-email shaped fields", () => {
  const found = findWorkEmail({ personal_email:"home@example.net", contact:{ work_email:"ada@acme.com" } });
  assert.equal(found.email, "ada@acme.com");
  assert.match(found.path, /work_email/);
});

test("chains actual returned email into Strale and totals costs", async () => {
  const seen=[];
  const runner=async call=>{
    seen.push(call);
    if(call.endpoint==="/people/match") return result({person:{name:"Ada",work_email:"ada@acme.com"}},0.05);
    if(call.endpoint==="/x402/email-validate") return result({email:call.input.email,valid:true,deliverable:true},0.002);
    if(call.endpoint==="/v5/company/enrich") return result({name:"Acme",employee_count:120,likelihood:8},0.03);
    throw new Error("unexpected endpoint");
  };
  const out=await buildVerifiedLeadBrief({person:"Ada Lovelace",domain:"acme.com"},{runner});
  assert.equal(out.kind,"complete");
  assert.equal(out.lead.workEmail,"ada@acme.com");
  assert.equal(seen.find(x=>x.endpoint==="/x402/email-validate").input.email,"ada@acme.com");
  assert.equal(seen.find(x=>x.endpoint==="/v5/company/enrich").input.min_likelihood,4);
  assert.equal(out.cost.value,0.082);
});

test("does not invent an email when Apollo returns none", async () => {
  const seen=[];
  const runner=async call=>{seen.push(call);if(call.endpoint==="/people/match") return result({person:{name:"Ada"}},0.05);if(call.endpoint==="/v5/company/enrich") return result({name:"Acme"},0.03);throw new Error("verification should not run");};
  const out=await buildVerifiedLeadBrief({person:"Ada",domain:"acme.com"},{runner});
  assert.equal(out.kind,"partial_result");
  assert.equal(out.lead.workEmail,null);
  assert.equal(seen.some(x=>x.endpoint==="/x402/email-validate"),false);
  assert.match(out.caveat,/did not guess/i);
});

test("keeps useful partial evidence when a provider fails", async () => {
  const runner=async call=>{if(call.endpoint==="/people/match") throw new Error("Apollo unavailable");if(call.endpoint==="/v5/company/enrich") return result({name:"Acme",industry:"software"},0.03);throw new Error("unexpected");};
  const out=await buildVerifiedLeadBrief({person:"Ada",domain:"acme.com"},{runner});
  assert.equal(out.ok,true);
  assert.equal(out.kind,"partial_result");
  assert.equal(out.calls.find(x=>x.endpoint==="/people/match").status,"ERROR");
  assert.equal(out.lead.company.industry,"software");
});
