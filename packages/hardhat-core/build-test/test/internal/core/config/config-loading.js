"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const task_names_1 = require("../../../../src/builtin-tasks/task-names");
const context_1 = require("../../../../src/internal/context");
const config_loading_1 = require("../../../../src/internal/core/config/config-loading");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const reset_1 = require("../../../../src/internal/reset");
const glob_1 = require("../../../../src/internal/util/glob");
const environment_1 = require("../../../helpers/environment");
const errors_1 = require("../../../helpers/errors");
const project_1 = require("../../../helpers/project");
describe("config loading", function () {
    describe("default config path", function () {
        project_1.useFixtureProject("config-project");
        environment_1.useEnvironment();
        it("should load the default config if none is given", function () {
            chai_1.assert.isDefined(this.env.config.networks.localhost);
            chai_1.assert.deepEqual(this.env.config.networks.localhost.accounts, [
                "0xa95f9e3e7ae4e4865c5968828fe7c03fffa8a9f3bb52d36d26243f4c868ee166",
            ]);
        });
    });
    describe("Config validation", function () {
        describe("When the config is invalid", function () {
            project_1.useFixtureProject("invalid-config");
            beforeEach(function () {
                context_1.HardhatContext.createHardhatContext();
            });
            afterEach(function () {
                reset_1.resetHardhatContext();
            });
            it("Should throw the right error", function () {
                errors_1.expectHardhatError(() => config_loading_1.loadConfigAndTasks(), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            });
        });
    });
    describe("custom config path", function () {
        project_1.useFixtureProject("custom-config-file");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should accept a relative path from the CWD", function () {
            const config = config_loading_1.loadConfigAndTasks({ config: "config.js" });
            chai_1.assert.equal(config.paths.configFile, path_1.default.normalize(path_1.default.join(process.cwd(), "config.js")));
        });
        it("should accept an absolute path", async function () {
            const fixtureDir = await project_1.getFixtureProjectPath("custom-config-file");
            const config = config_loading_1.loadConfigAndTasks({
                config: path_1.default.join(fixtureDir, "config.js"),
            });
            chai_1.assert.equal(config.paths.configFile, path_1.default.normalize(path_1.default.join(process.cwd(), "config.js")));
        });
    });
    describe("Tasks loading", function () {
        project_1.useFixtureProject("config-project");
        environment_1.useEnvironment();
        it("Should define the default tasks", function () {
            chai_1.assert.containsAllKeys(this.env.tasks, [
                task_names_1.TASK_CLEAN,
                "flatten",
                "compile",
                "help",
                "run",
                "test",
            ]);
        });
        it("Should load custom tasks", function () {
            chai_1.assert.containsAllKeys(this.env.tasks, ["example", "example2"]);
        });
    });
    describe("Config env", function () {
        project_1.useFixtureProject("config-project");
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should remove everything from global state after loading", function () {
            const globalAsAny = global;
            context_1.HardhatContext.createHardhatContext();
            config_loading_1.loadConfigAndTasks();
            chai_1.assert.isUndefined(globalAsAny.subtask);
            chai_1.assert.isUndefined(globalAsAny.task);
            chai_1.assert.isUndefined(globalAsAny.types);
            chai_1.assert.isUndefined(globalAsAny.extendEnvironment);
            reset_1.resetHardhatContext();
            context_1.HardhatContext.createHardhatContext();
            config_loading_1.loadConfigAndTasks();
            chai_1.assert.isUndefined(globalAsAny.subtask);
            chai_1.assert.isUndefined(globalAsAny.task);
            chai_1.assert.isUndefined(globalAsAny.types);
            chai_1.assert.isUndefined(globalAsAny.extendEnvironment);
            reset_1.resetHardhatContext();
        });
    });
    describe("Config that imports the library", function () {
        project_1.useFixtureProject("config-imports-lib-project");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should accept a relative path from the CWD", function () {
            errors_1.expectHardhatError(() => config_loading_1.loadConfigAndTasks(), errors_list_1.ERRORS.GENERAL.LIB_IMPORTED_FROM_THE_CONFIG);
        });
    });
    describe("missing package", function () {
        project_1.useFixtureProject("import-missing-package");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should re-throw the error", function () {
            let errorThrown;
            try {
                config_loading_1.loadConfigAndTasks();
            }
            catch (e) {
                errorThrown = e;
            }
            if (errorThrown === undefined) {
                chai_1.assert.fail("No error was thrown");
            }
            chai_1.assert(errorThrown.code === "MODULE_NOT_FOUND");
        });
    });
    describe("dependency not installed", function () {
        project_1.useFixtureProject("import-dependency-not-installed");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should re-throw the error", function () {
            let errorThrown;
            try {
                config_loading_1.loadConfigAndTasks();
            }
            catch (e) {
                errorThrown = e;
            }
            if (errorThrown === undefined) {
                chai_1.assert.fail("No error was thrown");
            }
            chai_1.assert(errorThrown.code === "MODULE_NOT_FOUND");
        });
    });
    describe("devDependency not installed", function () {
        project_1.useFixtureProject("import-dev-dependency-not-installed");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should re-throw the error", function () {
            let errorThrown;
            try {
                config_loading_1.loadConfigAndTasks();
            }
            catch (e) {
                errorThrown = e;
            }
            if (errorThrown === undefined) {
                chai_1.assert.fail("No error was thrown");
            }
            chai_1.assert(errorThrown.code === "MODULE_NOT_FOUND");
        });
    });
    describe("plugin peer dependency not installed", function () {
        project_1.useFixtureProject("plugin-peer-dependency-not-installed");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should indicate the plugin and the missing dependency", function () {
            errors_1.expectHardhatError(() => config_loading_1.loadConfigAndTasks(), errors_list_1.ERRORS.PLUGINS.MISSING_DEPENDENCIES, "Plugin some-plugin requires the following dependencies to be installed: some-dependency");
        });
    });
    describe("plugin multiple peer dependencies not installed", function () {
        project_1.useFixtureProject("plugin-multiple-peer-dependencies-not-installed");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should indicate the plugin and the missing dependencies", function () {
            errors_1.expectHardhatError(() => config_loading_1.loadConfigAndTasks(), errors_list_1.ERRORS.PLUGINS.MISSING_DEPENDENCIES, "Plugin some-plugin requires the following dependencies to be installed: some-dependency, some-other-dependency");
        });
    });
    describe("buidler plugin", function () {
        project_1.useFixtureProject("buidler-plugin");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("should indicate the buidler plugin", function () {
            errors_1.expectHardhatError(() => config_loading_1.loadConfigAndTasks(), errors_list_1.ERRORS.PLUGINS.BUIDLER_PLUGIN, `You are using some-buidler-plugin, which is a Buidler plugin. Use the equivalent
Hardhat plugin instead.`);
        });
    });
    describe("dynamic import of missing dependency in task", function () {
        project_1.useFixtureProject("plugin-dynamic-import-not-installed");
        environment_1.useEnvironment();
        it("should indicate the plugin and the missing dependencies", async function () {
            await errors_1.expectHardhatErrorAsync(() => this.env.run("some-task"), errors_list_1.ERRORS.PLUGINS.MISSING_DEPENDENCIES, "Plugin some-plugin requires the following dependencies to be installed: some-dependency");
        });
    });
    describe("Required files recording", function () {
        project_1.useFixtureProject("files-required-by-config-tracking-example");
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("Should keep track of all the files imported when loading the config", async function () {
            const builtinTasksFiles = await glob_1.glob("../../../../src/builtin-tasks/*.ts");
            const projectPath = await fs_extra_1.default.realpath(".");
            // We run this twice to make sure that the cache is cleaned properly
            for (let i = 0; i < 2; i++) {
                context_1.HardhatContext.createHardhatContext();
                config_loading_1.loadConfigAndTasks();
                const ctx = context_1.HardhatContext.getHardhatContext();
                const files = ctx.getFilesLoadedDuringConfig();
                for (const file of builtinTasksFiles) {
                    // The task names may have been loaded before, so we ignore it.
                    if (file.endsWith("task-names.ts")) {
                        continue;
                    }
                    chai_1.assert.include(files, file);
                }
                // Must include the config file and the files directly and
                // indirectly imported by it.
                chai_1.assert.include(files, path_1.default.join(projectPath, "hardhat.config.js"));
                chai_1.assert.include(files, path_1.default.join(projectPath, "a.js"));
                chai_1.assert.include(files, path_1.default.join(projectPath, "b.js"));
                // Must not include unrelated files.
                chai_1.assert.notInclude(files, path_1.default.join(projectPath, "not-imported.js"));
                reset_1.resetHardhatContext();
            }
        });
    });
});
//# sourceMappingURL=config-loading.js.map