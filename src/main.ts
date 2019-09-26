import chalk from "chalk";
import * as program from "commander";
const pkg = require("../package.json");
const log = console.log;

import XPD from "./xpd";

program
  .version(pkg.version)
  .option("deploy <env>", "deploy code", (data: string) => {
    const env = data.split(":");
    if (!env || env.length !== 2) {
      throw new Error("Invalid argument");
    }
    return env[1];
  })
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp(make_red);
}

function make_red(txt: string) {
  return chalk.red(txt); //display the help text in red on the console
}

// Load config
let config = require(`${process.cwd()}/xpd_config.json`);

const xpd = new XPD(config);

if (program.deploy) {
  xpd.deploy(program.deploy).catch(e => {
    log(chalk.red(e));
  });
}
