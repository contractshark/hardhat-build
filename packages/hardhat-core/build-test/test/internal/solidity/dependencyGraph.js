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
const fs = __importStar(require("fs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const dependencyGraph_1 = require("../../../src/internal/solidity/dependencyGraph");
const parse_1 = require("../../../src/internal/solidity/parse");
const resolver_1 = require("../../../src/internal/solidity/resolver");
const project_1 = require("../../helpers/project");
const helpers_1 = require("./helpers");
function assertDeps(graph, file, ...deps) {
    chai_1.assert.includeMembers(graph.getResolvedFiles(), [file]);
    const resolvedDeps = graph.getDependencies(file);
    if (resolvedDeps === undefined) {
        throw Error("This should never happen. Just making TS happy.");
    }
    chai_1.assert.equal(resolvedDeps.length, deps.length);
    chai_1.assert.includeMembers(Array.from(resolvedDeps), deps);
}
function assertResolvedFiles(graph, ...files) {
    const resolvedFiles = graph.getResolvedFiles();
    chai_1.assert.equal(resolvedFiles.length, files.length);
    chai_1.assert.includeMembers(resolvedFiles, files);
}
describe("Dependency Graph", function () {
    describe("createFromResolvedFiles", function () {
        let resolver;
        let projectRoot;
        let fileWithoutDependencies;
        let fileWithoutDependencies2;
        let fileWithoutDependencies3;
        let dependsOnWDAndW2;
        let dependsOnWD;
        let loop1;
        let loop2;
        before("Mock some resolved files", function () {
            projectRoot = fs.realpathSync(".");
            fileWithoutDependencies = new resolver_1.ResolvedFile("contracts/WD.sol", path_1.default.join(projectRoot, "contracts", "WD.sol"), { rawContent: "no dependecy", imports: [], versionPragmas: [] }, "<content-hash-wd>", new Date());
            fileWithoutDependencies2 = new resolver_1.ResolvedFile("contracts/WD2.sol", path_1.default.join(projectRoot, "contracts", "WD2.sol"), { rawContent: "no dependecy", imports: [], versionPragmas: [] }, "<content-hash-wd2>", new Date());
            fileWithoutDependencies3 = new resolver_1.ResolvedFile("contracts/WD3.sol", path_1.default.join(projectRoot, "contracts", "WD3.sol"), { rawContent: "no dependecy", imports: [], versionPragmas: [] }, "<content-hash-wd3>", new Date());
            dependsOnWDAndW2 = new resolver_1.ResolvedFile("contracts/dependsOnWDAndW2.sol", path_1.default.join(projectRoot, "contracts", "dependsOnWDAndW2.sol"), {
                rawContent: 'import "./WD.sol"; import "./WD2.sol";',
                imports: ["./WD.sol", "./WD2.sol"],
                versionPragmas: [],
            }, "<content-hash-wd4>", new Date());
            dependsOnWD = new resolver_1.ResolvedFile("contracts/dependsOnWD.sol", path_1.default.join(projectRoot, "contracts", "dependsOnWD.sol"), {
                rawContent: 'import "./WD.sol";',
                imports: ["./WD.sol"],
                versionPragmas: [],
            }, "<content-hash-depends-on-wd>", new Date());
            loop1 = new resolver_1.ResolvedFile("contracts/loop1.sol", path_1.default.join(projectRoot, "contracts", "loop1.sol"), {
                rawContent: 'import "./loop2.sol";',
                imports: ["./loop2.sol"],
                versionPragmas: [],
            }, "<content-hash-loop1>", new Date());
            loop2 = new resolver_1.ResolvedFile("contracts/loop2.sol", path_1.default.join(projectRoot, "contracts", "loop2.sol"), {
                rawContent: 'import "./loop1.sol";',
                imports: ["./loop1.sol"],
                versionPragmas: [],
            }, "<content-hash-loop2>", new Date());
            resolver = new resolver_1.Resolver(projectRoot, new parse_1.Parser(), (absolutePath) => fs_extra_1.default.readFile(absolutePath, { encoding: "utf8" }));
            resolver.resolveImport = async (_, imported) => {
                switch (imported) {
                    case "./WD.sol":
                        return fileWithoutDependencies;
                    case "./WD2.sol":
                        return fileWithoutDependencies2;
                    case "./loop1.sol":
                        return loop1;
                    case "./loop2.sol":
                        return loop2;
                    default:
                        throw new Error(`${imported} is not mocked`);
                }
            };
        });
        it("should give an empty graph if there's no entry point", async function () {
            const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, []);
            chai_1.assert.isEmpty(graph.getResolvedFiles());
        });
        it("should give a graph with a single node if the only entry point has no deps", async function () {
            const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, [
                fileWithoutDependencies,
            ]);
            assertResolvedFiles(graph, fileWithoutDependencies);
            assertDeps(graph, fileWithoutDependencies);
        });
        it("should work with multiple entry points without deps", async function () {
            const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, [
                fileWithoutDependencies,
                fileWithoutDependencies2,
            ]);
            assertResolvedFiles(graph, fileWithoutDependencies, fileWithoutDependencies2);
            assertDeps(graph, fileWithoutDependencies);
            assertDeps(graph, fileWithoutDependencies2);
        });
        it("should work with an entry point with deps", async function () {
            const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, [
                dependsOnWDAndW2,
            ]);
            assertResolvedFiles(graph, fileWithoutDependencies, fileWithoutDependencies2, dependsOnWDAndW2);
            assertDeps(graph, fileWithoutDependencies);
            assertDeps(graph, fileWithoutDependencies2);
            assertDeps(graph, dependsOnWDAndW2, fileWithoutDependencies, fileWithoutDependencies2);
        });
        it("should work with the same file being reachable from multiple entry pints", async function () {
            const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, [
                dependsOnWDAndW2,
                fileWithoutDependencies,
            ]);
            assertResolvedFiles(graph, fileWithoutDependencies, fileWithoutDependencies2, dependsOnWDAndW2);
            assertDeps(graph, fileWithoutDependencies);
            assertDeps(graph, fileWithoutDependencies2);
            assertDeps(graph, dependsOnWDAndW2, fileWithoutDependencies, fileWithoutDependencies2);
            const graph2 = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, [
                dependsOnWDAndW2,
                dependsOnWD,
            ]);
            assertResolvedFiles(graph2, fileWithoutDependencies, fileWithoutDependencies2, dependsOnWDAndW2, dependsOnWD);
            assertDeps(graph2, fileWithoutDependencies);
            assertDeps(graph2, fileWithoutDependencies2);
            assertDeps(graph2, dependsOnWDAndW2, fileWithoutDependencies, fileWithoutDependencies2);
            assertDeps(graph2, dependsOnWD, fileWithoutDependencies);
        });
        it("should work with an isolated file", async function () {
            const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, [
                dependsOnWDAndW2,
                fileWithoutDependencies3,
            ]);
            assertResolvedFiles(graph, fileWithoutDependencies, fileWithoutDependencies2, dependsOnWDAndW2, fileWithoutDependencies3);
            assertDeps(graph, fileWithoutDependencies);
            assertDeps(graph, fileWithoutDependencies2);
            assertDeps(graph, fileWithoutDependencies3);
            assertDeps(graph, dependsOnWDAndW2, fileWithoutDependencies, fileWithoutDependencies2);
        });
        describe("Cyclic dependencies", function () {
            const PROJECT = "cyclic-dependencies-project";
            project_1.useFixtureProject(PROJECT);
            let localResolver;
            before("Get project root", async function () {
                localResolver = new resolver_1.Resolver(await project_1.getFixtureProjectPath(PROJECT), new parse_1.Parser(), (absolutePath) => fs_extra_1.default.readFile(absolutePath, { encoding: "utf8" }));
            });
            it("should work with cyclic dependencies", async () => {
                const fileA = await localResolver.resolveSourceName("contracts/A.sol");
                const fileB = await localResolver.resolveSourceName("contracts/B.sol");
                const graph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(localResolver, [fileA]);
                const graphFiles = Array.from(graph.getResolvedFiles());
                graphFiles.sort((a, b) => a.absolutePath.localeCompare(b.absolutePath));
                chai_1.assert.equal(graphFiles.length, 2);
                const [graphsA, graphsB] = graphFiles;
                chai_1.assert.deepEqual(graphsA, fileA);
                chai_1.assert.deepEqual(graphsB, fileB);
                chai_1.assert.equal(graph.getDependencies(graphsA).length, 1);
                const graphsADep = Array.from(graph.getDependencies(graphsA).values())[0];
                chai_1.assert.deepEqual(graphsADep, fileB);
                chai_1.assert.equal(graph.getDependencies(graphsB).length, 1);
                const graphsBDep = graph.getDependencies(graphsB)[0];
                chai_1.assert.deepEqual(graphsBDep, fileA);
            });
        });
    });
    describe("getConnectedComponents", function () {
        it("single file", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const [graph, [Foo]] = await helpers_1.createMockData([{ file: FooMock }]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [Foo]);
        });
        it("two independent files", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const [graph, [Foo, Bar]] = await helpers_1.createMockData([
                { file: FooMock },
                { file: BarMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 2);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [Foo]);
            chai_1.assert.sameMembers(connectedComponents[1].getResolvedFiles(), [Bar]);
        });
        it("one file imports another one", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const [graph, [Foo, Bar]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [BarMock] },
                { file: BarMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [Foo, Bar]);
        });
        it("one file imports a library", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const LibMock = new helpers_1.MockFile("Lib", ["^0.5.0"], "SomeLibrary");
            const [graph, [Foo, Lib]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [LibMock] },
                { file: LibMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [Foo, Lib]);
        });
        it("two files loop", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const [graph, [Foo, Bar]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [BarMock] },
                { file: BarMock, dependencies: [FooMock] },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [Foo, Bar]);
        });
        it("three files sequential import", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
            const [graph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [BarMock] },
                { file: BarMock, dependencies: [QuxMock] },
                { file: QuxMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [
                Foo,
                Bar,
                Qux,
            ]);
        });
        it("three files, Foo->Bar and Qux", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
            const [graph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [BarMock] },
                { file: BarMock },
                { file: QuxMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 2);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [Foo, Bar]);
            chai_1.assert.sameMembers(connectedComponents[1].getResolvedFiles(), [Qux]);
        });
        it("three files loop", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
            const [graph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [BarMock] },
                { file: BarMock, dependencies: [QuxMock] },
                { file: QuxMock, dependencies: [FooMock] },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [
                Foo,
                Bar,
                Qux,
            ]);
        });
        it("three files, one imports the other two", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
            const [graph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [BarMock, QuxMock] },
                { file: BarMock },
                { file: QuxMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [
                Foo,
                Bar,
                Qux,
            ]);
        });
        it("three files, two files import the same one", async function () {
            const FooMock = new helpers_1.MockFile("Foo", ["^0.5.0"]);
            const BarMock = new helpers_1.MockFile("Bar", ["^0.5.0"]);
            const QuxMock = new helpers_1.MockFile("Qux", ["^0.5.0"]);
            const [graph, [Foo, Bar, Qux]] = await helpers_1.createMockData([
                { file: FooMock, dependencies: [QuxMock] },
                { file: BarMock, dependencies: [QuxMock] },
                { file: QuxMock },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [
                Foo,
                Bar,
                Qux,
            ]);
        });
        it("four files, Foo1->Foo2 and Bar1<->Bar2", async function () {
            const Foo1Mock = new helpers_1.MockFile("Foo1", ["^0.5.0"]);
            const Foo2Mock = new helpers_1.MockFile("Foo2", ["^0.5.0"]);
            const Bar1Mock = new helpers_1.MockFile("Bar1", ["^0.5.0"]);
            const Bar2Mock = new helpers_1.MockFile("Bar2", ["^0.5.0"]);
            const [graph, [Foo1, Foo2, Bar1, Bar2]] = await helpers_1.createMockData([
                { file: Foo1Mock, dependencies: [Foo2Mock] },
                { file: Foo2Mock },
                { file: Bar1Mock, dependencies: [Bar2Mock] },
                { file: Bar2Mock, dependencies: [Bar1Mock] },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 2);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), [
                Foo1,
                Foo2,
            ]);
            chai_1.assert.sameMembers(connectedComponents[1].getResolvedFiles(), [
                Bar1,
                Bar2,
            ]);
        });
        it("five files, three layers, 2-1-2", async function () {
            const Layer1AMock = new helpers_1.MockFile("Layer1A", ["^0.5.0"]);
            const Layer1BMock = new helpers_1.MockFile("Layer1B", ["^0.5.0"]);
            const Layer2Mock = new helpers_1.MockFile("Layer2", ["^0.5.0"]);
            const Layer3AMock = new helpers_1.MockFile("Layer3A", ["^0.5.0"]);
            const Layer3BMock = new helpers_1.MockFile("Layer3B", ["^0.5.0"]);
            const [graph, resolvedFiles] = await helpers_1.createMockData([
                { file: Layer1AMock, dependencies: [Layer2Mock] },
                { file: Layer1BMock, dependencies: [Layer2Mock] },
                { file: Layer2Mock, dependencies: [Layer3AMock, Layer3BMock] },
                { file: Layer3AMock, dependencies: [] },
                { file: Layer3BMock, dependencies: [] },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), resolvedFiles);
        });
        it("six files, three layers, 2-2-2", async function () {
            const Layer1AMock = new helpers_1.MockFile("Layer1A", ["^0.5.0"]);
            const Layer1BMock = new helpers_1.MockFile("Layer1B", ["^0.5.0"]);
            const Layer2AMock = new helpers_1.MockFile("Layer2A", ["^0.5.0"]);
            const Layer2BMock = new helpers_1.MockFile("Layer2B", ["^0.5.0"]);
            const Layer3AMock = new helpers_1.MockFile("Layer3A", ["^0.5.0"]);
            const Layer3BMock = new helpers_1.MockFile("Layer3B", ["^0.5.0"]);
            const [graph, resolvedFiles] = await helpers_1.createMockData([
                { file: Layer1AMock, dependencies: [Layer2AMock, Layer2BMock] },
                { file: Layer1BMock, dependencies: [Layer2AMock, Layer2BMock] },
                { file: Layer2AMock, dependencies: [Layer3AMock, Layer3BMock] },
                { file: Layer2BMock, dependencies: [Layer3AMock, Layer3BMock] },
                { file: Layer3AMock, dependencies: [] },
                { file: Layer3BMock, dependencies: [] },
            ]);
            const connectedComponents = graph.getConnectedComponents();
            chai_1.assert.lengthOf(connectedComponents, 1);
            chai_1.assert.sameMembers(connectedComponents[0].getResolvedFiles(), resolvedFiles);
        });
    });
});
//# sourceMappingURL=dependencyGraph.js.map