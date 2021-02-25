"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_common_1 = __importDefault(require("ethereumjs-common"));
const default_config_1 = require("../../../../src/internal/core/config/default-config");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const backwards_compatibility_1 = require("../../../../src/internal/core/providers/backwards-compatibility");
const construction_1 = require("../../../../src/internal/core/providers/construction");
const gas_providers_1 = require("../../../../src/internal/core/providers/gas-providers");
const provider_utils_1 = require("../../../../src/internal/core/providers/provider-utils");
const errors_1 = require("../../../helpers/errors");
const mocks_1 = require("./mocks");
describe("Network config typeguards", async () => {
    it("Should recognize HDAccountsConfig", () => {
        chai_1.assert.isTrue(construction_1.isHDAccountsConfig({ mnemonic: "asdads" }));
        chai_1.assert.isFalse(construction_1.isHDAccountsConfig({ initialIndex: 1 }));
        chai_1.assert.isFalse(construction_1.isHDAccountsConfig(undefined));
    });
});
describe("Base provider creation", () => {
    it("Should create a valid HTTP provider and wrap it", () => {
        const provider = construction_1.createProvider("net", Object.assign({ url: "http://localhost:8545" }, default_config_1.defaultHttpNetworkParams));
        chai_1.assert.instanceOf(provider, backwards_compatibility_1.BackwardsCompatibilityProviderAdapter);
    });
});
describe("Base providers wrapping", () => {
    let mockedProvider;
    const CHAIN_ID = 1337;
    beforeEach(() => {
        mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("web3_clientVersion", "Not ganache");
        mockedProvider.setReturnValue("net_version", `${CHAIN_ID}`);
        mockedProvider.setReturnValue("eth_getBlockByNumber", {
            gasLimit: provider_utils_1.numberToRpcQuantity(8000000),
        });
        mockedProvider.setReturnValue("eth_accounts", [
            "0x04397ae3f38106cebdf03f963074ecfc23d509d9",
        ]);
    });
    describe("Accounts wrapping", () => {
        it("Should wrap with a list of private keys as accounts", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                accounts: [
                    "0x5ca14ebaee5e4a48b5341d9225f856115be72df55c7621b73fb0b6a1fdefcf24",
                    "0x4e24948ea2bbd95ccd2bac641aadf36acd7e7cc011b1186a83dfe8db6cc7b1ae",
                    "0x6dca0836dc90c159b9240aeff471441a134e1b215a7ffe9d69d335f325932665",
                ],
                url: "",
            });
            const accounts = await provider.request({ method: "eth_accounts" });
            chai_1.assert.deepEqual(accounts, [
                "0x04397ae3f38106cebdf03f963074ecfc23d509d9",
                "0xa2b6816c50d49101901d93f5302a3a57e0a1281b",
                "0x56b33dc9bd2d34aa087b982f4e307145156f5f9f",
            ]);
        });
        it("Should wrap with an HD wallet provider", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                accounts: {
                    mnemonic: "hurdle method ceiling design federal record unfair cloud end midnight corn oval",
                    initialIndex: 3,
                    count: 2,
                    path: default_config_1.defaultHdAccountsConfigParams.path,
                },
                url: "",
            });
            const accounts = await provider.request({ method: "eth_accounts" });
            chai_1.assert.deepEqual(accounts, [
                "0xd26a6f43b0df5c539778e08feec29908ea83a1c1",
                "0x70afc7acf880e0d233e8ebedadbdaf68984ff510",
            ]);
        });
        it("Shouldn't wrap with an accounts-managing provider if not necessary", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
            });
            await provider.request({
                method: "eth_accounts",
                params: ["param1", "param2"],
            });
            const params = mockedProvider.getLatestParams("eth_accounts");
            chai_1.assert.deepEqual(params, ["param1", "param2"]);
        });
    });
    describe("Sender wrapping", () => {
        let common;
        beforeEach(async () => {
            mockedProvider.setReturnValue("eth_estimateGas", provider_utils_1.numberToRpcQuantity(123));
            common = ethereumjs_common_1.default.forCustomChain("mainnet", {
                chainId: CHAIN_ID,
                networkId: CHAIN_ID,
            }, "petersburg");
        });
        it("Should wrap with a fixed sender param", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                from: "0xa2b6816c50d49101901d93f5302a3a57e0a1281b",
            });
            await provider.request({ method: "eth_sendTransaction", params: [{}] });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.from, "0xa2b6816c50d49101901d93f5302a3a57e0a1281b");
        });
        it("Should wrap without a fixed sender param, using the default one", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
            });
            await provider.request({ method: "eth_sendTransaction", params: [{}] });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.from, "0x04397ae3f38106cebdf03f963074ecfc23d509d9");
        });
    });
    describe("Gas wrapping", () => {
        const OTHER_GAS_MULTIPLIER = 1.337;
        beforeEach(() => {
            mockedProvider.setReturnValue("eth_estimateGas", provider_utils_1.numberToRpcQuantity(123));
            mockedProvider.setReturnValue("eth_gasPrice", provider_utils_1.numberToRpcQuantity(123));
        });
        it("Should wrap with an auto gas provider if 'auto' is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                gas: "auto",
            });
            await provider.request({
                method: "eth_sendTransaction",
                params: [{ from: "0x0" }],
            });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.gas, provider_utils_1.numberToRpcQuantity(123));
        });
        it("Should wrap with an auto gas provider if undefined is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
            });
            await provider.request({
                method: "eth_sendTransaction",
                params: [{ from: "0x0" }],
            });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.gas, provider_utils_1.numberToRpcQuantity(123));
        });
        it("Should use the gasMultiplier", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                gasMultiplier: OTHER_GAS_MULTIPLIER,
            });
            await provider.request({
                method: "eth_sendTransaction",
                params: [{ from: "0x0" }],
            });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.gas, provider_utils_1.numberToRpcQuantity(Math.floor(123 * OTHER_GAS_MULTIPLIER)));
        });
        it("Should wrap with a fixed gas provider if a number is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                gas: 678,
            });
            await provider.request({
                method: "eth_sendTransaction",
                params: [{ from: "0x0" }],
            });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.gas, provider_utils_1.numberToRpcQuantity(678));
        });
    });
    describe("Gas price wrapping", () => {
        beforeEach(() => {
            mockedProvider.setReturnValue("eth_gasPrice", provider_utils_1.numberToRpcQuantity(123));
        });
        it("Should wrap with an auto gas price provider if 'auto' is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                gasPrice: "auto",
            });
            const gasPrice = await provider.request({ method: "eth_gasPrice" });
            chai_1.assert.equal(gasPrice, provider_utils_1.numberToRpcQuantity(123));
        });
        it("Should wrap with an auto gas price provider if undefined is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
            });
            const gasPrice = await provider.request({ method: "eth_gasPrice" });
            chai_1.assert.equal(gasPrice, provider_utils_1.numberToRpcQuantity(123));
        });
        it("Should wrap with a fixed gas price provider if a number is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                gasPrice: 789,
            });
            await provider.request({ method: "eth_sendTransaction", params: [{}] });
            const [{ gasPrice }] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(gasPrice, provider_utils_1.numberToRpcQuantity(789));
        });
    });
    describe("Chain ID wrapping", () => {
        it("Should wrap with a chain id validation provider if a chainId is used", async () => {
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
                chainId: 2,
            });
            await errors_1.expectHardhatErrorAsync(() => provider.request({ method: "eth_getAccounts", params: [] }), errors_list_1.ERRORS.NETWORK.INVALID_GLOBAL_CHAIN_ID);
        });
    });
    describe("Ganache multiplier provider", () => {
        it("Should wrap with a ganache multiplier provider", async () => {
            mockedProvider.setReturnValue("eth_estimateGas", provider_utils_1.numberToRpcQuantity(123));
            mockedProvider.setReturnValue("web3_clientVersion", "EthereumJS TestRPC/v2.5.5/ethereum-js");
            const provider = construction_1.applyProviderWrappers(mockedProvider, {
                url: "",
            });
            const estimation = (await provider.request({
                method: "eth_estimateGas",
                params: [
                    { to: "0xa2b6816c50d49101901d93f5302a3a57e0a1281b", value: 1 },
                ],
            }));
            const gas = provider_utils_1.rpcQuantityToNumber(estimation);
            chai_1.assert.equal(gas, Math.floor(123 * gas_providers_1.GANACHE_GAS_MULTIPLIER));
        });
    });
});
//# sourceMappingURL=construction.js.map