"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectErrorAsync = void 0;
const chai_1 = require("chai");
// tslint:disable-next-line no-implicit-dependencies
const fs_extra_1 = require("fs-extra");
const helpers_1 = require("./helpers");
async function expectErrorAsync(f, errorMessage) {
    try {
        await f();
    }
    catch (err) {
        chai_1.assert.equal(err.message, errorMessage);
    }
}
exports.expectErrorAsync = expectErrorAsync;
describe("Solhint plugin", function () {
    const SOLHINT_CONFIG_FILENAME = ".solhint.json";
    describe("Project with solhint config", function () {
        helpers_1.useEnvironment("hardhat-project");
        it("should define solhint task", function () {
            chai_1.assert.isDefined(this.env.tasks["hardhat-solhint:run-solhint"]);
            chai_1.assert.isDefined(this.env.tasks.check);
        });
        it("return a report", async function () {
            const reports = await this.env.run("hardhat-solhint:run-solhint");
            chai_1.assert.equal(reports.length, 1);
            chai_1.assert.isTrue(
            // This test is a little sloppy, but the actual number doesn't matter
            // and it was failing very often when solhint released new versions
            reports[0].reports.length >= 5);
        });
    });
    describe("Project with no solhint config", function () {
        helpers_1.useEnvironment("no-config-project");
        it("return a report", async function () {
            const reports = await this.env.run("hardhat-solhint:run-solhint");
            chai_1.assert.equal(reports.length, 1);
            chai_1.assert.equal(reports[0].reports[0].ruleId, "max-line-length");
        });
    });
    describe("Project with invalid solhint configs", function () {
        helpers_1.useEnvironment("invalid-config-project");
        it("should throw when using invalid extensions", async function () {
            const invalidExtensionConfig = {
                extends: "invalid",
            };
            await fs_extra_1.writeJson(SOLHINT_CONFIG_FILENAME, invalidExtensionConfig);
            await expectErrorAsync(() => this.env.run("hardhat-solhint:run-solhint"), "An error occurred when processing your solhint config.");
        });
        it("should throw when using invalid rules", async function () {
            const invalidRuleConfig = {
                rules: {
                    "invalid-rule": false,
                },
            };
            await fs_extra_1.writeJson(SOLHINT_CONFIG_FILENAME, invalidRuleConfig);
            await expectErrorAsync(() => this.env.run("hardhat-solhint:run-solhint"), "An error occurred when processing your solhint config.");
        });
        it("should throw when using a non parsable config", async function () {
            const invalidConfig = "asd";
            await fs_extra_1.writeFile(SOLHINT_CONFIG_FILENAME, invalidConfig);
            await expectErrorAsync(() => this.env.run("hardhat-solhint:run-solhint"), "An error occurred when loading your solhint config.");
        });
        after(async () => {
            await fs_extra_1.unlink(SOLHINT_CONFIG_FILENAME);
        });
    });
});
//# sourceMappingURL=tests.js.map