"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const compilation_job_1 = require("../../../src/internal/solidity/compilation-job");
const builtin_tasks_1 = require("../../../src/types/builtin-tasks");
const helpers_1 = require("./helpers");
const defaultSettings = {
    optimizer: {
        enabled: false,
        runs: 200,
    },
};
const optimizerEnabledSettings = {
    optimizer: {
        enabled: true,
        runs: 200,
    },
};
const solc055 = { version: "0.5.5", settings: defaultSettings };
const solc055Optimized = {
    version: "0.5.5",
    settings: optimizerEnabledSettings,
};
const solc066 = { version: "0.6.6", settings: defaultSettings };
const solcConfig055 = {
    compilers: [solc055],
    overrides: {},
};
const solcConfig055Optimized = {
    compilers: [solc055Optimized],
    overrides: {},
};
const solcConfig055and066 = {
    compilers: [solc055, solc066],
    overrides: {},
};
const solcConfig066 = {
    compilers: [solc066],
    overrides: {},
};
function assertIsJob(result) {
    if ("reason" in result) {
        chai_1.assert.fail("The given compilation job result is an error");
    }
    return result;
}
function assertIsError(result) {
    if (!("reason" in result)) {
        chai_1.assert.fail("The given compilation job result is not an error");
    }
    return result;
}
describe("Compilation jobs", function () {
    describe("createCompilationJobFromFile", function () {
        describe("single file", function () {
            it("valid compiler", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
            });
            it("newest compiler is used", async function () {
                const FooMock = new helpers_1.MockFile("Foo", [">=0.5.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055and066);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.6.6");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
            });
            it("overriden compiler is used", async function () {
                const FooMock = new helpers_1.MockFile("Foo", [">=0.5.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, Object.assign(Object.assign({}, solcConfig066), { overrides: {
                        [Foo.sourceName]: solc055,
                    } }));
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
            });
            it("invalid compiler", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.6.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJobCreationError = assertIsError(compilationJobOrError);
                chai_1.assert.equal(compilationJobCreationError.reason, builtin_tasks_1.CompilationJobCreationErrorReason.NO_COMPATIBLE_SOLC_VERSION_FOUND);
            });
            it("invalid overriden compiler", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, Object.assign(Object.assign({}, solcConfig055), { overrides: {
                        [Foo.sourceName]: solc066,
                    } }));
                const compilationJobCreationError = assertIsError(compilationJobOrError);
                chai_1.assert.equal(compilationJobCreationError.reason, builtin_tasks_1.CompilationJobCreationErrorReason.INCOMPATIBLE_OVERRIDEN_SOLC_VERSION);
            });
        });
        describe("two files", function () {
            it("file not imported is not included in job", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                    { file: BarMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
            });
            it("file imported is included in job", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const [dependencyGraph, [Foo, Bar]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock] },
                    { file: BarMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo, Bar]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Bar));
            });
            it("importer file is not included in job", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                    { file: FooMock },
                    { file: BarMock, dependencies: [FooMock] },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
            });
            it("incompatible import", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.6.0"]);
                const [dependencyGraph, [Foo, Bar]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock] },
                    { file: BarMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055and066);
                const compilationJobCreationError = assertIsError(compilationJobOrError);
                chai_1.assert.equal(compilationJobCreationError.reason, builtin_tasks_1.CompilationJobCreationErrorReason.DIRECTLY_IMPORTS_INCOMPATIBLE_FILE);
                chai_1.assert.deepEqual(compilationJobCreationError.extra.incompatibleDirectImports, [Bar]);
            });
            it("loop", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const [dependencyGraph, [Foo, Bar]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock] },
                    { file: BarMock, dependencies: [FooMock] },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo, Bar]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Bar));
            });
        });
        describe("three files", function () {
            it("transitive dependency", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
                const [dependencyGraph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock] },
                    { file: BarMock, dependencies: [QuxMock] },
                    { file: QuxMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo, Bar, Qux]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Bar));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Qux));
            });
            it("imported by one and importing one", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
                const [dependencyGraph, [, Bar, Qux]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock] },
                    { file: BarMock, dependencies: [QuxMock] },
                    { file: QuxMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Bar, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Bar, Qux]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Bar));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Qux));
            });
            it("two dependencies", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
                const [dependencyGraph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock, QuxMock] },
                    { file: BarMock },
                    { file: QuxMock },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo, Bar, Qux]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Bar));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Qux));
            });
            it("loop", async function () {
                const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
                const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
                const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
                const [dependencyGraph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                    { file: FooMock, dependencies: [BarMock] },
                    { file: BarMock, dependencies: [QuxMock] },
                    { file: QuxMock, dependencies: [FooMock] },
                ]);
                const compilationJobOrError = await compilation_job_1.createCompilationJobFromFile(dependencyGraph, Foo, solcConfig055);
                const compilationJob = assertIsJob(compilationJobOrError);
                chai_1.assert.equal(compilationJob.getSolcConfig().version, "0.5.5");
                chai_1.assert.sameMembers(compilationJob.getResolvedFiles(), [Foo, Bar, Qux]);
                chai_1.assert.isTrue(compilationJob.emitsArtifacts(Foo));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Bar));
                chai_1.assert.isFalse(compilationJob.emitsArtifacts(Qux));
            });
        });
    });
    describe("createCompilationJobsFromConnectedComponent", function () {
        it("single file (success)", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const [dependencyGraph] = await helpers_1.createMockData([{ file: FooMock }]);
            const { jobs, errors, } = await compilation_job_1.createCompilationJobsFromConnectedComponent(dependencyGraph, (file) => compilation_job_1.createCompilationJobFromFile(dependencyGraph, file, solcConfig055));
            chai_1.assert.lengthOf(jobs, 1);
            chai_1.assert.isEmpty(errors);
        });
        it("single file (error)", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.6.0"]);
            const [dependencyGraph, [Foo]] = await helpers_1.createMockData([
                { file: FooMock },
            ]);
            const { jobs, errors, } = await compilation_job_1.createCompilationJobsFromConnectedComponent(dependencyGraph, (file) => compilation_job_1.createCompilationJobFromFile(dependencyGraph, file, solcConfig055));
            chai_1.assert.lengthOf(jobs, 0);
            chai_1.assert.sameDeepMembers(errors, [
                {
                    reason: builtin_tasks_1.CompilationJobCreationErrorReason.NO_COMPATIBLE_SOLC_VERSION_FOUND,
                    file: Foo,
                },
            ]);
        });
        it("files without solc bug", async function () {
            const Importer1Mock = new helpers_1.MockFile("Importer1", ["^0.5.0"]);
            const Importer2Mock = new helpers_1.MockFile("Importer2", ["^0.5.0"]);
            const ImportedMock = new helpers_1.MockFile("Imported", ["^0.5.0"]);
            const [dependencyGraph] = await helpers_1.createMockData([
                { file: Importer1Mock, dependencies: [ImportedMock] },
                { file: Importer2Mock, dependencies: [ImportedMock] },
                { file: ImportedMock },
            ]);
            const { jobs, errors, } = await compilation_job_1.createCompilationJobsFromConnectedComponent(dependencyGraph, (file) => compilation_job_1.createCompilationJobFromFile(dependencyGraph, file, solcConfig055));
            chai_1.assert.lengthOf(jobs, 3);
            chai_1.assert.isEmpty(errors);
        });
        it("files with solc bug", async function () {
            const Importer1Mock = new helpers_1.MockFile("Importer1", ["^0.5.0"]);
            const Importer2Mock = new helpers_1.MockFile("Importer2", ["^0.5.0"]);
            const ImportedMock = new helpers_1.MockFile("Imported", ["^0.5.0"]);
            const [dependencyGraph] = await helpers_1.createMockData([
                { file: Importer1Mock, dependencies: [ImportedMock] },
                { file: Importer2Mock, dependencies: [ImportedMock] },
                { file: ImportedMock },
            ]);
            const { jobs, errors, } = await compilation_job_1.createCompilationJobsFromConnectedComponent(dependencyGraph, (file) => compilation_job_1.createCompilationJobFromFile(dependencyGraph, file, solcConfig055Optimized));
            chai_1.assert.lengthOf(jobs, 1);
            chai_1.assert.isEmpty(errors);
        });
    });
});
//# sourceMappingURL=compilation-job.js.map