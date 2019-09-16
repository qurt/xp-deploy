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
    const xpd = new XPD(config);
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
});
