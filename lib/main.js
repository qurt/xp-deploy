"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const program = require("commander");
const pkg = require("../package.json");
const log = console.log;
const xpd_1 = require("./xpd");
program
    .version(pkg.version)
    .option("deploy <env>", "deploy code", (data) => {
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
function make_red(txt) {
    return chalk_1.default.red(txt);
}
let config = require(`${process.cwd()}/xpd_config.json`);
const xpd = new xpd_1.default(config);
if (program.deploy) {
    xpd.deloy(program.deploy).catch(e => {
        log(chalk_1.default.red(e));
    });
}
