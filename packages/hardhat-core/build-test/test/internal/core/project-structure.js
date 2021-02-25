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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fsExtra = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const errors_list_1 = require("../../../src/internal/core/errors-list");
const project_structure_1 = require("../../../src/internal/core/project-structure");
const errors_1 = require("../../helpers/errors");
const project_1 = require("../../helpers/project");
describe("project structure", () => {
    describe("isCwdInsideProject", () => {
        it("should return false if cwd is not inside a project", () => {
            chai_1.assert.isFalse(project_structure_1.isCwdInsideProject());
        });
        describe("Inside a project", () => {
            project_1.useFixtureProject("default-config-project");
            it("should return true if cwd is the project's", () => {
                chai_1.assert.isTrue(project_structure_1.isCwdInsideProject());
            });
            it("should return true if cwd is deeper inside the project", () => {
                process.chdir("contracts");
                chai_1.assert.isTrue(project_structure_1.isCwdInsideProject());
            });
        });
    });
    describe("getUserConfigPath", () => {
        it("should throw if cwd is not inside a project", () => {
            errors_1.expectHardhatError(() => project_structure_1.getUserConfigPath(), errors_list_1.ERRORS.GENERAL.NOT_INSIDE_PROJECT);
        });
        describe("Inside a project", () => {
            project_1.useFixtureProject("default-config-project");
            let configPath;
            before("get root path", async () => {
                // TODO: This is no longer needed once PR #71 gets merged
                const pathToFixtureRoot = await fsExtra.realpath(path_1.default.join(__dirname, "..", "..", "fixture-projects", "default-config-project"));
                configPath = await fsExtra.realpath(path_1.default.join(pathToFixtureRoot, "hardhat.config.js"));
            });
            it("should work from the project root", () => {
                chai_1.assert.equal(project_structure_1.getUserConfigPath(), configPath);
            });
            it("should work from deeper inside the project", () => {
                process.chdir("contracts");
                chai_1.assert.equal(project_structure_1.getUserConfigPath(), configPath);
            });
        });
    });
});
describe("getRecommendedGitIgnore", () => {
    it("Should return the one from this repo", async () => {
        const content = await fsExtra.readFile(path_1.default.join(__dirname, "..", "..", "..", "recommended-gitignore.txt"), "utf-8");
        chai_1.assert.equal(await project_structure_1.getRecommendedGitIgnore(), content);
    });
});
//# sourceMappingURL=project-structure.js.map