"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const task_names_1 = require("../../src/builtin-tasks/task-names");
const environment_1 = require("../helpers/environment");
const project_1 = require("../helpers/project");
function getContractsOrder(flattenedFiles) {
    const CONTRACT_REGEX = /\s*contract(\s+)(\w)/gm;
    const matches = flattenedFiles.match(CONTRACT_REGEX);
    return matches.map((m) => m.replace("contract", "").trim());
}
describe("Flatten task", () => {
    environment_1.useEnvironment();
    describe("When there no contracts", function () {
        project_1.useFixtureProject("default-config-project");
        it("should return empty string", async function () {
            const flattenedFiles = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE);
            chai_1.assert.equal(flattenedFiles.length, 0);
        });
    });
    describe("When has contracts", function () {
        project_1.useFixtureProject("contracts-project");
        it("should flatten files sorted correctly", async function () {
            const flattenedFiles = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE);
            chai_1.assert.deepEqual(getContractsOrder(flattenedFiles), ["C", "B", "A"]);
        });
    });
    describe("When has contracts with name clash", function () {
        project_1.useFixtureProject("contracts-nameclash-project");
        it("should flatten files sorted correctly with repetition", async function () {
            const flattenedFiles = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE);
            chai_1.assert.deepEqual(getContractsOrder(flattenedFiles), ["C", "B", "A", "C"]);
        });
    });
    describe("Flattening only some files", function () {
        project_1.useFixtureProject("contracts-project");
        it("Should accept a list of files, and only flatten those and their dependencies", async function () {
            const cFlattened = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE, {
                files: ["contracts/C.sol"],
            });
            chai_1.assert.deepEqual(getContractsOrder(cFlattened), ["C"]);
            const bFlattened = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE, {
                files: ["contracts/B.sol"],
            });
            chai_1.assert.deepEqual(getContractsOrder(bFlattened), ["C", "B"]);
            const baFlattened = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE, {
                files: ["contracts/B.sol", "contracts/A.sol"],
            });
            chai_1.assert.deepEqual(getContractsOrder(baFlattened), ["C", "B", "A"]);
        });
    });
    describe("When project has multiline imports", function () {
        project_1.useFixtureProject("multiline-import-project");
        it("should not include multiline imports", async function () {
            const flattenedFiles = await this.env.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE);
            chai_1.assert.isFalse(flattenedFiles.includes("} from"));
        });
    });
});
//# sourceMappingURL=flatten.js.map