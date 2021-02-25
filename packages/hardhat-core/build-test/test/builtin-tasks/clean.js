"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const task_names_1 = require("../../src/builtin-tasks/task-names");
const environment_1 = require("../helpers/environment");
const project_1 = require("../helpers/project");
function assertCleanBehavior() {
    it("Should delete the folders if present", async function () {
        await this.env.run(task_names_1.TASK_CLEAN);
        const cacheContents = fs_extra_1.default.readdirSync("./cache");
        chai_1.assert.isTrue(cacheContents.length === 0);
        chai_1.assert.isFalse(fs_extra_1.default.existsSync("./artifacts"));
    });
}
describe("Clean task", () => {
    project_1.useFixtureProject("default-config-project");
    environment_1.useEnvironment();
    describe("When cache and artifact dirs don't exist", function () {
        beforeEach(() => {
            fs_extra_1.default.removeSync("cache");
            fs_extra_1.default.removeSync("artifacts");
        });
        assertCleanBehavior();
    });
    describe("When cache and artifact are empty dirs", function () {
        beforeEach(() => {
            fs_extra_1.default.emptyDirSync("./cache");
            fs_extra_1.default.emptyDirSync("./artifacts");
        });
        assertCleanBehavior();
    });
    describe("When cache and artifact dirs aren't empty", function () {
        beforeEach(() => {
            fs_extra_1.default.emptyDirSync("./cache");
            fs_extra_1.default.emptyDirSync("./artifacts");
            fs_extra_1.default.writeFileSync("./cache/a", "");
            fs_extra_1.default.writeFileSync("./artifacts/a", "");
        });
        assertCleanBehavior();
    });
});
//# sourceMappingURL=clean.js.map