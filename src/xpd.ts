import chalk from "chalk";
import { tab, remote, local } from "./core";
import { accessSync, constants } from "fs";

const log = console.log;

interface IXpdEntryConfig {
  user?: string;
  deployTo?: string;
  deployFrom?: string;
  ignores?: Array<string>;
  keepReleases?: number;
  servers?: string;
}

interface IXpdConfig {
  [env: string]: IXpdEntryConfig;
}

class XPD {
  globalConfig: IXpdConfig;
  config: IXpdEntryConfig;
  constructor(config: IXpdConfig) {
    this.globalConfig = config;
  }
  async deloy(env: string) {
    // Check env is exist
    if (!this.globalConfig[env]) {
      throw Error(`Environment ${env} does not exist in config file!`);
    }

    this.config = { ...this.globalConfig.default, ...this.globalConfig[env] };
    const date = new Date();
    const releaseId = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;

    log("Starting deployment");
    log(`${tab()}Environment: ${chalk.green(env)}`);
    log(`${tab()}Release ID: ${chalk.green(releaseId)}`);
    log();
    // Check dist dir
    try {
      accessSync(this.config.deployFrom, constants.F_OK);
    } catch (e) {
      throw Error("Deploy folder does not exist");
    }

    try {
      await this.execRemote(
        `if [ ! -d ${this.config.deployTo}/releases ]; then mkdir ${
          this.config.deployTo
        }/releases; fi`
      );
      log("Create release folder");
      await this.execRemote(
        `mkdir ${this.config.deployTo}/releases/${releaseId}`
      );
      // TODO: Добавить копирование предыдущего релиза в папку
      log("Copy files to server");
      await local(
        `rsync --del -vr ${this.config.deployFrom} ${this.config.user}@${
          this.config.servers
        }:${this.config.deployTo}/releases/${releaseId}`
      );
      // TODO: Добавить обработку ошибки
      log("Change symlink");
      const res = await this.execRemote(
        `cd ${this.config.deployTo} && 
        if [ -d current ] && [ ! -L current ]; then 
        echo "ERR: could not make symlink"; else 
        ln -nfs ./releases/${releaseId} current_tmp &&
        mv -fT current_tmp current; fi
        `
      );
      log(
        chalk.green(
          `Completed after ${new Date().getTime() - date.getTime()} ms`
        )
      );
    } catch (e) {
      throw e;
    }
  }

  private async execRemote(cmd: string) {
    return await remote(this.config.user, this.config.servers, cmd).catch(e => {
      throw Error(e);
    });
  }
}

export default XPD;
