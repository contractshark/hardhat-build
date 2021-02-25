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
const os = __importStar(require("os"));
const autocomplete_1 = require("../../../src/internal/cli/autocomplete");
const reset_1 = require("../../../src/internal/reset");
const project_1 = require("../../helpers/project");
/**
 * Receive the line that is being completed, for example:
 * - `hh ` is the minimal line that can be completed (notice the space!)
 * - `hh comp` means that the cursor is immediately after the word
 * - `hh --network | compile` you can optionally use `|` to indicate the cursor's position; otherwise it is assumed the cursor is at the end
 */
async function complete(lineWithCursor) {
    const point = lineWithCursor.indexOf("|");
    const line = lineWithCursor.replace("|", "");
    return autocomplete_1.complete({
        line,
        point: point !== -1 ? point : line.length,
    });
}
const coreTasks = [
    {
        description: "Check whatever you need",
        name: "check",
    },
    {
        description: "Clears the cache and deletes all artifacts",
        name: "clean",
    },
    {
        description: "Compiles the entire project, building all artifacts",
        name: "compile",
    },
    {
        description: "Opens a hardhat console",
        name: "console",
    },
    {
        description: "Flattens and prints contracts and their dependencies",
        name: "flatten",
    },
    {
        description: "Prints this message",
        name: "help",
    },
    {
        description: "Starts a JSON-RPC server on top of Hardhat Network",
        name: "node",
    },
    {
        description: "Runs a user-defined script after compiling the project",
        name: "run",
    },
    {
        description: "Runs mocha tests",
        name: "test",
    },
];
const verboseParam = {
    description: "Enables Hardhat verbose logging",
    name: "--verbose",
};
const versionParam = {
    description: "Shows hardhat's version.",
    name: "--version",
};
const coreParams = [
    {
        description: "The network to connect to.",
        name: "--network",
    },
    {
        description: "Show stack traces.",
        name: "--show-stack-traces",
    },
    {
        description: "Shows this message, or a task's help if its name is provided",
        name: "--help",
    },
    {
        description: "Use emoji in messages.",
        name: "--emoji",
    },
    {
        description: "A Hardhat config file.",
        name: "--config",
    },
    {
        description: "The maximum amount of memory that Hardhat can use.",
        name: "--max-memory",
    },
    {
        description: "Reserved hardhat argument -- Has no effect.",
        name: "--tsconfig",
    },
    verboseParam,
    versionParam,
];
const forceParam = {
    description: "Force compilation ignoring cache",
    name: "--force",
};
const quietParam = {
    description: "Makes the compilation process less verbose",
    name: "--quiet",
};
describe("autocomplete", function () {
    if (os.type() === "Windows_NT") {
        return;
    }
    describe("basic project", () => {
        project_1.useFixtureProject("autocomplete/basic-project");
        after(() => {
            reset_1.resetHardhatContext();
        });
        it("should suggest all task names", async () => {
            const suggestions = await complete("hh ");
            chai_1.expect(suggestions).to.have.deep.members(coreTasks);
        });
        it("should suggest all core params after a -", async () => {
            const suggestions = await complete("hh -");
            chai_1.expect(suggestions).to.have.deep.members(coreParams);
        });
        it("should suggest all core params after a --", async () => {
            const suggestions = await complete("hh --");
            chai_1.expect(suggestions).same.deep.members(coreParams);
        });
        it("should suggest ony matching flags", async () => {
            const suggestions = await complete("hh --ve");
            chai_1.expect(suggestions).same.deep.members([
                {
                    name: "--verbose",
                    description: "Enables Hardhat verbose logging",
                },
                {
                    name: "--version",
                    description: "Shows hardhat's version.",
                },
            ]);
        });
        it("shouldn't suggest an already used flag", async () => {
            const suggestions = await complete("hh --verbose -");
            const coreParamsWithoutVerbose = coreParams.filter((x) => x.name !== "--verbose");
            chai_1.expect(suggestions).same.deep.members(coreParamsWithoutVerbose);
        });
        it("should suggest task flags", async () => {
            const suggestions = await complete("hh compile -");
            chai_1.expect(suggestions).same.deep.members([
                ...coreParams,
                forceParam,
                quietParam,
            ]);
        });
        it("should ignore already used flags", async () => {
            const suggestions = await complete("hh --verbose compile --quiet --");
            const coreParamsWithoutVerbose = coreParams.filter((x) => x.name !== "--verbose");
            chai_1.expect(suggestions).same.deep.members([
                ...coreParamsWithoutVerbose,
                forceParam,
            ]);
        });
        it("should suggest a network", async () => {
            const suggestions = await complete("hh --network ");
            chai_1.expect(suggestions).same.deep.members([
                { name: "hardhat", description: "" },
                { name: "localhost", description: "" },
            ]);
        });
        it("should suggest task names after global param", async () => {
            const suggestions = await complete("hh --network localhost ");
            chai_1.expect(suggestions).same.deep.members(coreTasks);
        });
        it("should suggest params after some param", async () => {
            const suggestions = await complete("hh --network localhost -");
            const coreParamsWithoutNetwork = coreParams.filter((x) => x.name !== "--network");
            chai_1.expect(suggestions).same.deep.members(coreParamsWithoutNetwork);
        });
        it("should work when the cursor is not at the end", async () => {
            const suggestions = await complete("hh --network | test");
            chai_1.expect(suggestions).same.deep.members([
                { name: "hardhat", description: "" },
                { name: "localhost", description: "" },
            ]);
        });
        it("should not suggest flags used after the cursor", async () => {
            const suggestions = await complete("hh --| test --verbose");
            const coreParamsWithoutVerbose = coreParams.filter((x) => x.name !== "--verbose");
            chai_1.expect(suggestions).same.deep.members([
                ...coreParamsWithoutVerbose,
                {
                    description: "Don't compile before running this task",
                    name: "--no-compile",
                },
            ]);
        });
        it("should work when the cursor is at the middle and in a partial word", async () => {
            const suggestions = await complete("hh com| --verbose");
            chai_1.expect(suggestions).same.deep.members([
                {
                    name: "compile",
                    description: "Compiles the entire project, building all artifacts",
                },
            ]);
        });
        it("should show suggestions after a partial network value", async () => {
            const suggestions = await complete("hh --network loc");
            chai_1.expect(suggestions).same.deep.members([
                { name: "localhost", description: "" },
            ]);
        });
        it("should not suggest params after a task if the last word doesn't start with --", async () => {
            const suggestions = await complete("hh compile --config config.js ");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete filenames", async () => {
            const suggestions = await complete("hh run ");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete filenames after a partial word", async () => {
            const suggestions = await complete("hh compile --config ha");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete filenames after a partial word that starts with --", async () => {
            const suggestions = await complete("hh compile --config --");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete filenames inside a directory", async () => {
            const suggestions = await complete("hh compile --config scripts/");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete filenames inside a directory after a partial file", async () => {
            const suggestions = await complete("hh compile --config scripts/fo");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete hidden filenames inside a directory after a dot", async () => {
            const suggestions = await complete("hh compile --config scripts/.");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete hidden filenames inside a directory after a partial word", async () => {
            const suggestions = await complete("hh compile --config scripts/.hi");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
        it("should complete filenames inside a nested directory", async () => {
            const suggestions = await complete("hh compile --config scripts/nested/");
            chai_1.expect(suggestions).to.equal(autocomplete_1.HARDHAT_COMPLETE_FILES);
        });
    });
    describe("custom tasks", () => {
        project_1.useFixtureProject("autocomplete/custom-tasks");
        after(() => {
            reset_1.resetHardhatContext();
        });
        it("should include custom tasks", async () => {
            const suggestions = await complete("hh ");
            chai_1.expect(suggestions).to.have.deep.members([
                ...coreTasks,
                {
                    name: "my-task",
                    description: "",
                },
                {
                    name: "task-with-description",
                    description: "This is the task description",
                },
            ]);
        });
        it("should complete tasks after a - in the middle of the task name", async () => {
            const suggestions = await complete("hh my-");
            chai_1.expect(suggestions).to.have.deep.members([
                {
                    name: "my-task",
                    description: "",
                },
            ]);
        });
        it("should include custom params", async () => {
            const suggestions = await complete("hh my-task --");
            chai_1.expect(suggestions).to.have.deep.members([
                ...coreParams,
                { name: "--my-flag", description: "" },
                { name: "--param", description: "" },
                {
                    name: "--my-flag-with-description",
                    description: "Flag description",
                },
                {
                    name: "--param-with-description",
                    description: "Param description",
                },
            ]);
        });
    });
    describe("overriden task", () => {
        project_1.useFixtureProject("autocomplete/overriden-task");
        after(() => {
            reset_1.resetHardhatContext();
        });
        it("should work when a task is overriden", async () => {
            const suggestions = await complete("hh ");
            chai_1.expect(suggestions).to.have.deep.members(coreTasks);
        });
        it("should work when called a second time", async () => {
            const suggestions = await complete("hh ");
            chai_1.expect(suggestions).to.have.deep.members(coreTasks);
        });
    });
});
//# sourceMappingURL=autocomplete.js.map