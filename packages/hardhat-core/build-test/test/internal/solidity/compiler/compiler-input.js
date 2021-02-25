"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const default_config_1 = require("../../../../src/internal/core/config/default-config");
const compilation_job_1 = require("../../../../src/internal/solidity/compilation-job");
const compiler_input_1 = require("../../../../src/internal/solidity/compiler/compiler-input");
const resolver_1 = require("../../../../src/internal/solidity/resolver");
describe("compiler-input module", function () {
    it("Should construct the right input for a compilation job", async () => {
        const optimizerConfig = {
            runs: 200,
            enabled: false,
        };
        const sourceName1 = "the/source/name.sol";
        const path1 = "/fake/absolute/path";
        const content1 = "THE CONTENT1";
        const sourceName2 = "the/source/name2.sol";
        const path2 = "/fake/absolute/path2";
        const content2 = "THE CONTENT2";
        const expectedInput = {
            language: "Solidity",
            sources: {
                [sourceName1]: { content: content1 },
                [sourceName2]: { content: content2 },
            },
            settings: {
                optimizer: optimizerConfig,
                outputSelection: {
                    "*": {
                        "*": [
                            "abi",
                            "evm.bytecode",
                            "evm.deployedBytecode",
                            "evm.methodIdentifiers",
                        ],
                        "": ["ast"],
                    },
                },
            },
        };
        const files = [
            new resolver_1.ResolvedFile(sourceName1, path1, { rawContent: content1, imports: [], versionPragmas: [] }, "<content-hash-1>", new Date()),
            new resolver_1.ResolvedFile(sourceName2, path2, { rawContent: content2, imports: [], versionPragmas: [] }, "<content-hash-2>", new Date()),
        ];
        const job = new compilation_job_1.CompilationJob({
            version: "0.5.5",
            settings: {
                optimizer: optimizerConfig,
                outputSelection: default_config_1.defaultSolcOutputSelection,
            },
        });
        job.addFileToCompile(files[0], true);
        job.addFileToCompile(files[1], true);
        const input = compiler_input_1.getInputFromCompilationJob(job);
        chai_1.assert.deepEqual(input, expectedInput);
        const jobWithEvmVersion = new compilation_job_1.CompilationJob({
            version: "0.5.5",
            settings: {
                optimizer: optimizerConfig,
                evmVersion: "byzantium",
                outputSelection: default_config_1.defaultSolcOutputSelection,
            },
        });
        jobWithEvmVersion.addFileToCompile(files[0], true);
        jobWithEvmVersion.addFileToCompile(files[1], true);
        const inputWithEvmVersion = compiler_input_1.getInputFromCompilationJob(jobWithEvmVersion);
        expectedInput.settings.evmVersion = "byzantium";
        chai_1.assert.deepEqual(inputWithEvmVersion, expectedInput);
    });
});
//# sourceMappingURL=compiler-input.js.map