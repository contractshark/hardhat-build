"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const reset_1 = require("../../../src/internal/reset");
const environment_1 = require("../../helpers/environment");
const project_1 = require("../../helpers/project");
describe("Hardhat lib", () => {
    project_1.useFixtureProject("config-project");
    environment_1.useEnvironment();
    before(() => {
        process.env.HARDHAT_NETWORK = "localhost";
    });
    it("should load environment", function () {
        chai_1.assert.isDefined(this.env.config.networks.custom);
    });
    it("should load task user defined task", async function () {
        chai_1.assert.isDefined(this.env.tasks.example2);
        chai_1.assert.equal(await this.env.run("example2"), 28);
    });
    it("should reuse global state", async function () {
        let environment = require("../../../src/internal/lib/hardhat-lib");
        chai_1.assert.isTrue(this.env === environment);
        reset_1.resetHardhatContext();
        environment = require("../../../src/internal/lib/hardhat-lib");
        chai_1.assert.equal(await environment.run("example"), 28);
        chai_1.assert.isFalse(this.env === environment);
    });
});
//# sourceMappingURL=hardhat-lib.js.map