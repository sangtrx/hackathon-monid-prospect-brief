#!/usr/bin/env node
import { discover, inspect, execMonid } from "./monid.mjs";
import { LIVE_ENDPOINTS } from "./lead-workflow.mjs";

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "doctor") {
    const [version, keys, balance] = await Promise.all([
      execMonid(["--version"]).catch((err) => ({ data: { error: err.message } })),
      execMonid(["keys", "list", "-j"]),
      execMonid(["balance", "-j"]).catch((err) => ({ data: { error: err.message } }))
    ]);
    console.log(JSON.stringify({ version: version.data, keys: keys.data, balance: balance.data }, null, 2));
  } else if (cmd === "discover") {
    console.log(JSON.stringify((await discover(args.join(" "))).data, null, 2));
  } else if (cmd === "inspect") {
    if (args.length !== 2) throw new Error("Usage: npm run monid:inspect -- <provider> <endpoint>");
    console.log(JSON.stringify((await inspect(args[0], args[1])).data, null, 2));
  } else if (cmd === "preflight") {
    const inspected = [];
    for (const item of LIVE_ENDPOINTS) {
      const result = await inspect(item.provider, item.endpoint);
      inspected.push({ id: item.id, provider: item.provider, endpoint: item.endpoint, inspect: result.data });
    }
    console.log(JSON.stringify({ ok: true, inspectedAt: new Date().toISOString(), endpoints: inspected }, null, 2));
  } else {
    throw new Error("Commands: doctor | discover <query> | inspect <provider> <endpoint> | preflight");
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message, details: err.details ?? null }, null, 2));
  process.exitCode = 1;
}
