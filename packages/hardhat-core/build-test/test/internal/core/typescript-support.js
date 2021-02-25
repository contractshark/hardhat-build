"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const task_names_1 = require("../../../src/builtin-tasks/task-names");
const reset_1 = require("../../../src/internal/reset");
const environment_1 = require("../../helpers/environment");
const project_1 = require("../../helpers/project");
describe("Typescript support", function () {
    describe("strict typescript config", function () {
        project_1.useFixtureProject("broken-typescript-config-project");
        it("Should fail if an implicit any is used and the tsconfig forbids them", function () {
            // If we run this test in transpilation only mode, it will fail
            this.skip();
            chai_1.assert.throws(() => require("../../../src/internal/lib/hardhat-lib"), "TS7006");
            reset_1.resetHardhatContext();
        });
    });
    describe("hardhat.config.ts", function () {
        project_1.useFixtureProject("typescript-project");
        environment_1.useEnvironment();
        it("Should load the config", function () {
            chai_1.assert.isDefined(this.env.config.networks.network);
        });
    });
    describe("Typescript scripts", function () {
        project_1.useFixtureProject("typescript-project");
        environment_1.useEnvironment();
        it("Should run ts scripts", async function () {
            await this.env.run("run", { script: "./script.ts", noCompile: true });
            chai_1.assert.equal(process.exitCode, 123);
            process.exitCode = undefined;
        });
    });
    describe("Typescript tests", function () {
        project_1.useFixtureProject("typescript-project");
        environment_1.useEnvironment();
        it("Should see the TS test", async function () {
            const tests = await this.env.run(task_names_1.TASK_TEST_GET_TEST_FILES, {
                testFiles: [],
            });
            chai_1.assert.deepEqual(tests.sort(), [
                await fs_extra_1.default.realpath("test/js-test.js"),
                await fs_extra_1.default.realpath("test/ts-test.ts"),
            ]);
        });
    });
});
//# sourceMappingURL=typescript-support.js.map