import { jest, describe, it, expect } from '@jest/globals';
import XPD from "../src/xpd";
import { config } from "./xpd.test.config";

describe("XPD", () => {
  it("Should be initialized", () => {
    const xpd = new XPD({});
    expect(xpd).toBeDefined();
  });
  it("Should be crashed with empty config", async () => {
    const xpd = new XPD({});
    xpd.deploy("test").catch(err => {
      expect(err.message).toBe(
        "Environment test does not exist in config file!"
      );
    });
  });
  it("Should be crashed if dist folder does't exists", () => {
    const xpd = new XPD(config as any);
    xpd.deploy('test').catch(err => {
      expect(err.message).toBe('Deploy folder does not exist')
    })
  });

  describe('Server pool', () => {
    it('Should be created with one server', () => {
      const xpd = new XPD({});
      xpd['createServersPool']('1');
      expect(xpd.servers).toHaveLength(1);
    });
    it('Should be created with many servers', () => {
      const xpd = new XPD({});
      xpd['createServersPool'](['1', '2']);
      expect(xpd.servers).toHaveLength(2);
    });
    it('Should be crashed', () => {
      const xpd = new XPD({});
      // @ts-ignore
      expect(() => {xpd['createServersPool']({});}).toThrow(Error("Unknown servers format"))
    })
  })

  describe('Rollback', () => {
    it('Should throw error if environment does not exist', async () => {
      const xpd = new XPD({});
      await expect(xpd.rollback('nonexistent')).rejects.toThrow(
        'Environment nonexistent does not exist in config file!'
      );
    });

    it('Should throw error if keepReleases is not configured', async () => {
      const configWithoutReleases = {
        default: {
          user: "dev",
          deployTo: "/home/dev/www/test",
          deployFrom: "./dist",
          servers: "test.example.com"
        },
        test: {
          user: "dev",
          deployTo: "/home/dev/www/test",
          deployFrom: "./dist",
          servers: "test.example.com"
        }
      };
      const xpd = new XPD(configWithoutReleases);
      await expect(xpd.rollback('test')).rejects.toThrow(
        'Rollback is only available when keepReleases is configured'
      );
    });

    it('Should throw error if no releases found on server', async () => {
      const xpd = new XPD(config as any);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue([]);

      await expect(xpd.rollback('test')).rejects.toThrow(
        'No releases found on server'
      );
    });

    it('Should throw error if no current release found', async () => {
      const xpd = new XPD(config as any);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue(['20240101120000', '20240101110000']);
      jest.spyOn(xpd as any, 'getCurrentReleaseName').mockResolvedValue(null);

      await expect(xpd.rollback('test')).rejects.toThrow(
        'No current release found'
      );
    });

    it('Should throw error if current release not found in releases list', async () => {
      const xpd = new XPD(config as any);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue(['20240101120000', '20240101110000']);
      jest.spyOn(xpd as any, 'getCurrentReleaseName').mockResolvedValue('20240101130000');

      await expect(xpd.rollback('test')).rejects.toThrow(
        'Current release 20240101130000 not found in releases list'
      );
    });

    it('Should throw error if rollback count exceeds available releases', async () => {
      const xpd = new XPD(config as any);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue(['20240101120000', '20240101110000']);
      jest.spyOn(xpd as any, 'getCurrentReleaseName').mockResolvedValue('20240101120000');

      await expect(xpd.rollback('test', 2)).rejects.toThrow(
        'Cannot rollback 2 release(s). Only 1 release(s) available.'
      );
    });

    it('Should successfully rollback to previous release (default count)', async () => {
      const xpd = new XPD(config as any);
      const execRemoteSpy = jest.spyOn(xpd as any, 'execRemote').mockResolvedValue(['']);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue([
        '20240101120000',
        '20240101110000',
        '20240101100000'
      ]);
      jest.spyOn(xpd as any, 'getCurrentReleaseName').mockResolvedValue('20240101120000');

      await xpd.rollback('test');

      expect(execRemoteSpy).toHaveBeenCalledWith(
        expect.stringContaining('ln -nfs ./releases/20240101110000 current_tmp')
      );
    });

    it('Should successfully rollback to N releases back', async () => {
      const xpd = new XPD(config as any);
      const execRemoteSpy = jest.spyOn(xpd as any, 'execRemote').mockResolvedValue(['']);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue([
        '20240101120000',
        '20240101110000',
        '20240101100000',
        '20240101090000'
      ]);
      jest.spyOn(xpd as any, 'getCurrentReleaseName').mockResolvedValue('20240101120000');

      await xpd.rollback('test', 2);

      expect(execRemoteSpy).toHaveBeenCalledWith(
        expect.stringContaining('ln -nfs ./releases/20240101100000 current_tmp')
      );
    });

    it('Should throw error if servers have different releases', async () => {
      const xpd = new XPD(config as any);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockRejectedValue(
        new Error('Remote servers have different releases. Servers are not synced.')
      );

      await expect(xpd.rollback('test')).rejects.toThrow(
        'Remote servers have different releases. Servers are not synced.'
      );
    });

    it('Should handle multiple servers with same releases', async () => {
      const multiServerConfig = {
        default: {
          user: "dev",
          deployTo: "/home/dev/www/test",
          deployFrom: "./dist",
          keepReleases: 2,
          servers: "server1.com"
        },
        test: {
          user: "dev",
          deployTo: "/home/dev/www/test",
          deployFrom: "./dist",
          servers: ["server1.com", "server2.com"]
        }
      };
      const xpd = new XPD(multiServerConfig as any);
      const execRemoteSpy = jest.spyOn(xpd as any, 'execRemote').mockResolvedValue(['', '']);
      jest.spyOn(xpd as any, 'createServersPool').mockImplementation(() => {});
      jest.spyOn(xpd as any, 'getAllReleases').mockResolvedValue([
        '20240101120000',
        '20240101110000'
      ]);
      jest.spyOn(xpd as any, 'getCurrentReleaseName').mockResolvedValue('20240101120000');

      await xpd.rollback('test');

      expect(execRemoteSpy).toHaveBeenCalled();
    });
  })
});
