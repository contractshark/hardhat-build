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
const slash_1 = __importDefault(require("slash"));
const task_names_1 = require("../../../src/builtin-tasks/task-names");
const errors_list_1 = require("../../../src/internal/core/errors-list");
const parse_1 = require("../../../src/internal/solidity/parse");
const resolver_1 = require("../../../src/internal/solidity/resolver");
const environment_1 = require("../../helpers/environment");
const errors_1 = require("../../helpers/errors");
const project_1 = require("../../helpers/project");
function assertResolvedFilePartiallyEquals(actual, expected) {
    for (const key of Object.keys(expected)) {
        const typedKey = key;
        chai_1.assert.deepEqual(actual[typedKey], expected[typedKey]);
    }
}
const buildContent = (rawContent) => ({
    rawContent,
    imports: [],
    versionPragmas: [],
});
describe("Resolved file", function () {
    const sourceName = "sourceName.sol";
    const absolutePath = "/path/to/file/sourceName.sol";
    const content = buildContent("the file content");
    const lastModificationDate = new Date();
    const libraryName = "lib";
    const libraryVersion = "0.1.0";
    let resolvedFileWithoutLibrary;
    let resolvedFileWithLibrary;
    before("init files", function () {
        resolvedFileWithoutLibrary = new resolver_1.ResolvedFile(sourceName, absolutePath, content, "<content-hash-file-without-library>", lastModificationDate);
        resolvedFileWithLibrary = new resolver_1.ResolvedFile(sourceName, absolutePath, content, "<content-hash-file-with-library>", lastModificationDate, libraryName, libraryVersion);
    });
    it("should be constructed correctly without a library", function () {
        assertResolvedFilePartiallyEquals(resolvedFileWithoutLibrary, {
            sourceName,
            absolutePath,
            content,
            lastModificationDate,
            library: undefined,
        });
    });
    it("Should be constructed correctly with a library", function () {
        assertResolvedFilePartiallyEquals(resolvedFileWithLibrary, {
            sourceName,
            absolutePath,
            content,
            lastModificationDate,
            library: {
                name: libraryName,
                version: libraryVersion,
            },
        });
    });
    describe("getVersionedName", function () {
        it("Should give the source name if the file isn't from a library", function () {
            chai_1.assert.equal(resolvedFileWithoutLibrary.getVersionedName(), sourceName);
        });
        it("Should add the version if the file is from a library", function () {
            chai_1.assert.equal(resolvedFileWithLibrary.getVersionedName(), `${sourceName}@v${libraryVersion}`);
        });
    });
});
async function assertResolvedFileFromPath(resolverPromise, expectedSourceName, filePath, libraryInfo) {
    const resolved = await resolverPromise;
    const absolutePath = await fsExtra.realpath(filePath);
    chai_1.assert.equal(resolved.sourceName, expectedSourceName);
    chai_1.assert.equal(resolved.absolutePath, absolutePath);
    chai_1.assert.deepEqual(resolved.library, libraryInfo);
    const { ctime } = await fsExtra.stat(absolutePath);
    chai_1.assert.equal(resolved.lastModificationDate.valueOf(), ctime.valueOf());
}
describe("Resolver", function () {
    const projectName = "resolver-tests-project";
    project_1.useFixtureProject(projectName);
    let resolver;
    let projectPath;
    before("Get project path", async function () {
        projectPath = await project_1.getFixtureProjectPath(projectName);
    });
    beforeEach("Init resolver", async function () {
        resolver = new resolver_1.Resolver(projectPath, new parse_1.Parser(), (absolutePath) => fsExtra.readFile(absolutePath, { encoding: "utf8" }));
    });
    describe("resolveSourceName", function () {
        it("Should validate the source name format", async function () {
            await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("asd\\asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_BACKSLASHES);
            await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName(slash_1.default(__dirname)), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_ABSOLUTE_PATH);
        });
        describe("Local vs library distinction", function () {
            it("Should be local if it exists in the project", async function () {
                await assertResolvedFileFromPath(resolver.resolveSourceName("contracts/c.sol"), "contracts/c.sol", path_1.default.join(projectPath, "contracts/c.sol"));
            });
            it("Should be a library if it starts with node_modules", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("node_modules/lib/l.sol"), errors_list_1.ERRORS.RESOLVER.LIBRARY_NOT_INSTALLED);
            });
            it("Should be local if its first directory exists in the project, even it it doesn't exist", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("contracts/non-existent.sol"), errors_list_1.ERRORS.RESOLVER.FILE_NOT_FOUND);
            });
            it("Should be a library its first directory doesn't exist in the project", async function () {
                await assertResolvedFileFromPath(resolver.resolveSourceName("lib/l.sol"), "lib/l.sol", path_1.default.join(projectPath, "node_modules/lib/l.sol"), { name: "lib", version: "1.0.0" });
            });
        });
        describe("Local files", function () {
            it("Should resolve an existing file", async function () {
                await assertResolvedFileFromPath(resolver.resolveSourceName("contracts/c.sol"), "contracts/c.sol", path_1.default.join(projectPath, "contracts/c.sol"));
                await assertResolvedFileFromPath(resolver.resolveSourceName("other/o.sol"), "other/o.sol", path_1.default.join(projectPath, "other/o.sol"));
            });
            it("Should fail if the casing is incorrect", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("contracts/C.sol"), errors_list_1.ERRORS.RESOLVER.WRONG_SOURCE_NAME_CASING);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("contracts/c.Sol"), errors_list_1.ERRORS.RESOLVER.WRONG_SOURCE_NAME_CASING);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("contractS/c.sol"), errors_list_1.ERRORS.RESOLVER.WRONG_SOURCE_NAME_CASING);
            });
            it("Should fail with FILE_NOT_FOUND if the first directory exists but the file doesn't", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("contracts/non-existent.sol"), errors_list_1.ERRORS.RESOLVER.FILE_NOT_FOUND);
            });
            it("Should fail with FILE_NOT_FOUND if the first directory exists but the file doesn't, even if the casing of the first dir is wrong", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("contractS/non-existent.sol"), errors_list_1.ERRORS.RESOLVER.FILE_NOT_FOUND);
            });
        });
        describe("Library files", function () {
            it("Should resolve to the node_modules file", async function () {
                await assertResolvedFileFromPath(resolver.resolveSourceName("lib/l.sol"), "lib/l.sol", path_1.default.join(projectPath, "node_modules/lib/l.sol"), { name: "lib", version: "1.0.0" });
            });
            it("Should fail if the casing is incorrect", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("lib/L.sol"), errors_list_1.ERRORS.RESOLVER.WRONG_SOURCE_NAME_CASING);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("lib/l.Sol"), errors_list_1.ERRORS.RESOLVER.WRONG_SOURCE_NAME_CASING);
                // This error is platform dependant, as when resolving a library name
                // we use node's resolution algorithm, and it's case-sensitive or not
                // depending on the platform.
                if (process.platform === "win32" || process.platform === "darwin") {
                    await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("liB/l.sol"), errors_list_1.ERRORS.RESOLVER.WRONG_SOURCE_NAME_CASING);
                }
                else {
                    await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("liB/l.sol"), errors_list_1.ERRORS.RESOLVER.LIBRARY_NOT_INSTALLED);
                }
            });
            it("Should fail if the library is not installed", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("not-installed/l.sol"), errors_list_1.ERRORS.RESOLVER.LIBRARY_NOT_INSTALLED);
            });
            it("Should fail if the library is installed byt the file not found", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveSourceName("lib/l2.sol"), errors_list_1.ERRORS.RESOLVER.LIBRARY_FILE_NOT_FOUND);
            });
        });
    });
    describe("resolveImport", function () {
        let localFrom;
        let libraryFrom;
        before(function () {
            localFrom = new resolver_1.ResolvedFile("contracts/c.sol", path_1.default.join(projectPath, "contracts/c.sol"), {
                rawContent: "asd",
                imports: [],
                versionPragmas: [],
            }, "<content-hash-c>", new Date());
            libraryFrom = new resolver_1.ResolvedFile("lib/l.sol", path_1.default.join(projectPath, "node_modules/lib/l.sol"), {
                rawContent: "asd",
                imports: [],
                versionPragmas: [],
            }, "<content-hash-l>", new Date(), "lib", "1.0.0");
        });
        describe("Invalid imports", function () {
            it("shouldn't let you import something using http or other protocols", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "http://google.com"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_PROTOCOL);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(libraryFrom, "https://google.com"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_PROTOCOL);
            });
            it("shouldn't let you import something using backslashes", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "sub\\a.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_BACKSLASH);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(libraryFrom, "sub\\a.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_BACKSLASH);
            });
            it("shouldn't let you import something using an absolute path", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "/asd"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_ABSOLUTE_PATH);
            });
        });
        describe("Absolute imports", function () {
            it("Accept non-normalized imports", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "other/asd/../o.sol"), "other/o.sol", path_1.default.join(projectPath, "other/o.sol"));
            });
            it("Should accept non-top-level files from libraries", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(libraryFrom, "lib/sub/a.sol"), "lib/sub/a.sol", path_1.default.join(projectPath, "node_modules/lib/sub/a.sol"), {
                    name: "lib",
                    version: "1.0.0",
                });
            });
            it("should resolve @scoped/libraries", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(libraryFrom, "@scoped/library/d/l.sol"), "@scoped/library/d/l.sol", path_1.default.join(projectPath, "node_modules/@scoped/library/d/l.sol"), {
                    name: "@scoped/library",
                    version: "1.0.0",
                });
            });
            it("shouldn't let you import something from an uninstalled library", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "non-installed/asd.sol"), errors_list_1.ERRORS.RESOLVER.IMPORTED_LIBRARY_NOT_INSTALLED);
            });
            it("should fail if importing a missing file", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "lib/asd.sol"), errors_list_1.ERRORS.RESOLVER.IMPORTED_FILE_NOT_FOUND);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "contracts/asd.sol"), errors_list_1.ERRORS.RESOLVER.IMPORTED_FILE_NOT_FOUND);
            });
            it("should fail if importing a file with the incorrect casing", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "lib/L.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_WRONG_CASING);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "contracts/C.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_WRONG_CASING);
            });
            it("Should accept local files from different directories", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "other/o.sol"), "other/o.sol", path_1.default.join(projectPath, "other/o.sol"));
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "contracts/c.sol"), "contracts/c.sol", path_1.default.join(projectPath, "contracts/c.sol"));
            });
            it("Should accept imports from a library into another one", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(libraryFrom, "lib2/l2.sol"), "lib2/l2.sol", path_1.default.join(projectPath, "node_modules/lib2/l2.sol"), {
                    name: "lib2",
                    version: "1.0.0",
                });
            });
            it("Should forbid local imports from libraries", async function () {
                // TODO: Should we implement this?
            });
            it("Should resolve libraries that have been installed with a different name successfully", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "library-with-other-name-1.2.3/c.sol"), "library-with-other-name-1.2.3/c.sol", path_1.default.join(projectPath, "node_modules/library-with-other-name-1.2.3/c.sol"), {
                    name: "library-with-other-name-1.2.3",
                    version: "1.2.3",
                });
            });
            it("Should resolve linked libraries correctly", async function () {
                if (process.platform === "win32") {
                    this.skip();
                    return;
                }
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "linked-library/c.sol"), "linked-library/c.sol", path_1.default.join(projectPath, "library/c.sol"), {
                    name: "linked-library",
                    version: "1.2.4",
                });
            });
        });
        describe("Relative imports", function () {
            it("shouldn't let you import something outside of the project from a local file", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "../../asd.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_OUTSIDE_OF_PROJECT);
            });
            it("shouldn't let you import something from a library that is outside of it", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(libraryFrom, "../asd.sol"), errors_list_1.ERRORS.RESOLVER.ILLEGAL_IMPORT);
            });
            it("Accept non-normalized imports", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "../other/asd/../o.sol"), "other/o.sol", path_1.default.join(projectPath, "other/o.sol"));
            });
            it("should fail if importing a missing file", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(libraryFrom, "./asd.sol"), errors_list_1.ERRORS.RESOLVER.IMPORTED_FILE_NOT_FOUND);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "../other/asd.sol"), errors_list_1.ERRORS.RESOLVER.IMPORTED_FILE_NOT_FOUND);
            });
            it("should fail if importing a file with the incorrect casing", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(libraryFrom, "./sub/A.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_WRONG_CASING);
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "./sub/A.sol"), errors_list_1.ERRORS.RESOLVER.INVALID_IMPORT_WRONG_CASING);
            });
            it("Should always treat relative imports from local files as local", async function () {
                await errors_1.expectHardhatErrorAsync(() => resolver.resolveImport(localFrom, "../not-a-library/A.sol"), errors_list_1.ERRORS.RESOLVER.IMPORTED_FILE_NOT_FOUND);
            });
            it("Should let you import a library file with its relative path from a local file", async function () {
                await assertResolvedFileFromPath(resolver.resolveImport(localFrom, "../node_modules/lib/l.sol"), "lib/l.sol", path_1.default.join(projectPath, "node_modules/lib/l.sol"), {
                    name: "lib",
                    version: "1.0.0",
                });
            });
        });
    });
});
describe("Resolver regression tests", function () {
    describe("Project with a hardhat subdirectory", function () {
        const projectName = "project-with-hardhat-directory";
        project_1.useFixtureProject(projectName);
        environment_1.useEnvironment();
        // This test ensures the resolver lets you compile a project with the packaged console.sol
        // in a Hardhat project that has a "hardhat" subdirectory.
        // See issue https://github.com/nomiclabs/hardhat/issues/998
        it("Should compile the Greeter contract that imports console.log from hardhat", async function () {
            return this.env.run(task_names_1.TASK_COMPILE, { quiet: true });
        });
    });
});
//# sourceMappingURL=resolver.js.map