import chalk from "chalk";
import * as program from "commander";
const pkg = require("../package.json");

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

const test_config = {
  user: "dev",
  deployTo: "/srv/www",
  deployFrom: "./",
  keepReleases: 2,
  servers: "qmoney.me",
  "pre-deploy": () => {
    console.log("pre deploy callback");
  },
  "post-deploy": () => {
    console.log("post deploy callback");
  }
};

const xpd = new XPD(test_config);

if (program.deploy) {
  xpd.deloy(program.deploy);
}
