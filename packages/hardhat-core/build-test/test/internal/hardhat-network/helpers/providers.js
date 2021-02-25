"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORKED_PROVIDERS = exports.PROVIDERS = exports.DEFAULT_ACCOUNTS_BALANCES = exports.DEFAULT_ACCOUNTS_ADDRESSES = exports.DEFAULT_ACCOUNTS = exports.DEFAULT_ALLOW_UNLIMITED_CONTRACT_SIZE = exports.DEFAULT_USE_JSON_RPC = exports.DEFAULT_BLOCK_GAS_LIMIT = exports.DEFAULT_NETWORK_ID = exports.DEFAULT_CHAIN_ID = exports.DEFAULT_NETWORK_NAME = exports.DEFAULT_HARDFORK = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
const setup_1 = require("../../../setup");
const useProvider_1 = require("./useProvider");
exports.DEFAULT_HARDFORK = "istanbul";
exports.DEFAULT_NETWORK_NAME = "TestNet";
exports.DEFAULT_CHAIN_ID = 123;
exports.DEFAULT_NETWORK_ID = 234;
exports.DEFAULT_BLOCK_GAS_LIMIT = 6000000;
exports.DEFAULT_USE_JSON_RPC = false;
exports.DEFAULT_ALLOW_UNLIMITED_CONTRACT_SIZE = false;
// Assumptions:
// - First account has sent some transactions on mainnet
// - Second and third accounts have a 0 nonce
exports.DEFAULT_ACCOUNTS = [
    {
        privateKey: "0xe331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109",
        balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
    },
    {
        privateKey: "0xe331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd10a",
        balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
    },
    {
        privateKey: "0xe331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd10b",
        balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
    },
];
exports.DEFAULT_ACCOUNTS_ADDRESSES = exports.DEFAULT_ACCOUNTS.map((account) => ethereumjs_util_1.bufferToHex(ethereumjs_util_1.privateToAddress(ethereumjs_util_1.toBuffer(account.privateKey))).toLowerCase());
exports.DEFAULT_ACCOUNTS_BALANCES = exports.DEFAULT_ACCOUNTS.map((account) => account.balance);
exports.PROVIDERS = [
    {
        name: "Hardhat Network",
        isFork: false,
        networkId: exports.DEFAULT_NETWORK_ID,
        chainId: exports.DEFAULT_CHAIN_ID,
        useProvider: () => {
            useProvider_1.useProvider(false);
        },
    },
    {
        name: "JSON-RPC",
        isFork: false,
        networkId: exports.DEFAULT_NETWORK_ID,
        chainId: exports.DEFAULT_CHAIN_ID,
        useProvider: () => {
            useProvider_1.useProvider(true);
        },
    },
];
exports.FORKED_PROVIDERS = [];
if (setup_1.ALCHEMY_URL !== undefined && setup_1.ALCHEMY_URL !== "") {
    const url = setup_1.ALCHEMY_URL;
    exports.PROVIDERS.push({
        name: "Alchemy Forked",
        isFork: true,
        networkId: exports.DEFAULT_NETWORK_ID,
        chainId: exports.DEFAULT_CHAIN_ID,
        useProvider: () => {
            useProvider_1.useProvider(false, { jsonRpcUrl: url });
        },
    });
    exports.FORKED_PROVIDERS.push({
        rpcProvider: "Alchemy",
        jsonRpcUrl: url,
        useProvider: () => {
            useProvider_1.useProvider(false, { jsonRpcUrl: url });
        },
    });
}
if (setup_1.INFURA_URL !== undefined && setup_1.INFURA_URL !== "") {
    const url = setup_1.INFURA_URL;
    exports.FORKED_PROVIDERS.push({
        rpcProvider: "Infura",
        jsonRpcUrl: url,
        useProvider: () => {
            useProvider_1.useProvider(false, { jsonRpcUrl: url });
        },
    });
}
//# sourceMappingURL=providers.js.map