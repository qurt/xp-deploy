import chalk from 'chalk';
import { tab, remote, local, computeReleaseDirname, equalValues } from './core.js';
import { accessSync, constants } from 'fs';

const log = console.log;

interface IXpdEntryConfig {
  user: string;
  deployTo: string;
  deployFrom: string;
  ignores?: Array<string>;
  keepReleases?: number;
  copy?: boolean;
  servers: string;
  preDeploy?: IXpdTasks;
  postDeploy?: IXpdTasks;
}

interface IXpdConfig {
  [env: string]: IXpdEntryConfig;
}

interface IXpdTasks {
  local: string | Array<string>;
  remote: string | Array<string>;
}

class XPD {
  globalConfig: IXpdConfig;
  config: IXpdEntryConfig;
  servers: Array<string>;
  constructor(config: IXpdConfig) {
    this.globalConfig = config;
    this.servers = [];
  }
  async deploy(env: string) {
    // Check env is existed
    if (!this.globalConfig[env]) {
      throw Error(`Environment ${env} does not exist in config file!`);
    }

    this.config = { ...this.globalConfig.default, ...this.globalConfig[env] };

    log('Starting deployment');
    log(`${tab()}Environment: ${chalk.green(env)}`);

    if (this.config.keepReleases) {
      await this.deployWithReleases();
    } else {
      await this.deployWithoutReleases();
    }
  }

  async deployWithReleases() {
    const releaseId = XPD.getReleaseId();
    const date = new Date();

    log(`${tab()}Release ID: ${chalk.green(releaseId)}`);
    log();

    // Check dist dir
    try {
      accessSync(this.config.deployFrom, constants.F_OK);
    } catch (e) {
      throw Error('Deploy folder does not exist');
    }

    // Create servers pool
    this.createServersPool(this.config.servers);

    try {
      if (this.config.preDeploy) {
        log('Run PreDeploy tasks');
        await this.deployTasks(this.config.preDeploy);
      }
      log('Create release folder');
      await this.execRemote(
        `if [ ! -d ${this.config.deployTo}/releases ]; then mkdir ${this.config.deployTo
        }/releases; fi`
      );
      await this.copyLastRelease(releaseId);
      log('Copy files to server');
      await this.deployRsync(releaseId);

      log('Change symlink');
      await this.execRemote(
        `cd ${this.config.deployTo} &&
        if [ -d current ] && [ ! -L current ]; then
        echo "ERR: could not make symlink"; else
        ln -nfs ./releases/${releaseId} current_tmp &&
        mv -fT current_tmp current; fi
        `
      );
      if (this.config.postDeploy) {
        log('Run PostDeploy tasks');
        await this.deployTasks(this.config.postDeploy);
      }
      log('Delete old releases');
      await this.execRemote(
        `(ls -rd ${this.config.deployTo}/releases/*|head -n ${this.config.keepReleases
        };ls -d ${this.config.deployTo}/releases/*)|sort|uniq -u|xargs rm -rf`
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

  async deployWithoutReleases() {
    const date = new Date();

    // Check dist dir
    try {
      accessSync(this.config.deployFrom, constants.F_OK);
    } catch (e) {
      throw Error('Deploy folder does not exist');
    }

    // Create servers pool
    this.createServersPool(this.config.servers);

    try {
      if (this.config.preDeploy) {
        log('Run PreDeploy tasks');
        await this.deployTasks(this.config.preDeploy);
      }

      log('Copy files to server');
      await this.deployRsync();


      if (this.config.postDeploy) {
        log('Run PostDeploy tasks');
        await this.deployTasks(this.config.postDeploy);
      }

      log(
        chalk.green(
          `Completed after ${new Date().getTime() - date.getTime()} ms`
        )
      );
    } catch (e) {
      throw e;
    }
  }

  private async deployRsync(releaseId?: string) {
    const pool = [];
    for (const server of this.servers) {
      if (this.config.keepReleases) {
        pool.push(
            local(
                `rsync --del -avr ${this.config.deployFrom}/ ${this.config.user
                }@${server}:${this.config.deployTo}/releases/${releaseId}/`
            )
        );
      } else {
        pool.push(
            local(
                `rsync --del -avr ${this.config.deployFrom}/* ${this.config.user
                }@${server}:${this.config.deployTo}`
            )
        );
      }
    }
    try {
      return await Promise.all(pool);
    } catch (e) {
      throw Error(e);
    }
  }

  private async copyLastRelease(releaseId: string) {
    const lastRelease = await this.getCurrentReleaseName();
    if (!lastRelease || !this.config.copy) return;
    log(`Copy previous release to ${releaseId}`);
    return await this.execRemote(
      `cp -a ${this.config.deployTo}/releases/${lastRelease} ${this.config.deployTo
      }/releases/${releaseId}`
    );
  }

  private async getCurrentReleaseName() {
    const result =
      (await this.execRemote(
        `if [ -h ${this.config.deployTo}/current ]; then readlink ${this.config.deployTo
        }/current; fi`
      )) || [];
    const releaseDirnames = result.map(computeReleaseDirname);
    if (!equalValues(releaseDirnames)) {
      throw Error('Remote servers are not synced.');
    }
    if (!releaseDirnames[0]) {
      log(chalk.yellow('No current release found.'));
      return null;
    }
    return releaseDirnames[0];
  }

  private async execRemote(cmd: string) {
    const pool = [];
    for (const server of this.servers) {
      pool.push(remote(this.config.user, server, cmd));
    }
    return Promise.all(pool).catch(e => {
      throw Error(e);
    });
  }

  private async deployTasks(tasks: IXpdTasks) {
    const local = tasks.local;
    const remote = tasks.remote;
    if (local) {
      if (typeof local === 'string') {
        await this.runTask(local, true);
      } else {
        for (const task of local) {
          await this.runTask(task, true);
        }
      }
    }
    if (remote) {
      if (typeof remote === 'string') {
        await this.runTask(remote, false);
      } else {
        for (const task of remote) {
          await this.runTask(task, false);
        }
      }
    }
  }

  private async runTask(cmd: string, loc: boolean) {
    if (loc) {
      await local(cmd);
    } else {
      await this.execRemote(cmd);
    }
  }

  private createServersPool(servers: string | Array<string>) {
    if (typeof servers === 'string') {
      this.servers.push(servers);
    } else if (Array.isArray(servers)) {
      for (const server of servers) {
        this.servers.push(server);
      }
    } else {
      throw Error('Unknown servers format');
    }
  }

  private static getReleaseId(): string {
    const date = new Date();
    return `${date.getUTCFullYear()}${('0' + (date.getUTCMonth() + 1)).slice(
      -2
    )}${('0' + date.getUTCDate()).slice(-2)}${('0' + date.getHours()).slice(
      -2
    )}${('0' + date.getUTCMinutes()).slice(-2)}${(
      '0' + date.getUTCSeconds()
    ).slice(-2)}`;
  }
}

export default XPD;
