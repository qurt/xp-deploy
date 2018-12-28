"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const core_1 = require("./core");
const fs_1 = require("fs");
const log = console.log;
class XPD {
    constructor(config) {
        this.globalConfig = config;
    }
    async deloy(env) {
        if (!this.globalConfig[env]) {
            throw Error(`Environment ${env} does not exist in config file!`);
        }
        this.config = Object.assign({}, this.globalConfig.default, this.globalConfig[env]);
        const date = new Date();
        const releaseId = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
        log("Starting deployment");
        log(`${core_1.tab()}Environment: ${chalk_1.default.green(env)}`);
        log(`${core_1.tab()}Release ID: ${chalk_1.default.green(releaseId)}`);
        log();
        try {
            fs_1.accessSync(this.config.deployFrom, fs_1.constants.F_OK);
        }
        catch (e) {
            throw Error("Deploy folder does not exist");
        }
        try {
            await this.execRemote(`if [ ! -d ${this.config.deployTo}/releases ]; then mkdir ${this.config.deployTo}/releases; fi`);
            log("Create release folder");
            await this.execRemote(`mkdir ${this.config.deployTo}/releases/${releaseId}`);
            log("Copy files to server");
            await core_1.local(`rsync --del -vr ${this.config.deployFrom} ${this.config.user}@${this.config.servers}:${this.config.deployTo}/releases/${releaseId}`);
            log("Change symlink");
            const res = await this.execRemote(`cd ${this.config.deployTo} && 
        if [ -d current ] && [ ! -L current ]; then 
        echo "ERR: could not make symlink"; else 
        ln -nfs ./releases/${releaseId} current_tmp &&
        mv -fT current_tmp current; fi
        `);
            log(chalk_1.default.green(`Completed after ${new Date().getTime() - date.getTime()} ms`));
        }
        catch (e) {
            throw e;
        }
    }
    async execRemote(cmd) {
        return await core_1.remote(this.config.user, this.config.servers, cmd).catch(e => {
            throw Error(e);
        });
    }
}
exports.default = XPD;
