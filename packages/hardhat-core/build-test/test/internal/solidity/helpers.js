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
exports.createMockData = exports.MockFile = void 0;
const fs = __importStar(require("fs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const dependencyGraph_1 = require("../../../src/internal/solidity/dependencyGraph");
const parse_1 = require("../../../src/internal/solidity/parse");
const resolver_1 = require("../../../src/internal/solidity/resolver");
const projectRoot = fs.realpathSync(".");
class MockFile {
    constructor(name, versionPragmas, libraryName) {
        this.name = name;
        this.versionPragmas = versionPragmas;
        this.libraryName = libraryName;
        this.sourceName = `contracts/${name}.sol`;
        this.absolutePath = path_1.default.join(projectRoot, "contracts", `${name}.sol`);
    }
}
exports.MockFile = MockFile;
async function createMockData(files) {
    const filesMap = new Map();
    for (const { file, dependencies } of files) {
        filesMap.set(file, {
            dependencies: dependencies !== null && dependencies !== void 0 ? dependencies : [],
        });
    }
    const mockFileToResolvedFile = new Map();
    const importsMap = new Map();
    const resolvedFiles = [...filesMap.keys()].map((mockFile) => {
        const resolvedFile = new resolver_1.ResolvedFile(mockFile.sourceName, mockFile.absolutePath, {
            rawContent: "mock file",
            imports: filesMap
                .get(mockFile)
                .dependencies.map((dependency) => `./${dependency.name}.sol`),
            versionPragmas: mockFile.versionPragmas,
        }, "<content-hash-mock-file>", new Date(), mockFile.libraryName, mockFile.libraryName === undefined ? undefined : "1.2.3");
        mockFileToResolvedFile.set(mockFile, resolvedFile);
        importsMap.set(`./${mockFile.name}.sol`, resolvedFile);
        return resolvedFile;
    });
    const resolver = new resolver_1.Resolver(projectRoot, new parse_1.Parser(), (absolutePath) => fs_extra_1.default.readFile(absolutePath, { encoding: "utf8" }));
    resolver.resolveImport = async (from, imported) => {
        const importedFile = importsMap.get(imported);
        if (importedFile === undefined) {
            throw new Error(`${imported} is not mocked`);
        }
        return importedFile;
    };
    const dependencyGraph = await dependencyGraph_1.DependencyGraph.createFromResolvedFiles(resolver, resolvedFiles);
    return [dependencyGraph, resolvedFiles];
}
exports.createMockData = createMockData;
//# sourceMappingURL=helpers.js.map