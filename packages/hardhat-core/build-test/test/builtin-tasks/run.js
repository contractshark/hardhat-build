"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fsExtra = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const artifacts_1 = require("../../src/internal/artifacts");
const errors_list_1 = require("../../src/internal/core/errors-list");
const environment_1 = require("../helpers/environment");
const errors_1 = require("../helpers/errors");
const project_1 = require("../helpers/project");
describe("run task", function () {
    project_1.useFixtureProject("project-with-scripts");
    environment_1.useEnvironment();
    it("Should fail if a script doesn't exist", async function () {
        await errors_1.expectHardhatErrorAsync(() => this.env.run("run", { script: "./does-not-exist", noCompile: true }), errors_list_1.ERRORS.BUILTIN_TASKS.RUN_FILE_NOT_FOUND);
    });
    it("Should run the scripts to completion", async function () {
        await this.env.run("run", {
            script: "./async-script.js",
            noCompile: true,
        });
        chai_1.assert.equal(process.exitCode, 0);
        process.exitCode = undefined;
    });
    it("Should compile before running", async function () {
        if (await fsExtra.pathExists("cache")) {
            await fsExtra.remove("cache");
        }
        if (await fsExtra.pathExists("artifacts")) {
            await fsExtra.remove("artifacts");
        }
        await this.env.run("run", {
            script: "./successful-script.js",
        });
        chai_1.assert.equal(process.exitCode, 0);
        process.exitCode = undefined;
        const artifacts = new artifacts_1.Artifacts(path.join(process.cwd(), "artifacts"));
        const files = await artifacts.getArtifactPaths();
        const expectedFile = path.join(process.cwd(), "artifacts/contracts/a.sol/A.json");
        chai_1.assert.sameMembers(files, [expectedFile]);
        await fsExtra.remove("artifacts");
    });
    it("Shouldn't compile if asked not to", async function () {
        if (await fsExtra.pathExists("cache")) {
            await fsExtra.remove("cache");
        }
        if (await fsExtra.pathExists("artifacts")) {
            await fsExtra.remove("artifacts");
        }
        await this.env.run("run", {
            script: "./successful-script.js",
            noCompile: true,
        });
        chai_1.assert.equal(process.exitCode, 0);
        process.exitCode = undefined;
        chai_1.assert.isFalse(await fsExtra.pathExists("artifacts"));
    });
    it("Should return the script's status code on success", async function () {
        await this.env.run("run", {
            script: "./successful-script.js",
            noCompile: true,
        });
        chai_1.assert.equal(process.exitCode, 0);
        process.exitCode = undefined;
    });
    it("Should return the script's status code on failure", async function () {
        await this.env.run("run", {
            script: "./failing-script.js",
            noCompile: true,
        });
        chai_1.assert.notEqual(process.exitCode, 0);
        process.exitCode = undefined;
    });
});
//# sourceMappingURL=run.js.map