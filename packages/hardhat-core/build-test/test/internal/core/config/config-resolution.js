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
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const path = __importStar(require("path"));
const config_resolution_1 = require("../../../../src/internal/core/config/config-resolution");
const default_config_1 = require("../../../../src/internal/core/config/default-config");
describe("Config resolution", () => {
    describe("Default config merging", () => {
        describe("With default config", () => {
            it("should return the default config", () => {
                var _a, _b;
                const config = config_resolution_1.resolveConfig(__filename, {});
                chai_1.assert.lengthOf(config.solidity.compilers, 1);
                chai_1.assert.equal(config.solidity.compilers[0].version, default_config_1.DEFAULT_SOLC_VERSION);
                chai_1.assert.containsAllKeys(config.networks, ["localhost"]);
                chai_1.assert.isUndefined((_b = (_a = config.solidity.compilers[0]) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b.evmVersion);
                chai_1.assert.equal(config.defaultNetwork, "hardhat");
                const hardhatNetworkConfig = config.networks
                    .hardhat;
                chai_1.assert.equal(hardhatNetworkConfig.throwOnTransactionFailures, true);
                chai_1.assert.equal(hardhatNetworkConfig.throwOnCallFailures, true);
            });
        });
        describe("With custom config", () => {
            let config;
            beforeEach(() => {
                config = config_resolution_1.resolveConfig(__filename, {
                    defaultNetwork: "custom",
                    networks: {
                        custom: {
                            url: "http://localhost:8545",
                        },
                        localhost: {
                            accounts: [
                                "0xa95f9e3e7ae4e4865c5968828fe7c03fffa8a9f3bb52d36d26243f4c868ee166",
                            ],
                        },
                    },
                    solidity: "0.5.15",
                    unknown: {
                        asd: 123,
                    },
                });
            });
            it("should return the config merged ", () => {
                chai_1.assert.lengthOf(config.solidity.compilers, 1);
                chai_1.assert.equal(config.solidity.compilers[0].version, "0.5.15");
                chai_1.assert.containsAllKeys(config.networks, ["localhost", "custom"]);
                chai_1.assert.equal(config.defaultNetwork, "custom");
            });
            it("should return the config merged ", () => {
                chai_1.assert.lengthOf(config.solidity.compilers, 1);
                chai_1.assert.equal(config.solidity.compilers[0].version, "0.5.15");
                chai_1.assert.containsAllKeys(config.networks, ["localhost", "custom"]);
                chai_1.assert.equal(config.networks.localhost.url, "http://127.0.0.1:8545");
                chai_1.assert.deepEqual(config.networks.localhost.accounts, [
                    "0xa95f9e3e7ae4e4865c5968828fe7c03fffa8a9f3bb52d36d26243f4c868ee166",
                ]);
            });
            it("should keep any unknown field", () => {
                chai_1.assert.deepEqual(config.unknown, { asd: 123 });
            });
        });
        describe("With custom solidity", () => {
            let config;
            beforeEach(() => {
                const optimizer = {
                    enabled: false,
                    runs: 200,
                };
                config = config_resolution_1.resolveConfig(__filename, {
                    solidity: {
                        compilers: [
                            {
                                version: "0.5.5",
                                settings: {
                                    optimizer,
                                    metadata: {
                                        useLiteralContent: true,
                                    },
                                    outputSelection: {
                                        "*": {
                                            "*": ["metadata"],
                                        },
                                    },
                                },
                            },
                            { version: "0.6.7", settings: { optimizer } },
                        ],
                        overrides: {
                            "a.sol": {
                                version: "0.6.1",
                                settings: {
                                    optimizer: {
                                        enabled: true,
                                    },
                                },
                            },
                        },
                    },
                });
            });
            it("should return the user's solidity config", () => {
                const solidityConfig = config.solidity;
                const modifiedOutputSelections = cloneDeep_1.default(default_config_1.defaultSolcOutputSelection);
                modifiedOutputSelections["*"]["*"] = [
                    "metadata",
                    ...modifiedOutputSelections["*"]["*"],
                ];
                chai_1.assert.deepEqual(solidityConfig, {
                    compilers: [
                        {
                            version: "0.5.5",
                            settings: {
                                optimizer: { enabled: false, runs: 200 },
                                metadata: {
                                    useLiteralContent: true,
                                },
                                outputSelection: modifiedOutputSelections,
                            },
                        },
                        {
                            version: "0.6.7",
                            settings: {
                                optimizer: { enabled: false, runs: 200 },
                                outputSelection: default_config_1.defaultSolcOutputSelection,
                            },
                        },
                    ],
                    overrides: {
                        "a.sol": {
                            version: "0.6.1",
                            settings: {
                                optimizer: { enabled: true, runs: 200 },
                                outputSelection: default_config_1.defaultSolcOutputSelection,
                            },
                        },
                    },
                });
            });
        });
    });
    describe("Paths resolution", () => {
        it("Doesn't override paths.configFile", () => {
            const { paths } = config_resolution_1.resolveConfig(__filename, {
                paths: { configFile: "asd" },
            });
            chai_1.assert.equal(paths.configFile, __filename);
        });
        it("Should return absolute paths for Hardhat paths, and leave the others as is", () => {
            const { paths } = config_resolution_1.resolveConfig(__filename, {
                paths: { asd: "asd" },
            });
            Object.entries(paths)
                .filter(([name]) => name !== "asd")
                .forEach(([_, p]) => chai_1.assert.isTrue(path.isAbsolute(p)));
        });
        it("Should use absolute paths 'as is'", () => {
            const { paths } = config_resolution_1.resolveConfig(__filename, {
                paths: {
                    asd: "/asd",
                    root: "/root",
                    sources: "/c",
                    artifacts: "/a",
                    cache: "/ca",
                    tests: "/t",
                },
            });
            chai_1.assert.equal(paths.root, "/root");
            chai_1.assert.equal(paths.asd, "/asd");
            chai_1.assert.equal(paths.sources, "/c");
            chai_1.assert.equal(paths.artifacts, "/a");
            chai_1.assert.equal(paths.cache, "/ca");
            chai_1.assert.equal(paths.tests, "/t");
        });
        it("Should resolve the root relative to the configFile", () => {
            const { paths } = config_resolution_1.resolveConfig(__filename, {
                paths: {
                    root: "blah",
                },
            });
            chai_1.assert.equal(paths.root, path.join(__dirname, "blah"));
        });
        it("Should resolve the rest relative to the root, except unknown values, that are left as is", () => {
            const { paths } = config_resolution_1.resolveConfig(__filename, {
                paths: {
                    root: "blah",
                    asdf: { a: 123 },
                    sources: "c",
                    artifacts: "a",
                    cache: "ca",
                    tests: "t",
                },
            });
            const root = path.join(__dirname, "blah");
            chai_1.assert.equal(paths.root, root);
            chai_1.assert.equal(paths.sources, path.join(root, "c"));
            chai_1.assert.equal(paths.artifacts, path.join(root, "a"));
            chai_1.assert.equal(paths.cache, path.join(root, "ca"));
            chai_1.assert.equal(paths.tests, path.join(root, "t"));
            chai_1.assert.deepEqual(paths.asdf, { a: 123 });
        });
        it("Should have the right default values", () => {
            const { paths } = config_resolution_1.resolveConfig(__filename, {});
            chai_1.assert.equal(paths.root, __dirname);
            chai_1.assert.equal(paths.sources, path.join(__dirname, "contracts"));
            chai_1.assert.equal(paths.artifacts, path.join(__dirname, "artifacts"));
            chai_1.assert.equal(paths.cache, path.join(__dirname, "cache"));
            chai_1.assert.equal(paths.tests, path.join(__dirname, "test"));
        });
    });
    describe("Mocha config resolution", () => {
        it("Should set a default time and leave the rest as is", () => {
            const config = config_resolution_1.resolveConfig(__filename, { mocha: { bail: true } });
            chai_1.assert.equal(config.mocha.timeout, default_config_1.defaultMochaOptions.timeout);
            chai_1.assert.isTrue(config.mocha.bail);
        });
        it("Should let the user override the timeout", () => {
            const config = config_resolution_1.resolveConfig(__filename, { mocha: { timeout: 1 } });
            chai_1.assert.equal(config.mocha.timeout, 1);
        });
    });
    describe("Networks resolution", function () {
        describe("Hardhat network resolution", function () {
            it("Should always define the hardhat network", function () {
                const config = config_resolution_1.resolveConfig(__filename, {});
                chai_1.assert.isDefined(config.networks.hardhat);
                chai_1.assert.deepEqual(config.networks.hardhat, Object.assign({}, default_config_1.defaultHardhatNetworkParams));
            });
            it("Should normalize the accounts' private keys", function () {
                const config = config_resolution_1.resolveConfig(__filename, {
                    networks: {
                        hardhat: {
                            accounts: [
                                { privateKey: "  aa00 ", balance: "1" },
                                { privateKey: "  0XaA00 ", balance: "1" },
                            ],
                        },
                    },
                });
                const accounts = config.networks.hardhat
                    .accounts;
                const privateKeys = accounts.map((a) => a.privateKey);
                chai_1.assert.deepEqual(privateKeys, ["0xaa00", "0xaa00"]);
            });
            describe("Forking config", function () {
                it("Should enable it if there's an url and no enabled setting", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            hardhat: {
                                forking: {
                                    url: "asd",
                                },
                            },
                        },
                    });
                    chai_1.assert.deepEqual(config.networks.hardhat.forking, {
                        url: "asd",
                        enabled: true,
                    });
                });
                it("Should respect the enabled setting", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            hardhat: {
                                forking: {
                                    url: "asd",
                                    enabled: false,
                                },
                            },
                        },
                    });
                    chai_1.assert.deepEqual(config.networks.hardhat.forking, {
                        url: "asd",
                        enabled: false,
                    });
                });
                it("Should let you specify a blockNumber ", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            hardhat: {
                                forking: {
                                    url: "asd",
                                    blockNumber: 123,
                                },
                            },
                        },
                    });
                    chai_1.assert.deepEqual(config.networks.hardhat.forking, {
                        url: "asd",
                        enabled: true,
                        blockNumber: 123,
                    });
                });
            });
            describe("Accounts settings", function () {
                it("Should let you specify an array of accounts that's used as is", function () {
                    const accounts = [{ privateKey: "0x00000", balance: "123" }];
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            hardhat: {
                                accounts,
                            },
                        },
                    });
                    chai_1.assert.deepEqual(config.networks.hardhat.accounts, accounts);
                });
                it("Should accept an hd account with balance", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            hardhat: {
                                accounts: {
                                    mnemonic: "magnet season because hope bind episode labor ready potato glove result modify",
                                    path: "m/44'/60'/1'/1",
                                    accountsBalance: "12312",
                                    count: 1,
                                    initialIndex: 2,
                                },
                            },
                        },
                    });
                    chai_1.assert.deepEqual(config.networks.hardhat.accounts, {
                        mnemonic: "magnet season because hope bind episode labor ready potato glove result modify",
                        path: "m/44'/60'/1'/1",
                        accountsBalance: "12312",
                        count: 1,
                        initialIndex: 2,
                    });
                });
                it("Should use default values for hd accounts", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            hardhat: {
                                accounts: {
                                    mnemonic: "magnet season because hope bind episode labor ready potato glove result modify",
                                },
                            },
                        },
                    });
                    chai_1.assert.deepEqual(config.networks.hardhat.accounts, Object.assign(Object.assign({}, default_config_1.defaultHardhatNetworkHdAccountsConfigParams), { mnemonic: "magnet season because hope bind episode labor ready potato glove result modify" }));
                });
            });
            it("Should let you configure everything", function () {
                const networkConfig = {
                    accounts: [{ privateKey: "0x00000", balance: "123" }],
                    chainId: 123,
                    from: "from",
                    gas: 1,
                    gasMultiplier: 1231,
                    gasPrice: 2345678,
                    throwOnCallFailures: false,
                    throwOnTransactionFailures: false,
                    loggingEnabled: true,
                    allowUnlimitedContractSize: true,
                    blockGasLimit: 567,
                    hardfork: "hola",
                    initialDate: "today",
                };
                const config = config_resolution_1.resolveConfig(__filename, {
                    networks: { hardhat: networkConfig },
                });
                chai_1.assert.deepEqual(config.networks.hardhat, networkConfig);
            });
        });
        describe("HTTP networks resolution", function () {
            describe("Localhost network resolution", function () {
                it("always defines a localhost network with a default url", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {});
                    chai_1.assert.isDefined(config.networks.localhost);
                    chai_1.assert.deepEqual(config.networks.localhost, Object.assign(Object.assign({}, default_config_1.defaultLocalhostNetworkParams), default_config_1.defaultHttpNetworkParams));
                });
                it("let's you override its url and other things", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: { localhost: { url: "asd", timeout: 1 } },
                    });
                    chai_1.assert.isDefined(config.networks.localhost);
                    chai_1.assert.deepEqual(config.networks.localhost, Object.assign(Object.assign({}, default_config_1.defaultHttpNetworkParams), { url: "asd", timeout: 1 }));
                });
            });
            describe("Other networks", function () {
                it("Should let you define other networks", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: { other: { url: "asd" } },
                    });
                    chai_1.assert.deepEqual(config.networks.other, Object.assign(Object.assign({}, default_config_1.defaultHttpNetworkParams), { url: "asd" }));
                });
                it("Should normalize the accounts' private keys", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: {
                            other: {
                                url: "asd",
                                accounts: ["  aa00 ", "  0XaA00 "],
                            },
                        },
                    });
                    const privateKeys = config.networks.other.accounts;
                    chai_1.assert.deepEqual(privateKeys, ["0xaa00", "0xaa00"]);
                });
                it("Should let you override everything", function () {
                    const otherNetworkConfig = {
                        url: "asd",
                        timeout: 1,
                        accounts: ["0x00000"],
                        chainId: 123,
                        from: "from",
                        gas: 1,
                        gasMultiplier: 1231,
                        gasPrice: 2345678,
                        httpHeaders: {
                            header: "asd",
                        },
                    };
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: { other: otherNetworkConfig },
                    });
                    chai_1.assert.deepEqual(config.networks.other, otherNetworkConfig);
                });
                it("Should add default values to HD accounts config objects", function () {
                    const config = config_resolution_1.resolveConfig(__filename, {
                        networks: { other: { url: "a", accounts: { mnemonic: "mmmmm" } } },
                    });
                    const httpNetConfig = config.networks.other;
                    const accounts = httpNetConfig.accounts;
                    chai_1.assert.deepEqual(accounts, Object.assign({ mnemonic: "mmmmm" }, default_config_1.defaultHdAccountsConfigParams));
                });
            });
        });
    });
});
//# sourceMappingURL=config-resolution.js.map