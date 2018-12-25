import chalk from "chalk";

var stdMocks = require("std-mocks");

const log = console.log;

interface XpdConfig {
  user: string;
  deployTo: string;
  deployFrom: string;
  ignores?: Array<string>;
  keepReleases: number;
  servers: string | Array<string>;
  "pre-deploy"?: Function;
  "post-deploy"?: Function;
}

class XPD {
  config: XpdConfig;
  constructor(config: XpdConfig) {
    this.config = config;
  }
  deloy(env: string) {
    stdMocks.use();
    process.stdout.write("ok");
    console.log("log test\n");
    stdMocks.restore();
    var output = stdMocks.flush();
    console.log(output.stdout);
    // log("Starting deployment");
    // log(`    Environment: ${chalk.green(env)}`);
  }
}

export default XPD;
