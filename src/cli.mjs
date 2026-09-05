#!/usr/bin/env node
import { discover, inspect, execMonid } from "./monid.mjs";

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "doctor") {
    const [version, keys] = await Promise.all([execMonid(["--version", "-j"]).catch(() => execMonid(["--version"])), execMonid(["keys", "list", "-j"])]);
    console.log(JSON.stringify({ version: version.data, keys: keys.data }, null, 2));
  } else if (cmd === "discover") {
    console.log(JSON.stringify((await discover(args.join(" "))).data, null, 2));
  } else if (cmd === "inspect") {
    if (args.length !== 2) throw new Error("Usage: npm run monid:inspect -- <provider> <endpoint>");
    console.log(JSON.stringify((await inspect(args[0], args[1])).data, null, 2));
  } else {
    throw new Error("Commands: doctor | discover <query> | inspect <provider> <endpoint>");
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message, details: err.details ?? null }, null, 2));
  process.exitCode = 1;
}
