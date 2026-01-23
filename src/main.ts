import chalk from "chalk";
import { program } from "commander";
import { writeFileSync, readFileSync } from "fs";
import pkg from "../package.json" assert {type: "json"};
const log = console.log;

import XPD from "./xpd.js";

program
  .version(pkg.version)
  .command("deploy <env>")
  .description("deploy code")
  .action(env => {
    const environment = env.split(":");
    if (!environment || environment.length !== 2) {
      throw new Error("Invalid argument");
    }
    // Load config
    const file = readFileSync(`${process.cwd()}/xpd_config.json`).toString();
    const config = JSON.parse(file);
    const xpd = new XPD(config);
    xpd.deploy(environment[1]).catch(e => {
      log(chalk.red(e));
    });
  });
program
  .version(pkg.version)
  .command("init")
  .description("Init config file")
  .action(() => {
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
  });
program
  .version(pkg.version)
  .command("rollback <env> [count]")
  .description("rollback to previous release(s)")
  .action((env, count) => {
    const environment = env.split(":");
    if (!environment || environment.length !== 2) {
      throw new Error("Invalid argument");
    }
    // Load config
    const file = readFileSync(`${process.cwd()}/xpd_config.json`).toString();
    const config = JSON.parse(file);
    const xpd = new XPD(config);
    const rollbackCount = count ? parseInt(count, 10) : 1;
    if (isNaN(rollbackCount) || rollbackCount < 1) {
      throw new Error("Rollback count must be a positive number");
    }
    xpd.rollback(environment[1], rollbackCount).catch(e => {
      log(chalk.red(e));
    });
  });
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp(make_red);
}

function make_red(txt: string) {
  return chalk.red(txt); //display the help text in red on the console
}
