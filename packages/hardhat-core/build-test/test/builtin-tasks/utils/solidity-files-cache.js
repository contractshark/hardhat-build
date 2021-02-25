"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const solidity_files_cache_1 = require("../../../src/builtin-tasks/utils/solidity-files-cache");
const UNMODIFIED_CONTENT_HASH = "<unmodified-content-hash>";
const MODIFIED_CONTENT_HASH = "<modified-content-hash>";
function mockCachedFile(sourceName, other = {}) {
    return Object.assign({ sourceName, lastModificationDate: new Date().valueOf(), contentHash: UNMODIFIED_CONTENT_HASH, solcConfig: { version: "0.6.6", settings: {} }, imports: [], versionPragmas: [], artifacts: [] }, other);
}
describe("SolidityFilesCache", function () {
    const now = new Date();
    const oneHourAgo = new Date(now.valueOf() - 3600 * 1000);
    it("should construct an empty cache", async function () {
        const cache = {
            _format: "",
            files: {},
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        chai_1.assert.isEmpty(solidityFilesCache.getEntries());
    });
    it("should construct a cache with a file", async function () {
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol"),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        chai_1.assert.lengthOf(solidityFilesCache.getEntries(), 1);
        chai_1.assert.isDefined(solidityFilesCache.getEntry("/path/to/contracts/file.sol"));
    });
    it("should mark a file as not changed if it was not modified", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", UNMODIFIED_CONTENT_HASH, solcConfig);
        chai_1.assert.isFalse(hasChanged);
    });
    it("should mark a file as changed if it was modified", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", MODIFIED_CONTENT_HASH, solcConfig);
        chai_1.assert.isTrue(hasChanged);
    });
    it("should mark a file as changed if it doesn't exist in the cache", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/anotherFile.sol", UNMODIFIED_CONTENT_HASH, solcConfig);
        chai_1.assert.isTrue(hasChanged);
    });
    it("should mark a file as changed if the last solc version used is different", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", UNMODIFIED_CONTENT_HASH, { version: "0.6.7", settings: {} });
        chai_1.assert.isTrue(hasChanged);
    });
    it("should mark a file as changed if the last solc optimization setting used is different", async function () {
        const solcConfig = { version: "0.6.6", settings: { optimizer: false } };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", UNMODIFIED_CONTENT_HASH, { version: "0.6.6", settings: { optimizer: true, runs: 200 } });
        chai_1.assert.isTrue(hasChanged);
    });
    it("should work if the solc config is not the same reference", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", UNMODIFIED_CONTENT_HASH, { version: "0.6.6", settings: {} });
        chai_1.assert.isFalse(hasChanged);
    });
    it("should ignore the solc config if it's not passed (unchanged file)", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", UNMODIFIED_CONTENT_HASH);
        chai_1.assert.isFalse(hasChanged);
    });
    it("should ignore the solc config if it's not passed (changed file)", async function () {
        const solcConfig = { version: "0.6.6", settings: {} };
        const cache = {
            _format: "",
            files: {
                "/path/to/contracts/file.sol": mockCachedFile("contracts/file.sol", {
                    lastModificationDate: oneHourAgo.valueOf(),
                    solcConfig,
                }),
            },
        };
        const solidityFilesCache = new solidity_files_cache_1.SolidityFilesCache(cache);
        const hasChanged = solidityFilesCache.hasFileChanged("/path/to/contracts/file.sol", MODIFIED_CONTENT_HASH);
        chai_1.assert.isTrue(hasChanged);
    });
});
//# sourceMappingURL=solidity-files-cache.js.map