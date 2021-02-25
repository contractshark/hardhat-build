"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const compiler_1 = require("../../../../src/internal/solidity/compiler");
const downloader_1 = require("../../../../src/internal/solidity/compiler/downloader");
const fs_1 = require("../../../helpers/fs");
const solcVersion = "0.6.6";
describe("Compiler", () => {
    describe("native", function () {
        fs_1.useTmpDir("native-compiler-execution");
        let downloader;
        let optimizerConfig;
        let solcPath;
        before(function () {
            optimizerConfig = {
                runs: 200,
                enabled: false,
            };
        });
        beforeEach(async function () {
            downloader = new downloader_1.CompilerDownloader(this.tmpDir);
            const compilerPathResult = await downloader.getDownloadedCompilerPath(solcVersion);
            solcPath = compilerPathResult.compilerPath;
        });
        it("Should compile contracts correctly", async () => {
            const input = {
                language: "Solidity",
                sources: {
                    "A.sol": {
                        content: `
pragma solidity ^${solcVersion};
contract A {}
`,
                    },
                },
                settings: {
                    evmVersion: "byzantium",
                    metadata: {
                        useLiteralContent: true,
                    },
                    optimizer: optimizerConfig,
                    outputSelection: {
                        "*": {
                            "*": ["evm.bytecode.object", "abi"],
                            "": ["ast"],
                        },
                    },
                },
            };
            const compiler = new compiler_1.NativeCompiler(solcPath);
            const output = await compiler.compile(input);
            // We just check some properties
            chai_1.assert.isDefined(output.contracts);
            chai_1.assert.isDefined(output.contracts["A.sol"]);
            chai_1.assert.isDefined(output.contracts["A.sol"].A);
            chai_1.assert.isDefined(output.sources);
            chai_1.assert.isDefined(output.sources["A.sol"]);
            chai_1.assert.isDefined(output.sources["A.sol"].ast);
            chai_1.assert.equal(output.sources["A.sol"].id, 0);
        });
        it("Shouldn't throw if there's a syntax error", async () => {
            const input = {
                language: "Solidity",
                sources: {
                    "A.sol": {
                        content: `pragma sol`,
                    },
                },
                settings: {
                    evmVersion: "byzantium",
                    metadata: {
                        useLiteralContent: true,
                    },
                    optimizer: optimizerConfig,
                    outputSelection: {
                        "*": {
                            "*": ["evm.bytecode.object", "abi"],
                            "": ["ast"],
                        },
                    },
                },
            };
            const compiler = new compiler_1.NativeCompiler(solcPath);
            const output = await compiler.compile(input);
            chai_1.assert.isDefined(output.errors);
            chai_1.assert.isNotEmpty(output.errors);
        });
    });
    describe("solcjs", function () {
        fs_1.useTmpDir("solcjs-compiler-execution");
        let downloader;
        let optimizerConfig;
        let solcPath;
        before(function () {
            optimizerConfig = {
                runs: 200,
                enabled: false,
            };
        });
        beforeEach(async function () {
            downloader = new downloader_1.CompilerDownloader(this.tmpDir, {
                forceSolcJs: true,
            });
            const compilerPathResult = await downloader.getDownloadedCompilerPath(solcVersion);
            solcPath = compilerPathResult.compilerPath;
        });
        it("Should compile contracts correctly", async () => {
            const input = {
                language: "Solidity",
                sources: {
                    "A.sol": {
                        content: `
pragma solidity ^${solcVersion};
contract A {}
`,
                    },
                },
                settings: {
                    evmVersion: "byzantium",
                    metadata: {
                        useLiteralContent: true,
                    },
                    optimizer: optimizerConfig,
                    outputSelection: {
                        "*": {
                            "*": ["evm.bytecode.object", "abi"],
                            "": ["ast"],
                        },
                    },
                },
            };
            const compiler = new compiler_1.Compiler(solcPath);
            const output = await compiler.compile(input);
            // We just check some properties
            chai_1.assert.isDefined(output.contracts);
            chai_1.assert.isDefined(output.contracts["A.sol"]);
            chai_1.assert.isDefined(output.contracts["A.sol"].A);
            chai_1.assert.isDefined(output.sources);
            chai_1.assert.isDefined(output.sources["A.sol"]);
            chai_1.assert.isDefined(output.sources["A.sol"].ast);
            chai_1.assert.equal(output.sources["A.sol"].id, 0);
        });
        it("Shouldn't throw if there's a syntax error", async () => {
            const input = {
                language: "Solidity",
                sources: {
                    "A.sol": {
                        content: `pragma sol`,
                    },
                },
                settings: {
                    evmVersion: "byzantium",
                    metadata: {
                        useLiteralContent: true,
                    },
                    optimizer: optimizerConfig,
                    outputSelection: {
                        "*": {
                            "*": ["evm.bytecode.object", "abi"],
                            "": ["ast"],
                        },
                    },
                },
            };
            const compiler = new compiler_1.Compiler(solcPath);
            const output = await compiler.compile(input);
            chai_1.assert.isDefined(output.errors);
            chai_1.assert.isNotEmpty(output.errors);
        });
    });
});
//# sourceMappingURL=index.js.map