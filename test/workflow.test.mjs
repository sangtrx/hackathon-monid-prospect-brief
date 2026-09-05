import test from "node:test";
import assert from "node:assert/strict";
import { validateRequest, runProspectBrief } from "../src/workflow.mjs";

const config = { incumbent:{name:"Apollo Basic",publicPrice:"$49"}, steps:[{id:"company",label:"Company",provider:"demo",endpoint:"/company",inputTemplate:{q:"{{company}}"}},{id:"person",label:"Person",provider:"demo",endpoint:"/person",inputTemplate:{q:"{{person}}"},optional:true}] };

test("rejects empty input", () => assert.deepEqual(validateRequest({}), {ok:false,error:"Enter a company or person."}));
test("skips optional person endpoint when person is absent", async () => {
  const seen=[]; const runner=async x => {seen.push(x); return {data:{status:"COMPLETED",cost:{value:.01,currency:"USD"},output:[{name:"Acme"}]},latencyMs:12};};
  const out=await runProspectBrief({company:"Acme"},config,{runner});
  assert.equal(out.kind,"complete"); assert.equal(seen.length,1); assert.equal(seen[0].input.q,"Acme"); assert.equal(out.cost.value,.01);
});
test("returns partial result rather than inventing missing evidence", async () => {
  let n=0; const runner=async () => {n++; if(n===2) throw new Error("provider down"); return {data:{status:"COMPLETED",cost:{value:.02,currency:"USD"},output:{fact:"real"}},latencyMs:7};};
  const out=await runProspectBrief({company:"Acme",person:"Ada"},config,{runner});
  assert.equal(out.kind,"partial_result"); assert.equal(out.evidence.length,1); assert.equal(out.calls[1].status,"ERROR");
});
