"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
// tslint:disable-next-line:no-implicit-dependencies
const ethers_1 = require("ethers");
const fs_extra_1 = __importDefault(require("fs-extra"));
const provider_utils_1 = require("../../../../src/internal/core/providers/provider-utils");
const errors_1 = require("../../../../src/internal/hardhat-network/provider/errors");
const output_1 = require("../../../../src/internal/hardhat-network/provider/output");
const setup_1 = require("../../../setup");
const assertions_1 = require("../helpers/assertions");
const constants_1 = require("../helpers/constants");
const contracts_1 = require("../helpers/contracts");
const conversions_1 = require("../helpers/conversions");
const cwd_1 = require("../helpers/cwd");
const ethers_provider_wrapper_1 = require("../helpers/ethers-provider-wrapper");
const hexStripZeros_1 = require("../helpers/hexStripZeros");
const leftPad32_1 = require("../helpers/leftPad32");
const providers_1 = require("../helpers/providers");
const retrieveForkBlockNumber_1 = require("../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../helpers/transactions");
const ERC20Abi = fs_extra_1.default.readJsonSync(`${__dirname}/../abi/ERC20/ERC20.json`);
const UniswapExchangeAbi = fs_extra_1.default.readJsonSync(`${__dirname}/../abi/Uniswap/Exchange.json`);
const UniswapFactoryAbi = fs_extra_1.default.readJsonSync(`${__dirname}/../abi/Uniswap/Factory.json`);
const WETH_DEPOSIT_SELECTOR = "0xd0e30db0";
describe("Forked provider", () => {
    providers_1.FORKED_PROVIDERS.forEach(({ rpcProvider, useProvider }) => {
        describe(`Using ${rpcProvider}`, function () {
            cwd_1.setCWD();
            useProvider();
            const getForkBlockNumber = async () => retrieveForkBlockNumber_1.retrieveForkBlockNumber(this.ctx.hardhatNetworkProvider);
            describe("eth_blockNumber", () => {
                it("returns the current block number", async function () {
                    const blockNumber = await this.provider.send("eth_blockNumber");
                    const minBlockNumber = 10494745; // mainnet block number at 20.07.2020
                    chai_1.assert.isAtLeast(conversions_1.quantityToNumber(blockNumber), minBlockNumber);
                });
            });
            describe("eth_call", function () {
                it("can get DAI total supply", async function () {
                    const daiTotalSupplySelector = "0x18160ddd";
                    const result = await this.provider.send("eth_call", [
                        { to: ethereumjs_util_1.bufferToHex(constants_1.DAI_ADDRESS), data: daiTotalSupplySelector },
                    ]);
                    const bnResult = new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(result));
                    chai_1.assert.isTrue(bnResult.gtn(0));
                });
                describe("when used in the context of a past block", () => {
                    describe("when the block number is greater than the fork block number", () => {
                        it("does not affect previously added data", async function () {
                            const forkBlockNumber = await getForkBlockNumber();
                            const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                            const firstState = leftPad32_1.leftPad32("0xdeadbeef");
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    to: contractAddress,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + firstState,
                                },
                            ]);
                            const temporaryState = leftPad32_1.leftPad32("0xfeedface");
                            await this.provider.send("eth_call", [
                                {
                                    to: contractAddress,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + temporaryState,
                                },
                                output_1.numberToRpcQuantity(forkBlockNumber + 1),
                            ]);
                            chai_1.assert.equal(await this.provider.send("eth_call", [
                                {
                                    to: contractAddress,
                                    data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                },
                                "latest",
                            ]), `0x${firstState}`);
                        });
                    });
                    describe("when the block number is less or equal to the fork block number", () => {
                        it("does not affect previously added storage data", async function () {
                            const forkBlockNumber = await getForkBlockNumber();
                            await this.provider.send("hardhat_impersonateAccount", [
                                ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                            ]);
                            const getWrappedBalance = async () => {
                                const balanceOfSelector = `0x70a08231${leftPad32_1.leftPad32(constants_1.BITFINEX_WALLET_ADDRESS)}`;
                                return conversions_1.dataToBN(await this.provider.send("eth_call", [
                                    { to: ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS), data: balanceOfSelector },
                                ])).toString();
                            };
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    from: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                                    to: ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS),
                                    data: WETH_DEPOSIT_SELECTOR,
                                    value: output_1.numberToRpcQuantity(123),
                                    gas: output_1.numberToRpcQuantity(50000),
                                    gasPrice: output_1.numberToRpcQuantity(1),
                                },
                            ]);
                            const balance = await getWrappedBalance();
                            await this.provider.send("eth_call", [
                                {
                                    from: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                                    to: ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS),
                                    data: WETH_DEPOSIT_SELECTOR,
                                    value: output_1.numberToRpcQuantity(321),
                                },
                                output_1.numberToRpcQuantity(forkBlockNumber - 3),
                            ]);
                            chai_1.assert.equal(await getWrappedBalance(), balance);
                        });
                        it("does not affect previously added balance data", async function () {
                            const forkBlockNumber = await getForkBlockNumber();
                            await this.provider.send("hardhat_impersonateAccount", [
                                ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                            ]);
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    from: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                                    to: ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                                    value: output_1.numberToRpcQuantity(123),
                                    gas: output_1.numberToRpcQuantity(21000),
                                    gasPrice: output_1.numberToRpcQuantity(1),
                                },
                            ]);
                            await this.provider.send("eth_call", [
                                {
                                    from: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                                    to: ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                                    value: output_1.numberToRpcQuantity(321),
                                },
                                output_1.numberToRpcQuantity(forkBlockNumber - 1),
                            ]);
                            const balance = await this.provider.send("eth_getBalance", [
                                ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                            ]);
                            chai_1.assert.equal(conversions_1.quantityToNumber(balance), 123);
                        });
                    });
                });
            });
            describe("eth_getBalance", function () {
                it("can get the balance of the WETH contract", async function () {
                    const result = await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS),
                    ]);
                    chai_1.assert.isTrue(conversions_1.quantityToBN(result).gtn(0));
                });
            });
            describe("eth_sendTransaction", () => {
                it("supports Ether transfers to remote accounts", async function () {
                    const result = await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                    ]);
                    const initialBalance = conversions_1.quantityToBN(result);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                            value: output_1.numberToRpcQuantity(100),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    const balance = await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                    ]);
                    assertions_1.assertQuantity(balance, initialBalance.addn(100));
                });
                it("supports wrapping of Ether", async function () {
                    const wethBalanceOfSelector = `0x70a08231${leftPad32_1.leftPad32(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0])}`;
                    const getWrappedBalance = async () => conversions_1.dataToBN(await this.provider.send("eth_call", [
                        { to: ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS), data: wethBalanceOfSelector },
                    ]));
                    const initialBalance = await getWrappedBalance();
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS),
                            data: WETH_DEPOSIT_SELECTOR,
                            value: output_1.numberToRpcQuantity(100),
                            gas: output_1.numberToRpcQuantity(50000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    const balance = await getWrappedBalance();
                    chai_1.assert.equal(balance.toString("hex"), initialBalance.addn(100).toString("hex"));
                });
            });
            describe("eth_getTransactionByHash", () => {
                it("supports local transactions", async function () {
                    const transactionHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    const transaction = await this.provider.send("eth_getTransactionByHash", [transactionHash]);
                    chai_1.assert.equal(transaction.from, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    chai_1.assert.equal(transaction.to, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    chai_1.assert.equal(transaction.value, output_1.numberToRpcQuantity(1));
                    chai_1.assert.equal(transaction.gas, output_1.numberToRpcQuantity(21000));
                    chai_1.assert.equal(transaction.gasPrice, output_1.numberToRpcQuantity(1));
                });
                it("supports remote transactions", async function () {
                    const transaction = await this.provider.send("eth_getTransactionByHash", [ethereumjs_util_1.bufferToHex(constants_1.FIRST_TX_HASH_OF_10496585)]);
                    chai_1.assert.equal(transaction.from, "0x4e87582f5e48f3e505b7d3b544972399ad9f2e5f");
                    chai_1.assert.equal(transaction.to, "0xdac17f958d2ee523a2206206994597c13d831ec7");
                });
            });
            describe("eth_getTransactionCount", () => {
                it("should have a non-zero nonce for the first unlocked account", async function () {
                    // this test works because the first unlocked accounts used by these
                    // tests happen to have transactions in mainnet
                    const [account] = await this.provider.send("eth_accounts");
                    const transactionCount = await this.provider.send("eth_getTransactionCount", [account]);
                    chai_1.assert.isTrue(conversions_1.quantityToBN(transactionCount).gtn(0));
                });
            });
            describe("eth_getTransactionReceipt", () => {
                it("supports local transactions", async function () {
                    const transactionHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [transactionHash]);
                    chai_1.assert.equal(receipt.from, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    chai_1.assert.equal(receipt.to, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    chai_1.assert.equal(receipt.gasUsed, output_1.numberToRpcQuantity(21000));
                });
                it("supports remote transactions", async function () {
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [ethereumjs_util_1.bufferToHex(constants_1.FIRST_TX_HASH_OF_10496585)]);
                    chai_1.assert.equal(receipt.from, "0x4e87582f5e48f3e505b7d3b544972399ad9f2e5f");
                    chai_1.assert.equal(receipt.to, "0xdac17f958d2ee523a2206206994597c13d831ec7");
                });
            });
            describe("eth_getLogs", () => {
                it("can get remote logs", async function () {
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: output_1.numberToRpcQuantity(constants_1.BLOCK_NUMBER_OF_10496585),
                            toBlock: output_1.numberToRpcQuantity(constants_1.BLOCK_NUMBER_OF_10496585),
                        },
                    ]);
                    chai_1.assert.equal(logs.length, 205);
                });
            });
            describe("evm_revert", () => {
                it("can revert the state of WETH contract to a previous snapshot", async function () {
                    const getWethBalance = async () => this.provider.send("eth_getBalance", [ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS)]);
                    const initialBalance = await getWethBalance();
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: ethereumjs_util_1.bufferToHex(constants_1.WETH_ADDRESS),
                            data: WETH_DEPOSIT_SELECTOR,
                            value: output_1.numberToRpcQuantity(100),
                            gas: output_1.numberToRpcQuantity(50000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    chai_1.assert.notEqual(await getWethBalance(), initialBalance);
                    const reverted = await this.provider.send("evm_revert", [snapshotId]);
                    chai_1.assert.isTrue(reverted);
                    chai_1.assert.equal(await getWethBalance(), initialBalance);
                });
            });
            describe("hardhat_impersonateAccount", () => {
                const oneEtherQuantity = output_1.numberToRpcQuantity(new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)));
                it("allows to impersonate a remote EOA", async function () {
                    await this.provider.send("hardhat_impersonateAccount", [
                        ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                            to: ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                            value: oneEtherQuantity,
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    const balance = await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                    ]);
                    chai_1.assert.equal(balance, oneEtherQuantity);
                });
                it("allows to impersonate a remote contract account", async function () {
                    // Get Uniswap DAI exchange address
                    const getExchangeSelector = `0x06f2bf62${leftPad32_1.leftPad32(constants_1.DAI_ADDRESS)}`;
                    const result = await this.provider.send("eth_call", [
                        {
                            to: ethereumjs_util_1.bufferToHex(constants_1.UNISWAP_FACTORY_ADDRESS),
                            data: getExchangeSelector,
                        },
                    ]);
                    const daiExchangeAddress = hexStripZeros_1.hexStripZeros(result);
                    // Impersonate the DAI exchange contract
                    await this.provider.send("hardhat_impersonateAccount", [
                        daiExchangeAddress,
                    ]);
                    // Transfer 10^18 DAI from the exchange contract to the EMPTY_ACCOUNT_ADDRESS
                    const transferRawData = `0xa9059cbb${leftPad32_1.leftPad32(constants_1.EMPTY_ACCOUNT_ADDRESS)}${leftPad32_1.leftPad32(oneEtherQuantity)}`;
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: daiExchangeAddress,
                            to: ethereumjs_util_1.bufferToHex(constants_1.DAI_ADDRESS),
                            gas: output_1.numberToRpcQuantity(200000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                            data: transferRawData,
                        },
                    ]);
                    // Check DAI balance of EMPTY_ACCOUNT_ADDRESS
                    const balanceOfSelector = `0x70a08231${leftPad32_1.leftPad32(constants_1.EMPTY_ACCOUNT_ADDRESS)}`;
                    const daiBalance = await this.provider.send("eth_call", [
                        { to: ethereumjs_util_1.bufferToHex(constants_1.DAI_ADDRESS), data: balanceOfSelector },
                    ]);
                    chai_1.assert.equal(hexStripZeros_1.hexStripZeros(daiBalance), oneEtherQuantity);
                });
            });
            describe("hardhat_stopImpersonatingAccount", () => {
                it("disables account impersonating", async function () {
                    await this.provider.send("hardhat_impersonateAccount", [
                        ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                    ]);
                    await this.provider.send("hardhat_stopImpersonatingAccount", [
                        ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                    ]);
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: ethereumjs_util_1.bufferToHex(constants_1.BITFINEX_WALLET_ADDRESS),
                        to: ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                        value: output_1.numberToRpcQuantity(100),
                        gas: output_1.numberToRpcQuantity(21000),
                        gasPrice: output_1.numberToRpcQuantity(1),
                    }, "unknown account", errors_1.InvalidInputError.CODE);
                });
            });
            describe("Tests on remote contracts", () => {
                describe("Uniswap", () => {
                    let wallet;
                    let factory;
                    let daiExchange;
                    let dai;
                    beforeEach(async function () {
                        const ethersProvider = new ethers_provider_wrapper_1.EthersProviderWrapper(this.provider);
                        wallet = new ethers_1.Wallet(providers_1.DEFAULT_ACCOUNTS[0].privateKey, ethersProvider);
                        factory = new ethers_1.Contract(ethereumjs_util_1.bufferToHex(constants_1.UNISWAP_FACTORY_ADDRESS), UniswapFactoryAbi, ethersProvider);
                        const daiExchangeAddress = await factory.getExchange(ethereumjs_util_1.bufferToHex(constants_1.DAI_ADDRESS));
                        daiExchange = new ethers_1.Contract(daiExchangeAddress, UniswapExchangeAbi, wallet);
                        dai = new ethers_1.Contract(ethereumjs_util_1.bufferToHex(constants_1.DAI_ADDRESS), ERC20Abi, ethersProvider);
                    });
                    it("can buy DAI for Ether", async function () {
                        const ethBefore = await wallet.getBalance();
                        const daiBefore = await dai.balanceOf(wallet.address);
                        chai_1.assert.equal(daiBefore.toNumber(), 0);
                        const expectedDai = await daiExchange.getEthToTokenInputPrice(ethers_1.utils.parseEther("0.5"));
                        chai_1.assert.isTrue(expectedDai.gt(0));
                        await daiExchange.ethToTokenSwapInput(1, // min amount of token retrieved
                        2525644800, // random timestamp in the future (year 2050)
                        {
                            gasLimit: 4000000,
                            value: ethers_1.utils.parseEther("0.5"),
                        });
                        const ethAfter = await wallet.getBalance();
                        const daiAfter = await dai.balanceOf(wallet.address);
                        const ethLost = parseFloat(ethers_1.utils.formatUnits(ethBefore.sub(ethAfter), "ether"));
                        chai_1.assert.equal(daiAfter.toString(), expectedDai.toString());
                        chai_1.assert.closeTo(ethLost, 0.5, 0.001);
                    });
                });
            });
            describe("blocks timestamps", () => {
                it("should use a timestamp relative to the forked block timestamp", async function () {
                    if (setup_1.ALCHEMY_URL === undefined) {
                        this.skip();
                    }
                    await this.provider.send("hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: setup_1.ALCHEMY_URL,
                                blockNumber: 11565019,
                            },
                        },
                    ]);
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    const timestamp = provider_utils_1.rpcQuantityToNumber(block.timestamp);
                    const date = new Date(timestamp * 1000);
                    // check that the new block date is 2021-Jan-01
                    chai_1.assert.equal(date.getUTCDate(), 1);
                    chai_1.assert.equal(date.getUTCMonth(), 0);
                    chai_1.assert.equal(date.getUTCFullYear(), 2021);
                });
            });
        });
    });
});
//# sourceMappingURL=forked-provider.js.map