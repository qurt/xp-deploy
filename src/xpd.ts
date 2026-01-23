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

  async rollback(env: string, count: number = 1) {
    // Check env is existed
    if (!this.globalConfig[env]) {
      throw Error(`Environment ${env} does not exist in config file!`);
    }

    this.config = { ...this.globalConfig.default, ...this.globalConfig[env] };

    // Check that keepReleases is configured
    if (!this.config.keepReleases) {
      throw Error('Rollback is only available when keepReleases is configured');
    }

    log('Starting rollback');
    log(`${tab()}Environment: ${chalk.green(env)}`);
    log(`${tab()}Rollback count: ${chalk.green(count)}`);

    // Create servers pool
    this.createServersPool(this.config.servers);

    try {
      // Get all releases sorted by date (newest first)
      const allReleases = await this.getAllReleases();
      
      if (allReleases.length === 0) {
        throw Error('No releases found on server');
      }

      // Get current release
      const currentRelease = await this.getCurrentReleaseName();
      if (!currentRelease) {
        throw Error('No current release found');
      }

      // Find current release index
      const currentIndex = allReleases.indexOf(currentRelease);
      if (currentIndex === -1) {
        throw Error(`Current release ${currentRelease} not found in releases list`);
      }

      // Calculate target index
      const targetIndex = currentIndex + count;

      // Validate that target index is valid
      if (targetIndex >= allReleases.length) {
        throw Error(
          `Cannot rollback ${count} release(s). Only ${allReleases.length - currentIndex - 1} release(s) available.`
        );
      }

      const targetRelease = allReleases[targetIndex];
      log(`${tab()}Current release: ${chalk.yellow(currentRelease)}`);
      log(`${tab()}Target release: ${chalk.green(targetRelease)}`);

      // Change symlink to target release
      log('Change symlink');
      await this.execRemote(
        `cd ${this.config.deployTo} &&
        if [ -d current ] && [ ! -L current ]; then
        echo "ERR: could not make symlink"; else
        ln -nfs ./releases/${targetRelease} current_tmp &&
        mv -fT current_tmp current; fi
        `
      );

      log(chalk.green(`Rollback completed successfully to release ${targetRelease}`));
    } catch (e) {
      throw e;
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

  private async getAllReleases(): Promise<Array<string>> {
    const result = await this.execRemote(
      `if [ -d ${this.config.deployTo}/releases ]; then ls -rd ${this.config.deployTo}/releases/* 2>/dev/null | xargs -n1 basename; fi`
    );
    
    // Get releases from first server (they should all be synced)
    const releases = result[0]?.split('\n').filter(r => r.trim().length > 0) || [];
    
    // Verify all servers have the same releases
    for (let i = 1; i < result.length; i++) {
      const serverReleases = result[i]?.split('\n').filter(r => r.trim().length > 0) || [];
      if (releases.length !== serverReleases.length) {
        throw Error('Remote servers have different releases. Servers are not synced.');
      }
      for (let j = 0; j < releases.length; j++) {
        if (releases[j] !== serverReleases[j]) {
          throw Error('Remote servers have different releases. Servers are not synced.');
        }
      }
    }
    
    return releases;
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
