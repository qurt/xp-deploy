"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const program = require("commander");
const pkg = require("../package.json");
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
const xpd = new xpd_1.default(test_config);
if (program.deploy) {
    xpd.deloy(program.deploy);
}
