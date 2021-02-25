"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const scripts_runner_1 = require("../../../src/internal/util/scripts-runner");
const environment_1 = require("../../helpers/environment");
const project_1 = require("../../helpers/project");
describe("Scripts runner", function () {
    project_1.useFixtureProject("project-with-scripts");
    it("Should pass params to the script", async function () {
        const [statusCodeWithScriptParams, statusCodeWithNoParams,] = await Promise.all([
            scripts_runner_1.runScript("./params-script.js", ["a", "b", "c"]),
            scripts_runner_1.runScript("./params-script.js"),
        ]);
        chai_1.assert.equal(statusCodeWithScriptParams, 0);
        // We check here that the script is correctly testing this:
        chai_1.assert.notEqual(statusCodeWithNoParams, 0);
    });
    it("Should run the script to completion", async function () {
        const before = new Date();
        const status = await scripts_runner_1.runScript("./async-script.js");
        chai_1.assert.equal(status, 123);
        const after = new Date();
        chai_1.assert.isAtLeast(after.getTime() - before.getTime(), 100);
    });
    it("Should resolve to the status code of the script run", async function () {
        chai_1.assert.deepEqual(await scripts_runner_1.runScript("./failing-script.js"), 123);
    });
    it("Should pass env variables to the script", async function () {
        const [statusCodeWithEnvVars, statusCodeWithNoEnvArgs] = await Promise.all([
            scripts_runner_1.runScript("./env-var-script.js", [], [], {
                TEST_ENV_VAR: "test",
            }),
            scripts_runner_1.runScript("./env-var-script.js"),
        ]);
        chai_1.assert.equal(statusCodeWithEnvVars, 0, "Status code with env vars should be 0");
        chai_1.assert.notEqual(statusCodeWithNoEnvArgs, 0, "Status code with no env vars should not be 0");
    });
    describe("runWithHardhat", function () {
        environment_1.useEnvironment();
        it("Should load hardhat/register successfully", async function () {
            const [statusCodeWithHardhat, statusCodeWithoutHardhat,] = await Promise.all([
                scripts_runner_1.runScriptWithHardhat(this.env.hardhatArguments, "./successful-script.js"),
                scripts_runner_1.runScript("./successful-script.js"),
            ]);
            chai_1.assert.equal(statusCodeWithHardhat, 0);
            // We check here that the script is correctly testing this:
            chai_1.assert.notEqual(statusCodeWithoutHardhat, 0);
        });
        it("Should forward all the hardhat arguments", async function () {
            // This is only for testing purposes, as we can't set a hardhat argument
            // as the CLA does, and env variables always get forwarded to child
            // processes
            this.env.hardhatArguments.network = "custom";
            const statusCode = await scripts_runner_1.runScriptWithHardhat(this.env.hardhatArguments, "./assert-hardhat-arguments.js");
            chai_1.assert.equal(statusCode, 0);
        });
    });
});
//# sourceMappingURL=scripts-runner.js.map