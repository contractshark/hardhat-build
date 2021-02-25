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
const task_names_1 = require("../../src/builtin-tasks/task-names");
const constants_1 = require("../../src/internal/constants");
const glob_1 = require("../../src/internal/util/glob");
const builtin_tasks_1 = require("../../src/types/builtin-tasks");
const environment_1 = require("../helpers/environment");
const project_1 = require("../helpers/project");
const mock_file_1 = require("../utils/mock-file");
function assertFileExists(pathToFile) {
    chai_1.assert.isTrue(fsExtra.existsSync(pathToFile), `Expected ${pathToFile} to exist`);
}
function assertBuildInfoExists(pathToDbg) {
    assertFileExists(pathToDbg);
    const { buildInfo } = fsExtra.readJsonSync(pathToDbg);
    assertFileExists(path.resolve(path.dirname(pathToDbg), buildInfo));
}
describe("compile task", function () {
    beforeEach(function () {
        fsExtra.removeSync("artifacts");
        fsExtra.removeSync(path.join("cache", constants_1.SOLIDITY_FILES_CACHE_FILENAME));
    });
    describe("project with single file", function () {
        project_1.useFixtureProject("compilation-single-file");
        environment_1.useEnvironment();
        it("should compile and emit artifacts", async function () {
            await this.env.run("compile");
            assertFileExists(path.join("artifacts", "contracts", "A.sol", "A.json"));
            assertBuildInfoExists(path.join("artifacts", "contracts", "A.sol", "A.dbg.json"));
            chai_1.assert.lengthOf(glob_1.globSync("artifacts/build-info/*.json"), 1);
        });
    });
    describe("project with two files with different compiler versions", function () {
        project_1.useFixtureProject("compilation-two-files-different-versions");
        environment_1.useEnvironment();
        it("should compile and emit artifacts", async function () {
            await this.env.run("compile");
            assertFileExists(path.join("artifacts", "contracts", "A.sol", "A.json"));
            assertFileExists(path.join("artifacts", "contracts", "B.sol", "B.json"));
            assertBuildInfoExists(path.join("artifacts", "contracts", "A.sol", "A.dbg.json"));
            assertBuildInfoExists(path.join("artifacts", "contracts", "B.sol", "B.dbg.json"));
            chai_1.assert.lengthOf(glob_1.globSync("artifacts/build-info/*.json"), 2);
        });
    });
    describe("compilation jobs failure message", function () {
        project_1.useFixtureProject("compilation-single-file");
        environment_1.useEnvironment();
        it("should return a proper message for a non compatible solc error with a single file", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.NO_COMPATIBLE_SOLC_VERSION_FOUND,
                    file: Foo,
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `The Solidity version pragma statement in these files don't match any of the configured compilers in your config. Change the pragma or configure additional compiler versions in your hardhat config.

  * contracts/Foo.sol (^0.5.0)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for a non compatible solc error with two files", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar = mock_file_1.mockFile({
                sourceName: "contracts/Bar.sol",
                pragma: "^0.5.1",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.NO_COMPATIBLE_SOLC_VERSION_FOUND,
                    file: Foo,
                },
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.NO_COMPATIBLE_SOLC_VERSION_FOUND,
                    file: Bar,
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `The Solidity version pragma statement in these files don't match any of the configured compilers in your config. Change the pragma or configure additional compiler versions in your hardhat config.

  * contracts/Foo.sol (^0.5.0)
  * contracts/Bar.sol (^0.5.1)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for a non compatible overriden solc error with a single file", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INCOMPATIBLE_OVERRIDEN_SOLC_VERSION,
                    file: Foo,
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `The compiler version for the following files is fixed through an override in your config file to a version that is incompatible with their Solidity version pragmas.

  * contracts/Foo.sol (^0.5.0)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for a non compatible import error with a single file", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar = mock_file_1.mockFile({
                sourceName: "contracts/Bar.sol",
                pragma: "^0.6.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.DIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleDirectImports: [Bar],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files import other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) imports contracts/Bar.sol (^0.6.0)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for two non compatible imports", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar1 = mock_file_1.mockFile({
                sourceName: "contracts/Bar1.sol",
                pragma: "^0.6.0",
            });
            const Bar2 = mock_file_1.mockFile({
                sourceName: "contracts/Bar2.sol",
                pragma: "^0.6.1",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.DIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleDirectImports: [Bar1, Bar2],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files import other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) imports contracts/Bar1.sol (^0.6.0) and contracts/Bar2.sol (^0.6.1)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for three non compatible imports", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar1 = mock_file_1.mockFile({
                sourceName: "contracts/Bar1.sol",
                pragma: "^0.6.0",
            });
            const Bar2 = mock_file_1.mockFile({
                sourceName: "contracts/Bar2.sol",
                pragma: "^0.6.1",
            });
            const Bar3 = mock_file_1.mockFile({
                sourceName: "contracts/Bar3.sol",
                pragma: "^0.6.2",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.DIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleDirectImports: [Bar1, Bar2, Bar3],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files import other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) imports contracts/Bar1.sol (^0.6.0), contracts/Bar2.sol (^0.6.1) and 1 other file. Use --verbose to see the full list.

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for four non compatible imports", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar1 = mock_file_1.mockFile({
                sourceName: "contracts/Bar1.sol",
                pragma: "^0.6.0",
            });
            const Bar2 = mock_file_1.mockFile({
                sourceName: "contracts/Bar2.sol",
                pragma: "^0.6.1",
            });
            const Bar3 = mock_file_1.mockFile({
                sourceName: "contracts/Bar3.sol",
                pragma: "^0.6.2",
            });
            const Bar4 = mock_file_1.mockFile({
                sourceName: "contracts/Bar4.sol",
                pragma: "^0.6.3",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.DIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleDirectImports: [Bar1, Bar2, Bar3, Bar4],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files import other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) imports contracts/Bar1.sol (^0.6.0), contracts/Bar2.sol (^0.6.1) and 2 other files. Use --verbose to see the full list.

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for an indirect non compatible import error with a single file", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar = mock_file_1.mockFile({
                sourceName: "contracts/Bar.sol",
                pragma: "^0.6.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INDIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleIndirectImports: [
                            {
                                dependency: Bar,
                                path: [],
                            },
                        ],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files depend on other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) depends on contracts/Bar.sol (^0.6.0)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for two indirect non compatible import errors", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar1 = mock_file_1.mockFile({
                sourceName: "contracts/Bar1.sol",
                pragma: "^0.6.0",
            });
            const Bar2 = mock_file_1.mockFile({
                sourceName: "contracts/Bar2.sol",
                pragma: "^0.6.1",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INDIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleIndirectImports: [
                            { dependency: Bar1, path: [] },
                            { dependency: Bar2, path: [] },
                        ],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files depend on other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) depends on contracts/Bar1.sol (^0.6.0) and contracts/Bar2.sol (^0.6.1)

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for three indirect non compatible import errors", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar1 = mock_file_1.mockFile({
                sourceName: "contracts/Bar1.sol",
                pragma: "^0.6.0",
            });
            const Bar2 = mock_file_1.mockFile({
                sourceName: "contracts/Bar2.sol",
                pragma: "^0.6.1",
            });
            const Bar3 = mock_file_1.mockFile({
                sourceName: "contracts/Bar3.sol",
                pragma: "^0.6.2",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INDIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleIndirectImports: [
                            { dependency: Bar1, path: [] },
                            { dependency: Bar2, path: [] },
                            { dependency: Bar3, path: [] },
                        ],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files depend on other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) depends on contracts/Bar1.sol (^0.6.0), contracts/Bar2.sol (^0.6.1) and 1 other file. Use --verbose to see the full list.

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for four indirect non compatible import errors", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const Bar1 = mock_file_1.mockFile({
                sourceName: "contracts/Bar1.sol",
                pragma: "^0.6.0",
            });
            const Bar2 = mock_file_1.mockFile({
                sourceName: "contracts/Bar2.sol",
                pragma: "^0.6.1",
            });
            const Bar3 = mock_file_1.mockFile({
                sourceName: "contracts/Bar3.sol",
                pragma: "^0.6.2",
            });
            const Bar4 = mock_file_1.mockFile({
                sourceName: "contracts/Bar4.sol",
                pragma: "^0.6.3",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INDIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo,
                    extra: {
                        incompatibleIndirectImports: [
                            { dependency: Bar1, path: [] },
                            { dependency: Bar2, path: [] },
                            { dependency: Bar3, path: [] },
                            { dependency: Bar4, path: [] },
                        ],
                    },
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files depend on other files that use a different and incompatible version of Solidity:

  * contracts/Foo.sol (^0.5.0) depends on contracts/Bar1.sol (^0.6.0), contracts/Bar2.sol (^0.6.1) and 2 other files. Use --verbose to see the full list.

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for other kind of error with a single file", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.OTHER_ERROR,
                    file: Foo,
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files and its dependencies cannot be compiled with your config. This can happen because they have incompatible Solidity pragmas, or don't match any of your configured Solidity compilers.

  * contracts/Foo.sol

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return a proper message for an unknown kind of error with a single file", async function () {
            const Foo = mock_file_1.mockFile({
                sourceName: "contracts/Foo.sol",
                pragma: "^0.5.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: "unknown",
                    file: Foo,
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `These files and its dependencies cannot be compiled with your config. This can happen because they have incompatible Solidity pragmas, or don't match any of your configured Solidity compilers.

  * contracts/Foo.sol

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
        it("should return multiple errors in order", async function () {
            const Foo1 = mock_file_1.mockFile({
                sourceName: "contracts/Foo1.sol",
                pragma: "^0.5.0",
            });
            const Foo2 = mock_file_1.mockFile({
                sourceName: "contracts/Foo2.sol",
                pragma: "^0.5.0",
            });
            const Foo3 = mock_file_1.mockFile({
                sourceName: "contracts/Foo3.sol",
                pragma: "^0.5.0",
            });
            const Foo4 = mock_file_1.mockFile({
                sourceName: "contracts/Foo4.sol",
                pragma: "^0.5.0",
            });
            const Foo5 = mock_file_1.mockFile({
                sourceName: "contracts/Foo5.sol",
                pragma: "^0.5.0",
            });
            const Bar = mock_file_1.mockFile({
                sourceName: "contracts/Bar.sol",
                pragma: "^0.6.0",
            });
            const compilationJobsCreationErrors = [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.OTHER_ERROR,
                    file: Foo4,
                },
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.NO_COMPATIBLE_SOLC_VERSION_FOUND,
                    file: Foo2,
                },
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.DIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo3,
                    extra: {
                        incompatibleDirectImports: [Bar],
                    },
                },
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INDIRECTLY_IMPORTS_INCOMPATIBLE_FILE,
                    file: Foo5,
                    extra: {
                        incompatibleIndirectImports: [{ dependency: Bar, path: [] }],
                    },
                },
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.INCOMPATIBLE_OVERRIDEN_SOLC_VERSION,
                    file: Foo1,
                },
            ];
            const reasons = await this.env.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS_FAILURE_REASONS, {
                compilationJobsCreationErrors,
            });
            chai_1.assert.equal(reasons, `The compiler version for the following files is fixed through an override in your config file to a version that is incompatible with their Solidity version pragmas.

  * contracts/Foo1.sol (^0.5.0)

The Solidity version pragma statement in these files don't match any of the configured compilers in your config. Change the pragma or configure additional compiler versions in your hardhat config.

  * contracts/Foo2.sol (^0.5.0)

These files import other files that use a different and incompatible version of Solidity:

  * contracts/Foo3.sol (^0.5.0) imports contracts/Bar.sol (^0.6.0)

These files depend on other files that use a different and incompatible version of Solidity:

  * contracts/Foo5.sol (^0.5.0) depends on contracts/Bar.sol (^0.6.0)

These files and its dependencies cannot be compiled with your config. This can happen because they have incompatible Solidity pragmas, or don't match any of your configured Solidity compilers.

  * contracts/Foo4.sol

To learn more, run the command again with --verbose

Read about compiler configuration at https://hardhat.org/config
`);
        });
    });
});
//# sourceMappingURL=compile.js.map