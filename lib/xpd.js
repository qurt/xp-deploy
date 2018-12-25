"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stdMocks = require("std-mocks");
const log = console.log;
class XPD {
    constructor(config) {
        this.config = config;
    }
    deloy(env) {
        stdMocks.use();
        process.stdout.write("ok");
        console.log("log test\n");
        stdMocks.restore();
        var output = stdMocks.flush();
        console.log(output.stdout);
    }
}
exports.default = XPD;
