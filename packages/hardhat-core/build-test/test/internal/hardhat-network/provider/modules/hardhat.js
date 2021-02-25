"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const setup_1 = require("../../../../setup");
const assertions_1 = require("../../helpers/assertions");
const constants_1 = require("../../helpers/constants");
const conversions_1 = require("../../helpers/conversions");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
describe("Hardhat module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        describe(`${name} provider`, function () {
            cwd_1.setCWD();
            useProvider();
            describe("hardhat_impersonateAccount", function () {
                it("validates input parameter", async function () {
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_impersonateAccount", ["0x1234"]);
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_impersonateAccount", ["1234567890abcdef1234567890abcdef12345678"]);
                });
                it("returns true", async function () {
                    const result = await this.provider.send("hardhat_impersonateAccount", [ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS)]);
                    chai_1.assert.isTrue(result);
                });
            });
            describe("hardhat_stopImpersonatingAccount", function () {
                it("validates input parameter", async function () {
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_stopImpersonatingAccount", ["0x1234"]);
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_stopImpersonatingAccount", ["1234567890abcdef1234567890abcdef12345678"]);
                });
                it("returns true if the account was impersonated before", async function () {
                    await this.provider.send("hardhat_impersonateAccount", [
                        ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                    ]);
                    const result = await this.provider.send("hardhat_stopImpersonatingAccount", [ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS)]);
                    chai_1.assert.isTrue(result);
                });
                it("returns false if the account wasn't impersonated before", async function () {
                    const result = await this.provider.send("hardhat_stopImpersonatingAccount", [ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS)]);
                    chai_1.assert.isFalse(result);
                });
            });
            describe("hardhat_reset", function () {
                before(function () {
                    if (setup_1.ALCHEMY_URL === undefined || setup_1.ALCHEMY_URL === "") {
                        this.skip();
                    }
                });
                it("validates input parameters", async function () {
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_reset", [
                        { forking: {} },
                    ]);
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: 123,
                            },
                        },
                    ]);
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_reset", [
                        {
                            forking: {
                                blockNumber: 0,
                            },
                        },
                    ]);
                    await assertions_1.assertInvalidArgumentsError(this.provider, "hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: setup_1.ALCHEMY_URL,
                                blockNumber: "0",
                            },
                        },
                    ]);
                });
                it("returns true", async function () {
                    const result = await this.provider.send("hardhat_reset", [
                        { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL, blockNumber: 123 } },
                    ]);
                    chai_1.assert.isTrue(result);
                });
                if (isFork) {
                    testForkedProviderBehaviour();
                }
                else {
                    testNormalProviderBehaviour();
                }
                const getLatestBlockNumber = async () => {
                    return conversions_1.quantityToNumber(await this.ctx.provider.send("eth_blockNumber"));
                };
                function testForkedProviderBehaviour() {
                    it("can reset the forked provider to a given forkBlockNumber", async function () {
                        await this.provider.send("hardhat_reset", [
                            { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL, blockNumber: 123 } },
                        ]);
                        chai_1.assert.equal(await getLatestBlockNumber(), 123);
                    });
                    it("can reset the forked provider to the latest block number", async function () {
                        const initialBlock = await getLatestBlockNumber();
                        await this.provider.send("hardhat_reset", [
                            { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL, blockNumber: 123 } },
                        ]);
                        await this.provider.send("hardhat_reset", [
                            { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL } },
                        ]);
                        // This condition is rather loose as Infura can sometimes return
                        // a smaller block number on subsequent eth_blockNumber call
                        chai_1.assert.closeTo(await getLatestBlockNumber(), initialBlock, 4);
                    });
                    it("can reset the forked provider to a normal provider", async function () {
                        await this.provider.send("hardhat_reset", []);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                        await this.provider.send("hardhat_reset", [{}]);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                    });
                }
                function testNormalProviderBehaviour() {
                    it("can reset the provider to initial state", async function () {
                        await this.provider.send("evm_mine");
                        chai_1.assert.equal(await getLatestBlockNumber(), 1);
                        await this.provider.send("hardhat_reset", []);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                    });
                    it("can reset the provider with a fork config", async function () {
                        await this.provider.send("hardhat_reset", [
                            { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL, blockNumber: 123 } },
                        ]);
                        chai_1.assert.equal(await getLatestBlockNumber(), 123);
                    });
                    it("can reset the provider with fork config back to normal config", async function () {
                        await this.provider.send("hardhat_reset", [
                            { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL, blockNumber: 123 } },
                        ]);
                        await this.provider.send("hardhat_reset", []);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                    });
                }
            });
        });
    });
});
//# sourceMappingURL=hardhat.js.map