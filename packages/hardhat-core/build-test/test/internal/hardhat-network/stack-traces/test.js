"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const compiler_to_model_1 = require("../../../../src/internal/hardhat-network/stack-traces/compiler-to-model");
const consoleLogger_1 = require("../../../../src/internal/hardhat-network/stack-traces/consoleLogger");
const contracts_identifier_1 = require("../../../../src/internal/hardhat-network/stack-traces/contracts-identifier");
const debug_1 = require("../../../../src/internal/hardhat-network/stack-traces/debug");
const library_utils_1 = require("../../../../src/internal/hardhat-network/stack-traces/library-utils");
const revert_reasons_1 = require("../../../../src/internal/hardhat-network/stack-traces/revert-reasons");
const solidity_stack_trace_1 = require("../../../../src/internal/hardhat-network/stack-traces/solidity-stack-trace");
const solidityTracer_1 = require("../../../../src/internal/hardhat-network/stack-traces/solidityTracer");
const vm_trace_decoder_1 = require("../../../../src/internal/hardhat-network/stack-traces/vm-trace-decoder");
const cwd_1 = require("../helpers/cwd");
const compilation_1 = require("./compilation");
const execution_1 = require("./execution");
const TEST_TIMEOUT_MILLIS = 35000;
function defineTest(dirPath, testDefinition, sources, compilerOptions, runs) {
    const desc = testDefinition.description !== undefined
        ? testDefinition.description
        : path_1.default.relative(__dirname, dirPath);
    const solcVersionDoesntMatch = testDefinition.solc !== undefined &&
        !semver_1.default.satisfies(compilerOptions.solidityVersion, testDefinition.solc);
    const func = async function () {
        this.timeout(TEST_TIMEOUT_MILLIS);
        await runTest(dirPath, testDefinition, sources, Object.assign(Object.assign({}, compilerOptions), { runs }));
    };
    if ((testDefinition.skip !== undefined && testDefinition.skip) ||
        solcVersionDoesntMatch) {
        it.skip(desc, func);
    }
    else if (testDefinition.only !== undefined && testDefinition.only) {
        it.only(desc, func);
    }
    else {
        it(desc, func);
    }
}
function defineDirTests(dirPath, compilerOptions) {
    describe(path_1.default.basename(dirPath), function () {
        const files = fs_1.default.readdirSync(dirPath).map((f) => path_1.default.join(dirPath, f));
        const sources = files.filter((f) => f.endsWith(".sol"));
        const dirs = files.filter((f) => fs_1.default.statSync(f).isDirectory());
        const testPath = path_1.default.join(dirPath, "test.json");
        if (fs_1.default.existsSync(testPath)) {
            const testDefinition = JSON.parse(fs_1.default.readFileSync(testPath, "utf8"));
            for (const tx of testDefinition.transactions) {
                if ("imports" in tx && tx.imports !== undefined) {
                    sources.push(...tx.imports.map((p) => dirPath + p));
                    break;
                }
            }
            describe("Without optimizations", function () {
                defineTest(dirPath, testDefinition, sources, compilerOptions);
            });
            if (process.env.HARDHAT_NETWORK_TESTS_WITH_OPTIMIZATIONS !== undefined) {
                const runsNumbers = [1, 200, 10000];
                for (const runs of runsNumbers) {
                    describe(`With optimizations (${runs} run)`, function () {
                        defineTest(dirPath, testDefinition, sources, compilerOptions, runs);
                    });
                }
            }
        }
        for (const dir of dirs) {
            defineDirTests(dir, compilerOptions);
        }
    });
}
async function compileIfNecessary(testDir, sources, compilerOptions) {
    const { solidityVersion, runs } = compilerOptions;
    const maxSourceCtime = sources
        .map((s) => fs_1.default.statSync(s).ctimeMs)
        .reduce((t1, t2) => Math.max(t1, t2), 0);
    const artifacts = path_1.default.join(testDir, "artifacts");
    if (!fs_1.default.existsSync(artifacts)) {
        fs_1.default.mkdirSync(artifacts);
    }
    const optimizerModifier = runs !== undefined ? `optimized-with-runs-${runs}` : "unoptimized";
    const inputPath = path_1.default.join(artifacts, `compiler-input-solc-${solidityVersion}-${optimizerModifier}.json`);
    const outputPath = path_1.default.join(artifacts, `compiler-output-solc-${solidityVersion}-${optimizerModifier}.json`);
    const isCached = fs_1.default.existsSync(inputPath) &&
        fs_1.default.existsSync(outputPath) &&
        fs_1.default.statSync(inputPath).ctimeMs > maxSourceCtime &&
        fs_1.default.statSync(outputPath).ctimeMs > maxSourceCtime;
    if (isCached) {
        const inputJson = fs_1.default.readFileSync(inputPath, "utf8");
        const outputJson = fs_1.default.readFileSync(outputPath, "utf8");
        return [JSON.parse(inputJson), JSON.parse(outputJson)];
    }
    const [compilerInput, compilerOutput] = await compilation_1.compile(sources, compilerOptions);
    fs_1.default.writeFileSync(inputPath, JSON.stringify(compilerInput, undefined, 2));
    fs_1.default.writeFileSync(outputPath, JSON.stringify(compilerOutput, undefined, 2));
    return [compilerInput, compilerOutput];
}
function compareStackTraces(txIndex, trace, description, runs) {
    for (let i = 0; i < trace.length; i++) {
        const actual = trace[i];
        const expected = description[i];
        chai_1.assert.equal(solidity_stack_trace_1.StackTraceEntryType[actual.type], expected.type, `Stack trace of tx ${txIndex} entry ${i} type is incorrect`);
        const actualMessage = actual.message;
        const decodedMessage = revert_reasons_1.decodeRevertReason(actualMessage !== undefined ? actualMessage : Buffer.from([]));
        if (expected.message !== undefined) {
            chai_1.assert.equal(decodedMessage, expected.message, `Stack trace of tx ${txIndex} entry ${i} have different messages`);
        }
        else {
            chai_1.assert.equal(decodedMessage, "", `Stack trace of tx ${txIndex} entry ${i} shouldn't have a message`);
        }
        if (expected.value !== undefined) {
            const actualValue = actual.value;
            chai_1.assert.isDefined(actualValue, `Stack trace of tx ${txIndex} entry ${i} should have value`);
            const expectedValue = new ethereumjs_util_1.BN(expected.value);
            chai_1.assert.isTrue(expectedValue.eq(actual.value), `Stack trace of tx ${txIndex} entry ${i} has value ${actualValue.toString(10)} and should have ${expectedValue.toString(10)}`);
        }
        else if ("value" in actual) {
            chai_1.assert.isUndefined(actual.value, `Stack trace of tx ${txIndex} entry ${i} shouldn't have value`);
        }
        if (expected.sourceReference === undefined) {
            chai_1.assert.isUndefined(actual.sourceReference, `Stack trace of tx ${txIndex} entry ${i} shouldn't have a sourceReference`);
        }
        else {
            chai_1.assert.equal(actual.sourceReference.contract, expected.sourceReference.contract, `Stack trace of tx ${txIndex} entry ${i} have different contract names`);
            chai_1.assert.equal(actual.sourceReference.file.sourceName, expected.sourceReference.file, `Stack trace of tx ${txIndex} entry ${i} have different file names`);
            chai_1.assert.equal(actual.sourceReference.function, expected.sourceReference.function, `Stack trace of tx ${txIndex} entry ${i} have different function names`);
            if (runs === undefined) {
                chai_1.assert.equal(actual.sourceReference.line, expected.sourceReference.line, `Stack trace of tx ${txIndex} entry ${i} have different line numbers`);
            }
        }
    }
    // We do it here so that the first few do get compared
    chai_1.assert.lengthOf(trace, description.length);
}
function compareConsoleLogs(logs, expectedLogs) {
    if (expectedLogs === undefined) {
        return;
    }
    chai_1.assert.lengthOf(logs, expectedLogs.length);
    for (let i = 0; i < logs.length; i++) {
        const actual = logs[i];
        const expected = expectedLogs[i];
        chai_1.assert.lengthOf(actual, expected.length);
        for (let j = 0; j < actual.length; j++) {
            chai_1.assert.equal(actual[j], expected[j]);
        }
    }
}
async function runTest(testDir, testDefinition, sources, compilerOptions) {
    const [compilerInput, compilerOutput] = await compileIfNecessary(testDir, sources, compilerOptions);
    const bytecodes = compiler_to_model_1.createModelsAndDecodeBytecodes(compilerOptions.solidityVersion, compilerInput, compilerOutput);
    const contractsIdentifier = new contracts_identifier_1.ContractsIdentifier();
    for (const bytecode of bytecodes) {
        if (bytecode.contract.name.startsWith("Ignored")) {
            continue;
        }
        contractsIdentifier.addBytecode(bytecode);
    }
    const vmTraceDecoder = new vm_trace_decoder_1.VmTraceDecoder(contractsIdentifier);
    const tracer = new solidityTracer_1.SolidityTracer();
    const logger = new consoleLogger_1.ConsoleLogger();
    const vm = await execution_1.instantiateVm();
    const txIndexToContract = new Map();
    for (const [txIndex, tx] of testDefinition.transactions.entries()) {
        let trace;
        if ("file" in tx) {
            trace = await runDeploymentTransactionTest(txIndex, tx, vm, compilerOutput, txIndexToContract);
            if (trace.deployedContract !== undefined) {
                txIndexToContract.set(txIndex, {
                    file: tx.file,
                    name: tx.contract,
                    address: trace.deployedContract,
                });
            }
        }
        else {
            const contract = txIndexToContract.get(tx.to);
            chai_1.assert.isDefined(contract, `No contract was deployed in tx ${tx.to} but transaction ${txIndex} is trying to call it`);
            trace = await runCallTransactionTest(txIndex, tx, vm, compilerOutput, contract);
        }
        compareConsoleLogs(logger.getExecutionLogs(trace), tx.consoleLogs);
        const decodedTrace = vmTraceDecoder.tryToDecodeMessageTrace(trace);
        try {
            if (tx.stackTrace === undefined) {
                chai_1.assert.isUndefined(trace.error, `Transaction ${txIndex} shouldn't have failed`);
            }
            else {
                chai_1.assert.isDefined(trace.error, `Transaction ${txIndex} should have failed`);
            }
        }
        catch (error) {
            debug_1.printMessageTrace(decodedTrace);
            throw error;
        }
        if (trace.error !== undefined) {
            const stackTrace = tracer.getStackTrace(decodedTrace);
            try {
                compareStackTraces(txIndex, stackTrace, tx.stackTrace, compilerOptions.runs);
                if (testDefinition.print !== undefined && testDefinition.print) {
                    console.log(`Transaction ${txIndex} stack trace`);
                    debug_1.printStackTrace(stackTrace);
                }
            }
            catch (err) {
                debug_1.printMessageTrace(decodedTrace);
                debug_1.printStackTrace(stackTrace);
                throw err;
            }
        }
    }
}
function linkBytecode(txIndex, bytecode, libs, txIndexToContract) {
    let code = bytecode.object;
    for (const [file, fileLibs] of Object.entries(bytecode.linkReferences)) {
        chai_1.assert.isDefined(libs, `Libraries missing for deploying transaction ${txIndex}`);
        chai_1.assert.isDefined(libs[file], `Libraries missing for deploying transaction ${txIndex}`);
        for (const [libName, references] of Object.entries(fileLibs)) {
            chai_1.assert.isDefined(libs[file][libName], `Libraries missing for deploying transaction ${txIndex}`);
            const libTxId = libs[file][libName];
            const address = txIndexToContract.get(libTxId);
            chai_1.assert.isDefined(address, `Trying to link a library deployed in ${libTxId} for tx ${txIndex} but id doesn't exist`);
            for (const ref of references) {
                code = library_utils_1.linkHexStringBytecode(code, address.address.toString("hex"), ref.start);
            }
        }
    }
    chai_1.assert.notInclude(code, "_", `Libraries missing for deploying transaction ${txIndex}`);
    return Buffer.from(code, "hex");
}
async function runDeploymentTransactionTest(txIndex, tx, vm, compilerOutput, txIndexToContract) {
    const file = compilerOutput.contracts[tx.file];
    chai_1.assert.isDefined(file, `File ${tx.file} from transaction ${txIndex} doesn't exist`);
    const contract = file[tx.contract];
    chai_1.assert.isDefined(contract, `Contract ${tx.contract} from transaction ${txIndex} doesn't exist`);
    const deploymentBytecode = linkBytecode(txIndex, contract.evm.bytecode, tx.libraries, txIndexToContract);
    const params = execution_1.encodeConstructorParams(contract.abi, tx.params !== undefined ? tx.params : []);
    const data = Buffer.concat([deploymentBytecode, params]);
    const trace = await execution_1.traceTransaction(vm, {
        value: tx.value,
        data,
        gasLimit: tx.gas,
    });
    return trace;
}
async function runCallTransactionTest(txIndex, tx, vm, compilerOutput, contract) {
    const compilerContract = compilerOutput.contracts[contract.file][contract.name];
    let data;
    if (tx.data !== undefined) {
        data = ethereumjs_util_1.toBuffer(tx.data);
    }
    else if (tx.function !== undefined) {
        data = execution_1.encodeCall(compilerContract.abi, tx.function, tx.params !== undefined ? tx.params : []);
    }
    else {
        data = Buffer.from([]);
    }
    const trace = await execution_1.traceTransaction(vm, {
        to: contract.address,
        value: tx.value,
        data,
        gasLimit: tx.gas,
    });
    return trace;
}
const solidity05Compilers = [
    {
        solidityVersion: "0.5.1",
        compilerPath: "soljson-v0.5.1+commit.c8a2cb62.js",
    },
    {
        solidityVersion: "0.5.17",
        compilerPath: "soljson-v0.5.17+commit.d19bba13.js",
    },
];
const solidity06Compilers = [
    {
        solidityVersion: "0.6.0",
        compilerPath: "soljson-v0.6.0+commit.26b70077.js",
    },
    // {
    //   solidityVersion: "0.6.1",
    //   compilerPath: "soljson-v0.6.1+commit.e6f7d5a4.js",
    // },
    // {
    //   solidityVersion: "0.6.2",
    //   compilerPath: "soljson-v0.6.2+commit.bacdbe57.js",
    // },
    // This version is enabled because it contains of a huge change in how
    // sourcemaps work
    {
        solidityVersion: "0.6.3",
        compilerPath: "soljson-v0.6.3+commit.8dda9521.js",
    },
    // {
    //   solidityVersion: "0.6.4",
    //   compilerPath: "soljson-v0.6.4+commit.1dca32f3.js",
    // },
    // {
    //   solidityVersion: "0.6.5",
    //   compilerPath: "soljson-v0.6.5+commit.f956cc89.js",
    // },
    // {
    //   solidityVersion: "0.6.6",
    //   compilerPath: "soljson-v0.6.6+commit.6c089d02.js",
    // },
    // {
    //   solidityVersion: "0.6.7",
    //   compilerPath: "soljson-v0.6.7+commit.b8d736ae.js",
    // },
    // {
    //   solidityVersion: "0.6.8",
    //   compilerPath: "soljson-v0.6.8+commit.0bbfe453.js",
    // },
    // {
    //   solidityVersion: "0.6.9",
    //   compilerPath: "soljson-v0.6.9+commit.3e3065ac.js",
    // },
    // {
    //   solidityVersion: "0.6.10",
    //   compilerPath: "soljson-v0.6.10+commit.00c0fcaf.js",
    // },
    // {
    //   solidityVersion: "0.6.11",
    //   compilerPath: "soljson-v0.6.11+commit.5ef660b1.js",
    // },
    {
        solidityVersion: "0.6.12",
        compilerPath: "soljson-v0.6.12+commit.27d51765.js",
    },
];
const solidity07Compilers = [
    {
        solidityVersion: "0.7.0",
        compilerPath: "soljson-v0.7.0+commit.9e61f92b.js",
    },
];
const solidity08Compilers = [
    {
        solidityVersion: "0.8.0",
        compilerPath: "soljson-v0.8.0+commit.c7dfd78e.js",
    },
];
describe("Stack traces", function () {
    cwd_1.setCWD();
    // if a path to a solc file was specified, we only run these tests and use
    // that compiler
    const customSolcPath = process.env.HARDHAT_TESTS_SOLC_PATH;
    if (customSolcPath !== undefined) {
        const customSolcVersion = process.env.HARDHAT_TESTS_SOLC_VERSION;
        if (customSolcVersion === undefined) {
            console.error("HARDHAT_TESTS_SOLC_VERSION has to be set when using HARDHAT_TESTS_SOLC_PATH");
            process.exit(1);
        }
        describe.only(`Use compiler at ${customSolcPath} with version ${customSolcVersion}`, function () {
            const compilerOptions = {
                solidityVersion: customSolcVersion,
                compilerPath: customSolcPath,
            };
            const testsDir = semver_1.default.satisfies(customSolcVersion, "^0.5.0")
                ? "0_5"
                : semver_1.default.satisfies(customSolcVersion, "^0.6.0")
                    ? "0_6"
                    : semver_1.default.satisfies(customSolcVersion, "^0.7.0")
                        ? "0_7"
                        : semver_1.default.satisfies(customSolcVersion, "^0.8.0")
                            ? "0_8"
                            : null;
            if (testsDir === null) {
                console.error(`There are no tests for version ${customSolcVersion}`);
                process.exit(1);
            }
            defineDirTests(path_1.default.join(__dirname, "test-files", testsDir), compilerOptions);
            defineDirTests(path_1.default.join(__dirname, "test-files", "version-independent"), compilerOptions);
        });
        return;
    }
    before("Download solcjs binaries", async function () {
        const paths = new Set([
            ...solidity05Compilers.map((c) => c.compilerPath),
            ...solidity06Compilers.map((c) => c.compilerPath),
            ...solidity07Compilers.map((c) => c.compilerPath),
            ...solidity08Compilers.map((c) => c.compilerPath),
        ]);
        this.timeout(paths.size * compilation_1.COMPILER_DOWNLOAD_TIMEOUT);
        for (const p of paths) {
            await compilation_1.downloadSolc(p);
        }
    });
    defineTestForSolidityMajorVersion(solidity05Compilers, "0_5");
    defineTestForSolidityMajorVersion(solidity06Compilers, "0_6");
    defineTestForSolidityMajorVersion(solidity07Compilers, "0_7");
    defineTestForSolidityMajorVersion(solidity08Compilers, "0_8");
});
function defineTestForSolidityMajorVersion(solcVersionsCompilerOptions, testsPath) {
    for (const compilerOptions of solcVersionsCompilerOptions) {
        describe(`Use compiler ${compilerOptions.compilerPath}`, function () {
            defineDirTests(path_1.default.join(__dirname, "test-files", testsPath), compilerOptions);
            defineDirTests(path_1.default.join(__dirname, "test-files", "version-independent"), compilerOptions);
        });
    }
}
//# sourceMappingURL=test.js.map