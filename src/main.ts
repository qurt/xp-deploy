import chalk from "chalk";
import * as program from "commander";
import { writeFileSync } from "fs";
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
  .option("init", "Init config file", () => {
    log("Create configuration file...");
    const config = {
      default: {
        user: "username",
        deployTo: "/path/to/deploy",
        deployFrom: "/path/to/dist",
        servers: "example.com"
      },
      production: {}
    };
    writeFileSync(
      `${process.cwd()}/xpd_config.json`,
      JSON.stringify(config, null, 2),
      "utf8"
    );
    log(chalk.green("Success!"));
  })
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp(make_red);
}

function make_red(txt: string) {
  return chalk.red(txt); //display the help text in red on the console
}

if (program.deploy) {
  // Load config
  let config = require(`${process.cwd()}/xpd_config.json`);
  const xpd = new XPD(config);
  xpd.deploy(program.deploy).catch(e => {
    log(chalk.red(e));
  });
}
