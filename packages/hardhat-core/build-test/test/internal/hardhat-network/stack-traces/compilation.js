"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.downloadSolc = exports.COMPILER_DOWNLOAD_TIMEOUT = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const wrapper_1 = __importDefault(require("solc/wrapper"));
const download_1 = require("../../../../src/internal/util/download");
function getSolcInput(sources, compilerOptions) {
    var _a;
    return {
        language: "Solidity",
        sources: Object.assign({}, ...sources.map((s) => ({
            [path_1.default.basename(s)]: { content: fs_1.default.readFileSync(s, "utf8") },
        }))),
        settings: {
            optimizer: {
                enabled: compilerOptions.runs !== undefined,
                runs: (_a = compilerOptions.runs) !== null && _a !== void 0 ? _a : 200,
            },
            outputSelection: {
                "*": {
                    "*": [
                        "abi",
                        "evm.bytecode",
                        "evm.deployedBytecode",
                        "evm.methodIdentifiers",
                    ],
                    "": ["id", "ast"],
                },
            },
        },
    };
}
/**
 * Copied from `solidity/compiler/index.ts`.
 */
function loadCompilerSources(compilerPath) {
    const Module = module.constructor;
    const previousHook = Module._extensions[".js"];
    Module._extensions[".js"] = function (module, filename) {
        const content = fs_1.default.readFileSync(filename, "utf8");
        Object.getPrototypeOf(module)._compile.call(module, content, filename);
    };
    const loadedSolc = require(compilerPath);
    Module._extensions[".js"] = previousHook;
    return loadedSolc;
}
exports.COMPILER_DOWNLOAD_TIMEOUT = 10000;
function getCompilersDownloadDir() {
    return path_1.default.join(__dirname, "compilers");
}
function getCompilerDownloadPath(compilerPath) {
    const compilersDir = getCompilersDownloadDir();
    return path_1.default.join(compilersDir, compilerPath);
}
async function downloadSolc(compilerPath) {
    const absoluteCompilerPath = getCompilerDownloadPath(compilerPath);
    const compilerUrl = `https://solc-bin.ethereum.org/bin/${compilerPath}`;
    if (fs_1.default.existsSync(absoluteCompilerPath)) {
        return;
    }
    await download_1.download(compilerUrl, absoluteCompilerPath, exports.COMPILER_DOWNLOAD_TIMEOUT);
}
exports.downloadSolc = downloadSolc;
async function getSolc(compilerPath) {
    let absoluteCompilerPath = compilerPath;
    if (!path_1.default.isAbsolute(absoluteCompilerPath)) {
        absoluteCompilerPath = getCompilerDownloadPath(compilerPath);
    }
    return wrapper_1.default(loadCompilerSources(absoluteCompilerPath));
}
async function compile(sources, compilerOptions) {
    const input = getSolcInput(sources, compilerOptions);
    const solc = await getSolc(compilerOptions.compilerPath);
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors) {
        for (const error of output.errors) {
            if (error.severity === "error") {
                throw new Error(`Failed to compile: ${error.message}`);
            }
        }
    }
    return [input, output];
}
exports.compile = compile;
//# sourceMappingURL=compilation.js.map