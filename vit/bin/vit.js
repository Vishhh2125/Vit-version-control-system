#!/usr/bin/env node
import init from "../lib/init.js";
import add from "../lib/add.js";
import commit from "../lib/commit.js";
import log from "../lib/log.js";
import revert from "../lib/revert.js";

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "init":
    init();
    break;
  case "add":
    const files = args.slice(1);
    files.forEach(file => {
      add(file);
    });
    break;
  case "commit":
    const message = args.slice(1).join(" "); // Join all remaining args as message
    if (!message) {
      console.error("Error: Please provide a commit message");
      process.exit(1);
    }
    commit(message);
    break;
  case "log":
    log();
    break;
  case "revert":
    const steps = parseInt(args[1]) || 1;
    revert(steps);
    break;
  default:
    console.log(`Unknown command: ${command}`);
    break;
}
