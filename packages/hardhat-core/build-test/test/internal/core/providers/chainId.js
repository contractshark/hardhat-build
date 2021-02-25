"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const chainId_1 = require("../../../../src/internal/core/providers/chainId");
const provider_utils_1 = require("../../../../src/internal/core/providers/provider-utils");
const errors_1 = require("../../../helpers/errors");
const mocks_1 = require("./mocks");
describe("ChainIdValidatorProvider", () => {
    it("should fail when configured chain id dont match the real chain id", async () => {
        const mock = new mocks_1.MockedProvider();
        mock.setReturnValue("eth_chainId", "0xabcabc");
        const wrapper = new chainId_1.ChainIdValidatorProvider(mock, 66666);
        await errors_1.expectHardhatErrorAsync(() => wrapper.request({ method: "eth_getAccounts", params: [] }), errors_list_1.ERRORS.NETWORK.INVALID_GLOBAL_CHAIN_ID);
    });
});
class TestProvider extends chainId_1.ProviderWrapperWithChainId {
    async request(args) {
        return this._wrappedProvider.request(args);
    }
    async getChainId() {
        return this._getChainId();
    }
}
describe("ProviderWrapperWithChainId", function () {
    it("Should call the provider only once", async function () {
        const mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_chainId", provider_utils_1.numberToRpcQuantity(1));
        mockedProvider.setReturnValue("net_version", "2");
        const testProvider = new TestProvider(mockedProvider);
        chai_1.assert.equal(mockedProvider.getTotalNumberOfCalls(), 0);
        await testProvider.getChainId();
        chai_1.assert.equal(mockedProvider.getTotalNumberOfCalls(), 1);
        await testProvider.getChainId();
        chai_1.assert.equal(mockedProvider.getTotalNumberOfCalls(), 1);
        await testProvider.getChainId();
        chai_1.assert.equal(mockedProvider.getTotalNumberOfCalls(), 1);
        const mockedProvider2 = new mocks_1.MockedProvider();
        mockedProvider2.setReturnValue("net_version", "2");
        const testProvider2 = new TestProvider(mockedProvider2);
        chai_1.assert.equal(mockedProvider2.getTotalNumberOfCalls(), 0);
        await testProvider2.getChainId();
        // First eth_chainId is called, then net_version, hence 2
        chai_1.assert.equal(mockedProvider2.getTotalNumberOfCalls(), 2);
        await testProvider2.getChainId();
        chai_1.assert.equal(mockedProvider2.getTotalNumberOfCalls(), 2);
        await testProvider2.getChainId();
        chai_1.assert.equal(mockedProvider2.getTotalNumberOfCalls(), 2);
    });
    it("Should use eth_chainId if supported", async function () {
        const mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_chainId", provider_utils_1.numberToRpcQuantity(1));
        mockedProvider.setReturnValue("net_version", "2");
        const testProvider = new TestProvider(mockedProvider);
        chai_1.assert.equal(await testProvider.getChainId(), 1);
    });
    it("Should use net_version if eth_chainId is not supported", async function () {
        const mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("net_version", "2");
        const testProvider = new TestProvider(mockedProvider);
        chai_1.assert.equal(await testProvider.getChainId(), 2);
    });
    it("Should throw if both eth_chainId and net_version fail", async function () {
        const mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_chainId", () => {
            throw new Error("Unsupported method");
        });
        mockedProvider.setReturnValue("net_version", () => {
            throw new Error("Unsupported method");
        });
        const testProvider = new TestProvider(mockedProvider);
        try {
            await testProvider.getChainId();
        }
        catch (error) {
            return;
        }
        chai_1.assert.fail("Expected exception not thrown");
    });
});
//# sourceMappingURL=chainId.js.map