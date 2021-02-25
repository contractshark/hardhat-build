"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_common_1 = __importDefault(require("ethereumjs-common"));
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const provider_utils_1 = require("../../../../../src/internal/core/providers/provider-utils");
const errors_1 = require("../../../../../src/internal/hardhat-network/provider/errors");
const random_1 = require("../../../../../src/internal/hardhat-network/provider/fork/random");
const node_1 = require("../../../../../src/internal/hardhat-network/provider/node");
const output_1 = require("../../../../../src/internal/hardhat-network/provider/output");
const getCurrentTimestamp_1 = require("../../../../../src/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const assertions_1 = require("../../helpers/assertions");
const constants_1 = require("../../helpers/constants");
const contracts_1 = require("../../helpers/contracts");
const conversions_1 = require("../../helpers/conversions");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../helpers/transactions");
// tslint:disable-next-line no-var-requires
const { recoverTypedSignature_v4 } = require("eth-sig-util");
const PRECOMPILES_COUNT = 8;
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork, chainId }) => {
        if (isFork) {
            this.timeout(50000);
        }
        describe(`${name} provider`, function () {
            cwd_1.setCWD();
            useProvider();
            const getFirstBlock = async () => isFork ? retrieveForkBlockNumber_1.retrieveForkBlockNumber(this.ctx.hardhatNetworkProvider) : 0;
            describe("eth_accounts", async function () {
                it("should return the genesis accounts in lower case", async function () {
                    const accounts = await this.provider.send("eth_accounts");
                    chai_1.assert.deepEqual(accounts, providers_1.DEFAULT_ACCOUNTS_ADDRESSES);
                });
            });
            describe("eth_blockNumber", async function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("should return the current block number as QUANTITY", async function () {
                    let blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock);
                    await transactions_1.sendTxToZeroAddress(this.provider);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock + 1);
                    await transactions_1.sendTxToZeroAddress(this.provider);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock + 2);
                    await transactions_1.sendTxToZeroAddress(this.provider);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock + 3);
                });
                it("Should increase if a transaction gets to execute and fails", async function () {
                    let blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock);
                    try {
                        await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: "0x0000000000000000000000000000000000000001",
                                gas: output_1.numberToRpcQuantity(21000),
                                gasPrice: output_1.numberToRpcQuantity(1),
                            },
                        ]);
                        chai_1.assert.fail("Tx should have failed");
                    }
                    catch (e) {
                        chai_1.assert.notInclude(e.message, "Tx should have failed");
                    }
                    blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock + 1);
                });
                it("Shouldn't increase if a call is made", async function () {
                    let blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: "0x0000000000000000000000000000000000000000",
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    assertions_1.assertQuantity(blockNumber, firstBlock);
                });
            });
            describe("eth_call", async function () {
                it("Should return the value returned by the contract", async function () {
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const result = await this.provider.send("eth_call", [
                        { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i },
                    ]);
                    chai_1.assert.equal(result, "0x0000000000000000000000000000000000000000000000000000000000000000");
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                        },
                    ]);
                    const result2 = await this.provider.send("eth_call", [
                        { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i },
                    ]);
                    chai_1.assert.equal(result2, "0x000000000000000000000000000000000000000000000000000000000000000a");
                });
                it("Should return the value returned by the contract using an unknown account as from", async function () {
                    const from = "0x1234567890123456789012345678901234567890";
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const result = await this.provider.send("eth_call", [
                        { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i, from },
                    ]);
                    chai_1.assert.equal(result, "0x0000000000000000000000000000000000000000000000000000000000000000");
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                        },
                    ]);
                    const result2 = await this.provider.send("eth_call", [
                        { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i, from },
                    ]);
                    chai_1.assert.equal(result2, "0x000000000000000000000000000000000000000000000000000000000000000a");
                });
                it("Should be run in the context of the last block with 'latest' param", async function () {
                    const firstBlock = await getFirstBlock();
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                    const blockResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                        },
                        "latest",
                    ]);
                    chai_1.assert.equal(conversions_1.dataToNumber(blockResult), firstBlock + 1);
                    const timestampResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockTimestamp,
                        },
                        "latest",
                    ]);
                    chai_1.assert.equal(timestampResult, timestamp);
                });
                it("Should be run in the context of the last block with without block tag param", async function () {
                    const firstBlock = await getFirstBlock();
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                    const blockResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                        },
                    ]);
                    chai_1.assert.equal(conversions_1.dataToNumber(blockResult), firstBlock + 1);
                    const timestampResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockTimestamp,
                        },
                    ]);
                    chai_1.assert.equal(timestampResult, timestamp);
                });
                it("Should be run in the context of a new block with 'pending' block tag param", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    const blockResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                        },
                        "pending",
                    ]);
                    chai_1.assert.equal(conversions_1.dataToNumber(blockResult), firstBlock + 2);
                    const timestampResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockTimestamp,
                        },
                        "pending",
                    ]);
                    chai_1.assert.equal(timestampResult, timestamp);
                });
                it("Should return an empty buffer if called an non-contract account", async function () {
                    const result = await this.provider.send("eth_call", [
                        {
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                        },
                    ]);
                    chai_1.assert.equal(result, "0x");
                });
                it("Should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000000a";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        output_1.numberToRpcQuantity(firstBlock + 1),
                    ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        "latest",
                    ]), `0x${newState}`);
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await assertions_1.assertInvalidInputError(this.provider, "eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(123),
                        },
                        output_1.numberToRpcQuantity(futureBlock),
                    ], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
                it("Should return the initial balance for the genesis accounts in the previous block after a transaction", async function () {
                    const blockNumber = await this.provider.send("eth_blockNumber");
                    const account = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0];
                    const initialBalanceBeforeTx = await this.provider.send("eth_getBalance", [account, blockNumber]);
                    chai_1.assert.equal(initialBalanceBeforeTx, "0xde0b6b3a7640000");
                    await transactions_1.sendTxToZeroAddress(this.provider, account);
                    const initialBalanceAfterTx = await this.provider.send("eth_getBalance", [account, blockNumber]);
                    chai_1.assert.equal(initialBalanceAfterTx, "0xde0b6b3a7640000");
                });
                it("should work with blockhashes calls", async function () {
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.bytecode.object}`);
                    const resultBlock0 = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.selectors.test0,
                        },
                    ]);
                    chai_1.assert.lengthOf(resultBlock0, 66);
                    const resultBlock1 = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.selectors.test1,
                        },
                    ]);
                    chai_1.assert.lengthOf(resultBlock1, 66);
                    const resultBlock1m = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.selectors.test1m,
                        },
                    ]);
                    chai_1.assert.equal(resultBlock1m, "0x0000000000000000000000000000000000000000000000000000000000000000");
                });
                it("should run in the context of the blocktag's block", async function () {
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                    const blockNumber = provider_utils_1.rpcQuantityToNumber(await this.provider.send("eth_blockNumber", []));
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    const blockResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                        },
                        output_1.numberToRpcQuantity(blockNumber),
                    ]);
                    chai_1.assert.equal(conversions_1.dataToNumber(blockResult), blockNumber);
                });
                it("should accept a gas limit higher than the block gas limit being used", async function () {
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                    const blockNumber = provider_utils_1.rpcQuantityToNumber(await this.provider.send("eth_blockNumber", []));
                    const gas = "0x5f5e100"; // 100M gas
                    const blockResult = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            gas,
                        },
                        output_1.numberToRpcQuantity(blockNumber),
                    ]);
                    chai_1.assert.equal(conversions_1.dataToNumber(blockResult), blockNumber);
                    const blockResult2 = await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            gas,
                        },
                        "pending",
                    ]);
                    chai_1.assert.equal(conversions_1.dataToNumber(blockResult2), blockNumber + 1);
                });
            });
            describe("eth_chainId", async function () {
                it("should return the chain id as QUANTITY", async function () {
                    assertions_1.assertQuantity(await this.provider.send("eth_chainId"), chainId);
                });
            });
            describe("eth_coinbase", async function () {
                it("should return the the hardcoded coinbase address", async function () {
                    chai_1.assert.equal(await this.provider.send("eth_coinbase"), ethereumjs_util_1.bufferToHex(node_1.COINBASE_ADDRESS));
                });
            });
            describe("eth_compileLLL", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_compileLLL");
                });
            });
            describe("eth_compileSerpent", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_compileSerpent");
                });
            });
            describe("eth_compileSolidity", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_compileSolidity");
                });
            });
            describe("eth_estimateGas", async function () {
                it("should estimate the gas for a transfer", async function () {
                    const estimation = await this.provider.send("eth_estimateGas", [
                        {
                            from: ethereumjs_util_1.zeroAddress(),
                            to: ethereumjs_util_1.zeroAddress(),
                        },
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(estimation)).lten(23000));
                });
                it("should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000000a";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const result = await this.provider.send("eth_estimateGas", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                        output_1.numberToRpcQuantity(firstBlock + 1),
                    ]);
                    const result2 = await this.provider.send("eth_estimateGas", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(result)).gt(new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(result2))));
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await assertions_1.assertInvalidInputError(this.provider, "eth_estimateGas", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(123),
                        },
                        output_1.numberToRpcQuantity(futureBlock),
                    ], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
            describe("eth_gasPrice", async function () {
                it("should return a fixed gas price", async function () {
                    assertions_1.assertQuantity(await this.provider.send("eth_gasPrice"), 8e9);
                });
            });
            describe("eth_getBalance", async function () {
                it("Should return 0 for empty accounts", async function () {
                    if (!isFork) {
                        assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [ethereumjs_util_1.zeroAddress()]), 0);
                        assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [
                            "0x0000000000000000000000000000000000000001",
                        ]), 0);
                    }
                    assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                    ]), 0);
                });
                it("Should return the initial balance for the genesis accounts", async function () {
                    await assertions_1.assertNodeBalances(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                });
                it("Should return the updated balance after a transaction is made", async function () {
                    await assertions_1.assertNodeBalances(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    await assertions_1.assertNodeBalances(this.provider, [
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[0].subn(1 + 21000),
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[1].addn(1),
                        ...providers_1.DEFAULT_ACCOUNTS_BALANCES.slice(2),
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(2),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(2),
                        },
                    ]);
                    await assertions_1.assertNodeBalances(this.provider, [
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[0].subn(1 + 21000 + 2 + 21000 * 2),
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[1].addn(1 + 2),
                        ...providers_1.DEFAULT_ACCOUNTS_BALANCES.slice(2),
                    ]);
                });
                it("Should return the original balance after a call is made", async function () {
                    await assertions_1.assertNodeBalances(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    await assertions_1.assertNodeBalances(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            value: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    await assertions_1.assertNodeBalances(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                });
                it("should assign the block reward to the coinbase address", async function () {
                    const coinbase = await this.provider.send("eth_coinbase");
                    assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [coinbase]), 0);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                    ]);
                    const balance = new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(await this.provider.send("eth_getBalance", [coinbase])));
                    chai_1.assert.isTrue(balance.gtn(0));
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                    ]);
                    const balance2 = new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(await this.provider.send("eth_getBalance", [coinbase])));
                    chai_1.assert.isTrue(balance2.gt(balance));
                });
                it("should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                            value: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    if (!isFork) {
                        chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                            ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                            "earliest",
                        ]), "0x0");
                    }
                    chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                        output_1.numberToRpcQuantity(firstBlock),
                    ]), "0x0");
                    chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                        output_1.numberToRpcQuantity(firstBlock + 1),
                    ]), "0x1");
                    chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                        ethereumjs_util_1.bufferToHex(constants_1.EMPTY_ACCOUNT_ADDRESS),
                    ]), "0x1");
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await assertions_1.assertInvalidInputError(this.provider, "eth_getBalance", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], output_1.numberToRpcQuantity(futureBlock)], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
            describe("eth_getBlockByHash", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockByHash", [
                        "0x0000000000000000000000000000000000000000000000000000000000000001",
                        false,
                    ]));
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockByHash", [
                        "0x0000000000000000000000000000000000000000000000000000000000000123",
                        true,
                    ]));
                });
                it("Should return the block with transaction hashes if the second argument is false", async function () {
                    const firstBlock = await getFirstBlock();
                    const txHash = await transactions_1.sendTxToZeroAddress(this.provider);
                    const txOutput = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    const block = await this.provider.send("eth_getBlockByHash", [txOutput.blockHash, false]);
                    chai_1.assert.equal(block.hash, txOutput.blockHash);
                    assertions_1.assertQuantity(block.number, firstBlock + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.include(block.transactions, txHash);
                    chai_1.assert.equal(block.miner, ethereumjs_util_1.bufferToHex(node_1.COINBASE_ADDRESS));
                    chai_1.assert.isEmpty(block.uncles);
                });
                it("Should return the block with the complete transactions if the second argument is true", async function () {
                    const firstBlock = await getFirstBlock();
                    const txHash = await transactions_1.sendTxToZeroAddress(this.provider);
                    const txOutput = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    const block = await this.provider.send("eth_getBlockByHash", [txOutput.blockHash, true]);
                    chai_1.assert.equal(block.hash, txOutput.blockHash);
                    assertions_1.assertQuantity(block.number, firstBlock + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.miner, ethereumjs_util_1.bufferToHex(node_1.COINBASE_ADDRESS));
                    chai_1.assert.deepEqual(block.transactions[0], txOutput);
                    chai_1.assert.isEmpty(block.uncles);
                });
            });
            describe("eth_getBlockByNumber", async function () {
                it("Should return the genesis block for number 0", async function () {
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(0),
                        false,
                    ]);
                    chai_1.assert.equal(block.parentHash, "0x0000000000000000000000000000000000000000000000000000000000000000");
                    assertions_1.assertQuantity(block.number, 0);
                    chai_1.assert.isEmpty(block.transactions);
                });
                it("Should return null for unknown blocks", async function () {
                    const firstBlock = await getFirstBlock();
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 2),
                        false,
                    ]);
                    chai_1.assert.isNull(block);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                        true,
                    ]);
                    chai_1.assert.isNull(block2);
                });
                it("Should return the new blocks", async function () {
                    const firstBlockNumber = await getFirstBlock();
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(firstBlockNumber), false]);
                    const txHash = await transactions_1.sendTxToZeroAddress(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(firstBlockNumber + 1), false]);
                    assertions_1.assertQuantity(block.number, firstBlockNumber + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.parentHash, firstBlock.hash);
                    chai_1.assert.include(block.transactions, txHash);
                    chai_1.assert.equal(block.miner, ethereumjs_util_1.bufferToHex(node_1.COINBASE_ADDRESS));
                    chai_1.assert.isEmpty(block.uncles);
                });
                it("should return the complete transactions if the second argument is true", async function () {
                    const firstBlockNumber = await getFirstBlock();
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(firstBlockNumber), false]);
                    const txHash = await transactions_1.sendTxToZeroAddress(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(firstBlockNumber + 1), true]);
                    assertions_1.assertQuantity(block.number, firstBlockNumber + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.parentHash, firstBlock.hash);
                    chai_1.assert.equal(block.miner, ethereumjs_util_1.bufferToHex(node_1.COINBASE_ADDRESS));
                    chai_1.assert.isEmpty(block.uncles);
                    const txOutput = block.transactions[0];
                    chai_1.assert.equal(txOutput.hash, txHash);
                    chai_1.assert.equal(block.hash, txOutput.blockHash);
                    chai_1.assert.equal(block.number, txOutput.blockNumber);
                    chai_1.assert.equal(txOutput.transactionIndex, output_1.numberToRpcQuantity(0));
                    chai_1.assert.deepEqual(txOutput, await this.provider.send("eth_getTransactionByHash", [txHash]));
                });
                it("should return the right block total difficulty", isFork ? testTotalDifficultyFork : testTotalDifficulty);
                async function testTotalDifficultyFork() {
                    const forkBlockNumber = await getFirstBlock();
                    const forkBlock = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(forkBlockNumber), false]);
                    await transactions_1.sendTxToZeroAddress(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(forkBlockNumber + 1), false]);
                    assertions_1.assertQuantity(block.totalDifficulty, conversions_1.quantityToBN(forkBlock.totalDifficulty).add(conversions_1.quantityToBN(block.difficulty)));
                }
                async function testTotalDifficulty() {
                    const genesisBlock = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(0), false]);
                    assertions_1.assertQuantity(genesisBlock.totalDifficulty, 1);
                    assertions_1.assertQuantity(genesisBlock.difficulty, 1);
                    await transactions_1.sendTxToZeroAddress(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(1), false]);
                    assertions_1.assertQuantity(block.totalDifficulty, conversions_1.quantityToNumber(block.difficulty) + 1);
                }
            });
            describe("eth_getBlockTransactionCountByHash", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockTransactionCountByHash", [
                        "0x1111111111111111111111111111111111111111111111111111111111111111",
                    ]));
                });
                it("Should return 0 for the genesis block", async function () {
                    const genesisBlock = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(0), false]);
                    assertions_1.assertQuantity(await this.provider.send("eth_getBlockTransactionCountByHash", [
                        genesisBlock.hash,
                    ]), 0);
                });
                it("Should return 1 for others", async function () {
                    const txhash = await transactions_1.sendTxToZeroAddress(this.provider);
                    const txOutput = await this.provider.send("eth_getTransactionByHash", [txhash]);
                    assertions_1.assertQuantity(await this.provider.send("eth_getBlockTransactionCountByHash", [
                        txOutput.blockHash,
                    ]), 1);
                });
            });
            describe("eth_getBlockTransactionCountByNumber", async function () {
                it("should return null for non-existing blocks", async function () {
                    const firstBlock = await getFirstBlock();
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                    ]));
                });
                it("Should return 0 for the genesis block", async function () {
                    assertions_1.assertQuantity(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        output_1.numberToRpcQuantity(0),
                    ]), 0);
                });
                it("Should return 1 for others", async function () {
                    const firstBlock = await getFirstBlock();
                    await transactions_1.sendTxToZeroAddress(this.provider);
                    assertions_1.assertQuantity(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                    ]), 1);
                });
            });
            describe("eth_getCode", async function () {
                it("Should return an empty buffer for non-contract accounts", async function () {
                    chai_1.assert.equal(await this.provider.send("eth_getCode", [ethereumjs_util_1.zeroAddress()]), "0x");
                });
                it("Should return an empty buffer for precompiles", async function () {
                    for (let i = 1; i <= PRECOMPILES_COUNT; i++) {
                        const precompileNumber = i.toString(16);
                        const zero = ethereumjs_util_1.zeroAddress();
                        chai_1.assert.equal(await this.provider.send("eth_getCode", [
                            zero.substr(0, zero.length - precompileNumber.length) +
                                precompileNumber,
                        ]), "0x");
                    }
                });
                it("Should return the deployed code", async function () {
                    // This a deployment transaction that pushes 0x41 (i.e. ascii A) followed by 31 0s to
                    // the stack, stores that in memory, and then returns the first byte from memory.
                    // This deploys a contract which a single byte of code, 0x41.
                    const contractAddress = await transactions_1.deployContract(this.provider, "0x7f410000000000000000000000000000000000000000000000000000000000000060005260016000f3");
                    chai_1.assert.equal(await this.provider.send("eth_getCode", [contractAddress]), "0x41");
                });
                it("Should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    chai_1.assert.strictEqual(await this.provider.send("eth_getCode", [
                        exampleContract,
                        output_1.numberToRpcQuantity(firstBlock),
                    ]), "0x");
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await assertions_1.assertInvalidInputError(this.provider, "eth_getCode", [random_1.randomAddress(), output_1.numberToRpcQuantity(futureBlock)], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
            describe("eth_getCompilers", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getCompilers");
                });
            });
            describe("block filters", function () {
                it("Supports block filters", async function () {
                    chai_1.assert.isString(await this.provider.send("eth_newBlockFilter"));
                });
                it("Supports uninstalling an existing filter", async function () {
                    const filterId = await this.provider.send("eth_newBlockFilter", []);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                });
                it("Doesn't fail on uninstalling a non-existent filter", async function () {
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        "0x1",
                    ]);
                    chai_1.assert.isFalse(uninstalled);
                });
                it("should start returning at least one block", async function () {
                    const filterId = await this.provider.send("eth_newBlockFilter", []);
                    const blockHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isNotEmpty(blockHashes);
                });
                it("should not return the same block twice", async function () {
                    const filterId = await this.provider.send("eth_newBlockFilter", []);
                    await this.provider.send("eth_getFilterChanges", [filterId]);
                    const blockHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isEmpty(blockHashes);
                });
                it("should return new blocks", async function () {
                    const filterId = await this.provider.send("eth_newBlockFilter", []);
                    const initialHashes = await this.provider.send("eth_getFilterChanges", [filterId]);
                    chai_1.assert.lengthOf(initialHashes, 1);
                    const empty = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isEmpty(empty);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    const blockHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.lengthOf(blockHashes, 3);
                });
                it("should return reorganized block", async function () {
                    const filterId = await this.provider.send("eth_newBlockFilter", []);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterChanges", [filterId]), 1);
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    await this.provider.send("evm_mine", []);
                    const block1 = await this.provider.send("eth_getBlockByNumber", [
                        await this.provider.send("eth_blockNumber"),
                        false,
                    ]);
                    await this.provider.send("evm_revert", [snapshotId]);
                    await this.provider.send("evm_mine", []);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        await this.provider.send("eth_blockNumber"),
                        false,
                    ]);
                    const blockHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.deepEqual(blockHashes, [block1.hash, block2.hash]);
                });
            });
            describe("eth_getFilterLogs", async function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("Supports get filter logs", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [{}]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const logs = await this.provider.send("eth_getFilterLogs", [
                        filterId,
                    ]);
                    chai_1.assert.lengthOf(logs, 1);
                    const log = logs[0];
                    chai_1.assert.equal(log.removed, false);
                    chai_1.assert.equal(log.logIndex, "0x0");
                    chai_1.assert.equal(log.transactionIndex, "0x0");
                    chai_1.assert.equal(conversions_1.quantityToNumber(log.blockNumber), firstBlock + 2);
                    chai_1.assert.equal(log.address, exampleContract);
                    chai_1.assert.equal(log.data, `0x${newState}`);
                });
                it("Supports uninstalling an existing log filter", async function () {
                    const filterId = await this.provider.send("eth_newFilter", [{}]);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                });
                it("Supports get filter logs with address", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with topics", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            topics: [
                                "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                "0x0000000000000000000000000000000000000000000000000000000000000000",
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with null topic", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            topics: [
                                "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                null,
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with multiple topics", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                ],
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with fromBlock", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            fromBlock: output_1.numberToRpcQuantity(firstBlock),
                            address: exampleContract,
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x000000000000000000000000000000000000000000000000000000000000003b",
                                ],
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 2);
                });
                it("Supports get filter logs with toBlock", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            fromBlock: output_1.numberToRpcQuantity(firstBlock),
                            toBlock: output_1.numberToRpcQuantity(firstBlock + 2),
                            address: exampleContract,
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x000000000000000000000000000000000000000000000000000000000000003b",
                                ],
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
            });
            describe("eth_getLogs", async function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("Supports get logs", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000007b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                        },
                    ]), 0);
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    chai_1.assert.lengthOf(logs, 1);
                    const log = logs[0];
                    chai_1.assert.equal(log.removed, false);
                    chai_1.assert.equal(log.logIndex, "0x0");
                    chai_1.assert.equal(log.transactionIndex, "0x0");
                    chai_1.assert.equal(conversions_1.quantityToNumber(log.blockNumber), firstBlock + 2);
                    chai_1.assert.equal(log.address, exampleContract);
                    chai_1.assert.equal(log.data, `0x${newState}`);
                });
                it("Supports get logs with address", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]), 1);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                        },
                    ]), 0);
                });
                it("Supports get logs with topics", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            topics: [
                                "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                            ],
                        },
                    ]), 1);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            topics: [
                                "0x0000000000000000000000000000000000000000000000000000000000000000",
                            ],
                        },
                    ]), 0);
                });
                it("Supports get logs with null topic", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            topics: [
                                null,
                                "0x0000000000000000000000000000000000000000000000000000000000000000",
                            ],
                        },
                    ]), 1);
                });
                it("Supports get logs with multiple topic", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: output_1.numberToRpcQuantity(firstBlock + 2),
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x000000000000000000000000000000000000000000000000000000000000003b",
                                ],
                            ],
                        },
                    ]), 2);
                });
                it("Supports get logs with fromBlock", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: output_1.numberToRpcQuantity(firstBlock + 3),
                        },
                    ]), 1);
                });
                it("Supports get logs with toBlock", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: output_1.numberToRpcQuantity(firstBlock + 1),
                            toBlock: output_1.numberToRpcQuantity(firstBlock + 2),
                        },
                    ]), 1);
                });
                it("should accept out of bound block numbers", async function () {
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                            fromBlock: output_1.numberToRpcQuantity(firstBlock + 10000000),
                        },
                    ]);
                    chai_1.assert.lengthOf(logs, 0);
                    const logs2 = await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                            fromBlock: output_1.numberToRpcQuantity(firstBlock),
                            toBlock: output_1.numberToRpcQuantity(firstBlock + 1000000),
                        },
                    ]);
                    chai_1.assert.lengthOf(logs2, 0);
                });
                it("should return a new array every time", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const logs1 = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    logs1[0].address = "changed";
                    const logs2 = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    chai_1.assert.notEqual(logs1, logs2);
                    chai_1.assert.notEqual(logs1[0], logs2[0]);
                    chai_1.assert.notEqual(logs2[0].address, "changed");
                });
                it("Should accept block hashes as from", async function () {
                    const blockNumberBegin = await this.provider.send("eth_blockNumber");
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("evm_mine", []);
                    const blockNumberEnd = await this.provider.send("eth_blockNumber");
                    const block0 = await this.provider.send("eth_getBlockByNumber", [
                        blockNumberBegin,
                        false,
                    ]);
                    const block3 = await this.provider.send("eth_getBlockByNumber", [
                        blockNumberEnd,
                        false,
                    ]);
                    const logsFromZero = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                            fromBlock: {
                                blockHash: block0.hash,
                            },
                        },
                    ]);
                    chai_1.assert.lengthOf(logsFromZero, 1);
                    const logsFromThree = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                            fromBlock: {
                                blockHash: block3.hash,
                            },
                        },
                    ]);
                    chai_1.assert.lengthOf(logsFromThree, 0);
                });
                it("Should accept block hashes as toBlock", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("evm_mine", []);
                    const block0 = await this.provider.send("eth_getBlockByNumber", [
                        "0x0",
                        false,
                    ]);
                    const logsToZero = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                            toBlock: {
                                blockHash: block0.hash,
                            },
                        },
                    ]);
                    chai_1.assert.lengthOf(logsToZero, 0);
                });
                it("Should throw if the block tag in toBlock or fromBlock doesn't exist", async function () {
                    await assertions_1.assertInvalidInputError(this.provider, "eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                            fromBlock: {
                                blockHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
                            },
                        },
                    ]);
                    await assertions_1.assertInvalidInputError(this.provider, "eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                            toBlock: {
                                blockHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
                            },
                        },
                    ]);
                });
                it("should have logIndex for logs in remote blocks", async function () {
                    if (!isFork) {
                        this.skip();
                    }
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            address: "0x2A07fBCD64BE0e2329890C21c6F34e81889a5912",
                            topics: [
                                "0x8f7de836135871245dd9c04f295aef602311da1591d262ecb4d2f45c7a88003d",
                            ],
                            fromBlock: output_1.numberToRpcQuantity(10721019),
                            toBlock: output_1.numberToRpcQuantity(10721019),
                        },
                    ]);
                    chai_1.assert.lengthOf(logs, 1);
                    chai_1.assert.isDefined(logs[0].logIndex);
                    chai_1.assert.isNotNull(logs[0].logIndex);
                });
            });
            describe("eth_getProof", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getProof");
                });
            });
            describe("eth_getStorageAt", async function () {
                describe("Imitating Ganache", function () {
                    describe("When a slot has not been written into", function () {
                        it("Should return `0x0000000000000000000000000000000000000000000000000000000000000000`", async function () {
                            const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                            chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                exampleContract,
                                output_1.numberToRpcQuantity(3),
                            ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                            chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                exampleContract,
                                output_1.numberToRpcQuantity(4),
                            ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                            chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                output_1.numberToRpcQuantity(0),
                            ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                        });
                    });
                    describe("When a slot has been written into", function () {
                        describe("When 32 bytes where written", function () {
                            it("Should return a 32-byte DATA string", async function () {
                                const firstBlock = await getFirstBlock();
                                const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    output_1.numberToRpcQuantity(2),
                                    output_1.numberToRpcQuantity(firstBlock),
                                ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    output_1.numberToRpcQuantity(2),
                                ]), "0x1234567890123456789012345678901234567890123456789012345678901234");
                            });
                        });
                        describe("When less than 32 bytes where written", function () {
                            it("Should return a DATA string with the same amount bytes that have been written", async function () {
                                const firstBlock = await getFirstBlock();
                                const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                                // We return as the EthereumJS VM stores it. This has been checked
                                // against remix
                                let newState = "000000000000000000000000000000000000000000000000000000000000007b";
                                await this.provider.send("eth_sendTransaction", [
                                    {
                                        to: exampleContract,
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                                    },
                                ]);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    output_1.numberToRpcQuantity(0),
                                    output_1.numberToRpcQuantity(firstBlock + 1),
                                ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    output_1.numberToRpcQuantity(0),
                                ]), "0x000000000000000000000000000000000000000000000000000000000000007b");
                                newState =
                                    "000000000000000000000000000000000000000000000000000000000000007c";
                                await this.provider.send("eth_sendTransaction", [
                                    {
                                        to: exampleContract,
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                                    },
                                ]);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    output_1.numberToRpcQuantity(0),
                                    output_1.numberToRpcQuantity(firstBlock + 2),
                                ]), "0x000000000000000000000000000000000000000000000000000000000000007b");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    output_1.numberToRpcQuantity(0),
                                ]), "0x000000000000000000000000000000000000000000000000000000000000007c");
                            });
                        });
                    });
                });
            });
            describe("eth_getTransactionByBlockHashAndIndex", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        "0x1231231231231231231231231231231231231231231231231231231231231231",
                        output_1.numberToRpcQuantity(0),
                    ]));
                });
                it("should return null for existing blocks but non-existing indexes", async function () {
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(0),
                        false,
                    ]);
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        block.hash,
                        output_1.numberToRpcQuantity(0),
                    ]));
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        block.hash,
                        output_1.numberToRpcQuantity(0),
                    ]));
                });
                it("should return the right info for the existing ones", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams1 = {
                        to: ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress()),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer("0xaa"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(25000),
                        gasPrice: new ethereumjs_util_1.BN(23912),
                    };
                    const txHash = await transactions_1.sendTransactionFromTxParams(this.provider, txParams1);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                        false,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByBlockHashAndIndex", [block.hash, output_1.numberToRpcQuantity(0)]);
                    assertions_1.assertTransaction(tx, txHash, txParams1, firstBlock + 1, block.hash, 0);
                    const txParams2 = {
                        to: ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress()),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer([]),
                        nonce: new ethereumjs_util_1.BN(1),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(80000),
                        gasPrice: new ethereumjs_util_1.BN(239),
                    };
                    const txHash2 = await transactions_1.sendTransactionFromTxParams(this.provider, txParams2);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 2),
                        false,
                    ]);
                    const tx2 = await this.provider.send("eth_getTransactionByBlockHashAndIndex", [block2.hash, output_1.numberToRpcQuantity(0)]);
                    assertions_1.assertTransaction(tx2, txHash2, txParams2, firstBlock + 2, block2.hash, 0);
                });
            });
            describe("eth_getTransactionByBlockNumberAndIndex", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockNumberAndIndex", [output_1.numberToRpcQuantity(1), output_1.numberToRpcQuantity(0)]));
                });
                it("should return null for existing blocks but non-existing indexes", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockNumberAndIndex", [output_1.numberToRpcQuantity(0), output_1.numberToRpcQuantity(0)]));
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockNumberAndIndex", [output_1.numberToRpcQuantity(1), output_1.numberToRpcQuantity(0)]));
                });
                it("should return the right info for the existing ones", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams1 = {
                        to: ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress()),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer("0xaa"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(25000),
                        gasPrice: new ethereumjs_util_1.BN(23912),
                    };
                    const txHash = await transactions_1.sendTransactionFromTxParams(this.provider, txParams1);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                        false,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByBlockNumberAndIndex", [output_1.numberToRpcQuantity(firstBlock + 1), output_1.numberToRpcQuantity(0)]);
                    assertions_1.assertTransaction(tx, txHash, txParams1, firstBlock + 1, block.hash, 0);
                    const txParams2 = {
                        to: ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress()),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer([]),
                        nonce: new ethereumjs_util_1.BN(1),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(80000),
                        gasPrice: new ethereumjs_util_1.BN(239),
                    };
                    const txHash2 = await transactions_1.sendTransactionFromTxParams(this.provider, txParams2);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 2),
                        false,
                    ]);
                    const tx2 = await this.provider.send("eth_getTransactionByBlockNumberAndIndex", [output_1.numberToRpcQuantity(firstBlock + 2), output_1.numberToRpcQuantity(0)]);
                    assertions_1.assertTransaction(tx2, txHash2, txParams2, firstBlock + 2, block2.hash, 0);
                });
            });
            describe("eth_getTransactionByHash", async function () {
                it("should return null for unknown txs", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByHash", [
                        "0x1234567890123456789012345678901234567890123456789012345678902134",
                    ]));
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByHash", [
                        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    ]));
                });
                it("should return the right info for the existing ones", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams1 = {
                        to: ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress()),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer("0xaa"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(25000),
                        gasPrice: new ethereumjs_util_1.BN(23912),
                    };
                    const txHash = await transactions_1.sendTransactionFromTxParams(this.provider, txParams1);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                        false,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    assertions_1.assertTransaction(tx, txHash, txParams1, firstBlock + 1, block.hash, 0);
                    const txParams2 = {
                        to: ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress()),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer([]),
                        nonce: new ethereumjs_util_1.BN(1),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(80000),
                        gasPrice: new ethereumjs_util_1.BN(239),
                    };
                    const txHash2 = await transactions_1.sendTransactionFromTxParams(this.provider, txParams2);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 2),
                        false,
                    ]);
                    const tx2 = await this.provider.send("eth_getTransactionByHash", [txHash2]);
                    assertions_1.assertTransaction(tx2, txHash2, txParams2, firstBlock + 2, block2.hash, 0);
                });
                it("should return the transaction if it gets to execute and failed", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams = {
                        to: ethereumjs_util_1.toBuffer([]),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer("0x60006000fd"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(250000),
                        gasPrice: new ethereumjs_util_1.BN(23912),
                    };
                    const txHash = await transactions_1.getSignedTxHash(this.hardhatNetworkProvider, txParams, 1);
                    // Revert. This is a deployment transaction that immediately reverts without a reason
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: ethereumjs_util_1.bufferToHex(txParams.from),
                        data: ethereumjs_util_1.bufferToHex(txParams.data),
                        nonce: output_1.numberToRpcQuantity(txParams.nonce),
                        value: output_1.numberToRpcQuantity(txParams.value),
                        gas: output_1.numberToRpcQuantity(txParams.gasLimit),
                        gasPrice: output_1.numberToRpcQuantity(txParams.gasPrice),
                    }, "Transaction reverted without a reason");
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        txHash,
                    ]);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(firstBlock + 1),
                        false,
                    ]);
                    assertions_1.assertTransaction(tx, txHash, txParams, firstBlock + 1, block.hash, 0);
                });
                it("should return the right properties", async function () {
                    const address = "0x738a6fe8b5034a10e85f19f2abdfd5ed4e12463e";
                    const privateKey = Buffer.from("17ade313db5de97d19b4cfbc820d15e18a6c710c1afbf01c1f31249970d3ae46", "hex");
                    // send eth to the account that will sign the tx
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: address,
                            value: "0x16345785d8a0000",
                            gas: output_1.numberToRpcQuantity(21000),
                        },
                    ]);
                    // create and send signed tx
                    const common = ethereumjs_common_1.default.forCustomChain("mainnet", {
                        chainId: providers_1.DEFAULT_CHAIN_ID,
                        networkId: providers_1.DEFAULT_NETWORK_ID,
                        name: "hardhat",
                    }, "muirGlacier");
                    const tx = new ethereumjs_tx_1.Transaction({
                        nonce: "0x00",
                        gasPrice: "0x2",
                        gasLimit: "0x55f0",
                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        value: "0x1",
                        data: "0xbeef",
                    }, {
                        common,
                    });
                    tx.sign(privateKey);
                    const rawTx = `0x${tx.serialize().toString("hex")}`;
                    const txHash = await this.provider.send("eth_sendRawTransaction", [
                        rawTx,
                    ]);
                    const fetchedTx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    chai_1.assert.equal(fetchedTx.from, address);
                    chai_1.assert.equal(fetchedTx.to, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    chai_1.assert.equal(fetchedTx.value, "0x1");
                    chai_1.assert.equal(fetchedTx.nonce, "0x0");
                    chai_1.assert.equal(fetchedTx.gas, "0x55f0");
                    chai_1.assert.equal(fetchedTx.gasPrice, "0x2");
                    chai_1.assert.equal(fetchedTx.input, "0xbeef");
                    // tx.v is padded but fetchedTx.v is not, so we need to do this
                    const fetchedTxV = new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(fetchedTx.v));
                    const expectedTxV = new ethereumjs_util_1.BN(tx.v);
                    chai_1.assert.isTrue(fetchedTxV.eq(expectedTxV));
                    chai_1.assert.equal(ethereumjs_util_1.toBuffer(fetchedTx.r).toString("hex"), tx.r.toString("hex"));
                    chai_1.assert.equal(ethereumjs_util_1.toBuffer(fetchedTx.s).toString("hex"), tx.s.toString("hex"));
                });
                it("should get an existing transaction from mainnet", async function () {
                    if (!isFork) {
                        this.skip();
                    }
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        "0x5a4bf6970980a9381e6d6c78d96ab278035bbff58c383ffe96a0a2bbc7c02a4b",
                    ]);
                    chai_1.assert.equal(tx.from, "0x8a9d69aa686fa0f9bbdec21294f67d4d9cfb4a3e");
                });
                it("should get an existing transaction from rinkeby", async function () {
                    const { ALCHEMY_URL } = process.env;
                    if (!isFork || ALCHEMY_URL === undefined || ALCHEMY_URL === "") {
                        this.skip();
                    }
                    const rinkebyUrl = ALCHEMY_URL.replace("mainnet", "rinkeby");
                    await this.provider.send("hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: rinkebyUrl,
                            },
                        },
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        "0x9f8322fbfc0092c0493d4421626e682a0ef0a56ea37efe8f29cda804cca92e7f",
                    ]);
                    chai_1.assert.equal(tx.from, "0xbc3109d75dffaae85ef595902e3bd70fe0643b3b");
                });
            });
            describe("eth_getTransactionCount", async function () {
                it("Should return 0 for random accounts", async function () {
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        ethereumjs_util_1.zeroAddress(),
                    ]), 0);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        "0x0000000000000000000000000000000000000001",
                    ]), 0);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        "0x0001231287316387168230000000000000000001",
                    ]), 0);
                });
                it("Should return the updated count after a transaction is made", async function () {
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 0);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 1);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                    ]), 0);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 1);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                    ]), 1);
                });
                it("Should not be affected by calls", async function () {
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 0);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 0);
                });
                it("Should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    if (!isFork) {
                        assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                            providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            "earliest",
                        ]), 0);
                    }
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        output_1.numberToRpcQuantity(firstBlock),
                    ]), 0);
                    assertions_1.assertQuantity(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        "latest",
                    ]), 1);
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await assertions_1.assertInvalidInputError(this.provider, "eth_getTransactionCount", [random_1.randomAddress(), output_1.numberToRpcQuantity(futureBlock)], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
            describe("eth_getTransactionReceipt", async function () {
                it("should return null for unknown txs", async function () {
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [
                        "0x1234567876543234567876543456765434567aeaeaed67616732632762762373",
                    ]);
                    chai_1.assert.isNull(receipt);
                });
                it("should return the right values for successful txs", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                        },
                    ]);
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(firstBlock + 2), false]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    chai_1.assert.equal(receipt.blockHash, block.hash);
                    assertions_1.assertQuantity(receipt.blockNumber, firstBlock + 2);
                    chai_1.assert.isNull(receipt.contractAddress);
                    chai_1.assert.equal(receipt.cumulativeGasUsed, receipt.gasUsed);
                    chai_1.assert.equal(receipt.from, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    assertions_1.assertQuantity(receipt.status, 1);
                    chai_1.assert.equal(receipt.logs.length, 1);
                    chai_1.assert.equal(receipt.to, contractAddress);
                    chai_1.assert.equal(receipt.transactionHash, txHash);
                    assertions_1.assertQuantity(receipt.transactionIndex, 0);
                    const log = receipt.logs[0];
                    chai_1.assert.isFalse(log.removed);
                    assertions_1.assertQuantity(log.logIndex, 0);
                    assertions_1.assertQuantity(log.transactionIndex, 0);
                    chai_1.assert.equal(log.transactionHash, txHash);
                    chai_1.assert.equal(log.blockHash, block.hash);
                    assertions_1.assertQuantity(log.blockNumber, firstBlock + 2);
                    chai_1.assert.equal(log.address, contractAddress);
                    // The new value of i is not indexed
                    chai_1.assert.equal(log.data, "0x000000000000000000000000000000000000000000000000000000000000000a");
                    chai_1.assert.deepEqual(log.topics, [
                        contracts_1.EXAMPLE_CONTRACT.topics.StateModified[0],
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                    ]);
                });
                it("should return the receipt for txs that were executed and failed", async function () {
                    const txParams = {
                        to: ethereumjs_util_1.toBuffer([]),
                        from: ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: ethereumjs_util_1.toBuffer("0x60006000fd"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(250000),
                        gasPrice: new ethereumjs_util_1.BN(23912),
                    };
                    const txHash = await transactions_1.getSignedTxHash(this.hardhatNetworkProvider, txParams, 1);
                    // Revert. This is a deployment transaction that immediately reverts without a reason
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: ethereumjs_util_1.bufferToHex(txParams.from),
                        data: ethereumjs_util_1.bufferToHex(txParams.data),
                        nonce: output_1.numberToRpcQuantity(txParams.nonce),
                        value: output_1.numberToRpcQuantity(txParams.value),
                        gas: output_1.numberToRpcQuantity(txParams.gasLimit),
                        gasPrice: output_1.numberToRpcQuantity(txParams.gasPrice),
                    }, "Transaction reverted without a reason");
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    chai_1.assert.isNotNull(receipt);
                });
                it("should return a new object every time", async function () {
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    const receipt1 = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    receipt1.blockHash = "changed";
                    const receipt2 = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    chai_1.assert.notEqual(receipt1, receipt2);
                    chai_1.assert.notEqual(receipt2.blockHash, "changed");
                });
            });
            describe("eth_getUncleByBlockHashAndIndex", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getUncleByBlockHashAndIndex");
                });
            });
            describe("eth_getUncleByBlockNumberAndIndex", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getUncleByBlockNumberAndIndex");
                });
            });
            describe("eth_getUncleCountByBlockHash", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getUncleCountByBlockHash");
                });
            });
            describe("eth_getUncleCountByBlockNumber", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getUncleCountByBlockNumber");
                });
            });
            describe("eth_getWork", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_getWork");
                });
            });
            describe("eth_hashrate", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_hashrate");
                });
            });
            describe("eth_mining", async function () {
                it("should return false", async function () {
                    chai_1.assert.deepEqual(await this.provider.send("eth_mining"), false);
                });
            });
            describe("eth_newPendingTransactionFilter", async function () {
                it("Supports pending transaction filter", async function () {
                    chai_1.assert.isString(await this.provider.send("eth_newPendingTransactionFilter"));
                });
                it("Supports uninstalling an existing filter", async function () {
                    const filterId = await this.provider.send("eth_newPendingTransactionFilter", []);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                });
                it("Should return new pending transactions", async function () {
                    const filterId = await this.provider.send("eth_newPendingTransactionFilter", []);
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: ethereumjs_util_1.zeroAddress(),
                        gas: output_1.numberToRpcQuantity(21000),
                    };
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const txHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isNotEmpty(txHashes);
                });
                it("Should not return new pending transactions after uninstall", async function () {
                    const filterId = await this.provider.send("eth_newPendingTransactionFilter", []);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: ethereumjs_util_1.zeroAddress(),
                        gas: output_1.numberToRpcQuantity(21000),
                    };
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const txHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isNull(txHashes);
                });
            });
            describe("eth_pendingTransactions", async function () {
                it("should return an empty array, as there is no pending transactions support", async function () {
                    chai_1.assert.deepEqual(await this.provider.send("eth_pendingTransactions"), []);
                });
            });
            describe("eth_protocolVersion", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_protocolVersion");
                });
            });
            describe("eth_sendRawTransaction", async function () {
                it("Should throw if the data isn't a proper transaction", async function () {
                    await assertions_1.assertInvalidInputError(this.provider, "eth_sendRawTransaction", ["0x123456"], "Invalid transaction");
                });
                it("Should throw if the signature is invalid", async function () {
                    if (isFork) {
                        this.skip();
                        return;
                    }
                    await assertions_1.assertInvalidInputError(this.provider, "eth_sendRawTransaction", [
                        // This transaction was obtained with eth_sendTransaction, and its r value was wiped
                        "0xf3808501dcd6500083015f9080800082011a80a00dbd1a45b7823be518540ca77afb7178a470b8054281530a6cdfd0ad3328cf96",
                    ], "Invalid transaction signature");
                });
                it("Should throw if the signature is invalid but for another chain (EIP155)", async function () {
                    if (isFork) {
                        this.skip();
                        return;
                    }
                    await assertions_1.assertInvalidInputError(this.provider, "eth_sendRawTransaction", [
                        "0xf86e820a0f843b9aca0083030d40941aad5e821c667e909c16a49363ca48f672b46c5d88169866e539efe0008025a07bc6a357d809c9d27f8f5a826861e7f9b4b7c9cff4f91f894b88e98212069b3da05dbadbdfa67bab1d76d2d81e33d90162d508431362331f266dd6aa0cb4b525aa",
                    ], "Incompatible EIP155-based");
                });
                it("Should send the raw transaction", async function () {
                    if (isFork) {
                        this.skip();
                        return;
                    }
                    // This test is a copy of: Should work with just from and data
                    const hash = await this.provider.send("eth_sendRawTransaction", [
                        "0xf853808501dcd6500083015f9080800082011aa09c8def73818f79b6493b7a3f7ce47b557694ca195d1b54bb74e3d98990041b44a00dbd1a45b7823be518540ca77afb7178a470b8054281530a6cdfd0ad3328cf96",
                    ]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [hash]);
                    const receiptFromGeth = {
                        blockHash: "0x01490da2af913e9a868430b7b4c5060fc29cbdb1692bb91d3c72c734acd73bc8",
                        blockNumber: "0x6",
                        contractAddress: "0x6ea84fcbef576d66896dc2c32e139b60e641170c",
                        cumulativeGasUsed: "0xcf0c",
                        from: "0xda4585f6e68ed1cdfdad44a08dbe3979ec74ad8f",
                        gasUsed: "0xcf0c",
                        logs: [],
                        logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                        status: "0x1",
                        to: null,
                        transactionHash: "0xbd24cbe9c1633b98e61d93619230341141d2cff49470ed6afa739cee057fd0aa",
                        transactionIndex: "0x0",
                    };
                    assertions_1.assertReceiptMatchesGethOne(receipt, receiptFromGeth, 1);
                });
            });
            describe("eth_sendTransaction", async function () {
                // Because of the way we are testing this (i.e. integration testing) it's almost impossible to
                // fully test this method in a reasonable amount of time. This is because it executes the core
                // of Ethereum: its state transition function.
                //
                // We have mostly test about logic added on top of that, and will add new ones whenever
                // suitable. This is approximately the same as assuming that ethereumjs-vm is correct, which
                // seems reasonable, and if it weren't we should address the issues there.
                describe("Params validation", function () {
                    it("Should fail for tx sent from account that is neither local nor marked as impersonated", async function () {
                        await assertions_1.assertTransactionFailure(this.provider, {
                            from: ethereumjs_util_1.zeroAddress(),
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        }, "unknown account", errors_1.InvalidInputError.CODE);
                    });
                    it("Should fail if sending to the null address without data", async function () {
                        await assertions_1.assertTransactionFailure(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        }, "contract creation without any data provided", errors_1.InvalidInputError.CODE);
                        await assertions_1.assertTransactionFailure(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        }, "contract creation without any data provided", errors_1.InvalidInputError.CODE);
                        await assertions_1.assertTransactionFailure(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: "0x",
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        }, "contract creation without any data provided", errors_1.InvalidInputError.CODE);
                    });
                });
                it("Should return a valid transaction hash", async function () {
                    const hash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(21000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                        },
                    ]);
                    chai_1.assert.match(hash, /^0x[a-f\d]{64}$/);
                });
                it("Should work with just from and data", async function () {
                    const firstBlock = await getFirstBlock();
                    const hash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: "0x00",
                        },
                    ]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [hash]);
                    const receiptFromGeth = {
                        blockHash: "0x01490da2af913e9a868430b7b4c5060fc29cbdb1692bb91d3c72c734acd73bc8",
                        blockNumber: "0x6",
                        contractAddress: "0x6ea84fcbef576d66896dc2c32e139b60e641170c",
                        cumulativeGasUsed: "0xcf0c",
                        from: "0xda4585f6e68ed1cdfdad44a08dbe3979ec74ad8f",
                        gasUsed: "0xcf0c",
                        logs: [],
                        logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                        status: "0x1",
                        to: null,
                        transactionHash: "0xbd24cbe9c1633b98e61d93619230341141d2cff49470ed6afa739cee057fd0aa",
                        transactionIndex: "0x0",
                    };
                    assertions_1.assertReceiptMatchesGethOne(receipt, receiptFromGeth, firstBlock + 1);
                });
                it("Should throw if the transaction fails", async function () {
                    // Not enough gas
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        to: ethereumjs_util_1.zeroAddress(),
                        gas: output_1.numberToRpcQuantity(1),
                    }, "Transaction requires at least 21000 gas but got 1");
                    // Not enough balance
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        to: ethereumjs_util_1.zeroAddress(),
                        gas: output_1.numberToRpcQuantity(21000),
                        gasPrice: output_1.numberToRpcQuantity(providers_1.DEFAULT_ACCOUNTS_BALANCES[0]),
                    }, "sender doesn't have enough funds to send tx");
                    // Gas is larger than block gas limit
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        to: ethereumjs_util_1.zeroAddress(),
                        gas: output_1.numberToRpcQuantity(providers_1.DEFAULT_BLOCK_GAS_LIMIT + 1),
                    }, `Transaction gas limit is ${providers_1.DEFAULT_BLOCK_GAS_LIMIT + 1} and exceeds block gas limit of ${providers_1.DEFAULT_BLOCK_GAS_LIMIT}`);
                    // Invalid opcode. We try to deploy a contract with an invalid opcode in the deployment code
                    // The transaction gets executed anyway, so the account is updated
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        data: "0xAA",
                    }, "Transaction reverted without a reason");
                    // Out of gas. This a deployment transaction that pushes 0x00 multiple times
                    // The transaction gets executed anyway, so the account is updated.
                    //
                    // Note: this test is pretty fragile, as the tx needs to have enough gas
                    // to pay for the calldata, but not enough to execute. This costs changed
                    // with istanbul, and may change again in the future.
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        data: "0x6000600060006000600060006000600060006000600060006000600060006000600060006000600060006000600060006000",
                        gas: output_1.numberToRpcQuantity(53500),
                    }, "out of gas");
                    // Invalid nonce
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        nonce: output_1.numberToRpcQuantity(1),
                    }, "Invalid nonce. Expected 2 but got 1");
                    // Revert. This is a deployment transaction that immediately reverts without a reason
                    // The transaction gets executed anyway, so the account is updated
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        data: "0x60006000fd",
                    }, "Transaction reverted without a reason");
                    // This is a contract that reverts with A in its constructor
                    await assertions_1.assertTransactionFailure(this.provider, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        data: "0x6080604052348015600f57600080fd5b506040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260018152602001807f410000000000000000000000000000000000000000000000000000000000000081525060200191505060405180910390fdfe",
                    }, "revert A");
                });
                it("Should fail if a successful tx is sent more than once", async function () {
                    const txParams = {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        nonce: output_1.numberToRpcQuantity(0),
                    };
                    const hash = await this.provider.send("eth_sendTransaction", [
                        txParams,
                    ]);
                    await assertions_1.assertTransactionFailure(this.provider, txParams, `known transaction: ${ethereumjs_util_1.bufferToHex(hash)}`);
                });
                it("should accept a failed transaction if it eventually becomes valid", async function () {
                    const txParams = {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        nonce: output_1.numberToRpcQuantity(1),
                    };
                    // This transaction is invalid now, because of its nonce
                    await assertions_1.assertTransactionFailure(this.provider, txParams);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            nonce: output_1.numberToRpcQuantity(0),
                        },
                    ]);
                    // The transaction is now valid
                    const hash = await this.provider.send("eth_sendTransaction", [
                        txParams,
                    ]);
                    // It should throw now
                    await assertions_1.assertTransactionFailure(this.provider, txParams, `known transaction: ${ethereumjs_util_1.bufferToHex(hash)}`);
                });
                // This test checks that an on-chain value can be set to 0
                // To do this, we transfer all the balance of the 0x0000...0001 account
                // to some random account, and then check that its balance is zero
                it("should set a value to 0", async function () {
                    if (!isFork) {
                        this.skip();
                    }
                    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
                    const sender = "0x0000000000000000000000000000000000000001";
                    await this.provider.send("hardhat_impersonateAccount", [sender]);
                    // get balance of 0x0000...0001
                    const balanceBefore = await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: daiAddress,
                            data: "0x70a082310000000000000000000000000000000000000000000000000000000000000001",
                        },
                    ]);
                    // send out the full balance
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: sender,
                            to: daiAddress,
                            data: `0xa9059cbb0000000000000000000000005a3fed996fc40791a26e7fb78dda4f9293788951${balanceBefore.slice(2)}`,
                        },
                    ]);
                    const balanceAfter = await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: daiAddress,
                            data: "0x70a082310000000000000000000000000000000000000000000000000000000000000001",
                        },
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(balanceAfter)).isZero());
                });
            });
            describe("eth_sign", async function () {
                // TODO: Test this. Note that it's implementation is tested in one of
                // our provider wrappers, but re-test it here anyway.
            });
            describe("eth_signTransaction", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_signTransaction");
                });
            });
            describe("eth_signTypedData", function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_signTypedData");
                });
            });
            describe("eth_signTypedData_v3", function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_signTypedData_v3");
                });
            });
            describe("eth_signTypedData_v4", function () {
                // See https://eips.ethereum.org/EIPS/eip-712#parameters
                // There's a json schema and an explanation for each field.
                const typedMessage = {
                    domain: {
                        chainId: 31337,
                        name: "Hardhat Network test suite",
                    },
                    message: {
                        name: "Translation",
                        start: {
                            x: 200,
                            y: 600,
                        },
                        end: {
                            x: 300,
                            y: 350,
                        },
                        cost: 50,
                    },
                    primaryType: "WeightedVector",
                    types: {
                        EIP712Domain: [
                            { name: "name", type: "string" },
                            { name: "chainId", type: "uint256" },
                        ],
                        WeightedVector: [
                            { name: "name", type: "string" },
                            { name: "start", type: "Point" },
                            { name: "end", type: "Point" },
                            { name: "cost", type: "uint256" },
                        ],
                        Point: [
                            { name: "x", type: "uint256" },
                            { name: "y", type: "uint256" },
                        ],
                    },
                };
                const [address] = providers_1.DEFAULT_ACCOUNTS_ADDRESSES;
                it("should sign a message", async function () {
                    const signature = await this.provider.request({
                        method: "eth_signTypedData_v4",
                        params: [address, typedMessage],
                    });
                    const signedMessage = {
                        data: typedMessage,
                        sig: signature,
                    };
                    const recoveredAddress = recoverTypedSignature_v4(signedMessage);
                    chai_1.assert.equal(address.toLowerCase(), recoveredAddress.toLowerCase());
                });
                it("should sign a message that is JSON stringified", async function () {
                    const signature = await this.provider.request({
                        method: "eth_signTypedData_v4",
                        params: [address, JSON.stringify(typedMessage)],
                    });
                    const signedMessage = {
                        data: typedMessage,
                        sig: signature,
                    };
                    const recoveredAddress = recoverTypedSignature_v4(signedMessage);
                    chai_1.assert.equal(address.toLowerCase(), recoveredAddress.toLowerCase());
                });
                it("should fail with an invalid JSON", async function () {
                    try {
                        const signature = await this.provider.request({
                            method: "eth_signTypedData_v4",
                            params: [address, "{an invalid JSON"],
                        });
                    }
                    catch (error) {
                        chai_1.assert.include(error.message, "is an invalid JSON");
                        return;
                    }
                    chai_1.assert.fail("should have failed with an invalid JSON");
                });
            });
            describe("eth_submitHashrate", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_submitHashrate");
                });
            });
            describe("eth_submitWork", async function () {
                it("is not supported", async function () {
                    await assertions_1.assertNotSupported(this.provider, "eth_submitWork");
                });
            });
            describe("eth_subscribe", async function () {
                if (name === "JSON-RPC") {
                    return;
                }
                function createFilterResultsGetter(ethereumProvider, filter) {
                    const notificationsResults = [];
                    const notificationsListener = (payload) => {
                        if (filter === payload.subscription) {
                            notificationsResults.push(payload.result);
                        }
                    };
                    ethereumProvider.addListener("notifications", notificationsListener);
                    const messageResults = [];
                    const messageListener = (event) => {
                        if (event.type === "eth_subscription") {
                            const subscriptionMessage = event;
                            if (filter === subscriptionMessage.data.subscription) {
                                messageResults.push(subscriptionMessage.data.result);
                            }
                        }
                    };
                    ethereumProvider.addListener("message", messageListener);
                    let shouldUnsubscribe = true;
                    return () => {
                        if (shouldUnsubscribe) {
                            ethereumProvider.removeListener("notifications", notificationsListener);
                            ethereumProvider.removeListener("message", messageListener);
                            shouldUnsubscribe = false;
                        }
                        return {
                            notificationsResults,
                            messageResults,
                        };
                    };
                }
                it("Supports newHeads subscribe", async function () {
                    const filterId = await this.provider.send("eth_subscribe", [
                        "newHeads",
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    chai_1.assert.isTrue(await this.provider.send("eth_unsubscribe", [filterId]));
                    chai_1.assert.lengthOf(getResults().notificationsResults, 3);
                    chai_1.assert.lengthOf(getResults().messageResults, 3);
                });
                it("Supports newPendingTransactions subscribe", async function () {
                    const filterId = await this.provider.send("eth_subscribe", [
                        "newPendingTransactions",
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: ethereumjs_util_1.zeroAddress(),
                        gas: output_1.numberToRpcQuantity(21000),
                    };
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    chai_1.assert.isTrue(await this.provider.send("eth_unsubscribe", [filterId]));
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    chai_1.assert.lengthOf(getResults().notificationsResults, 1);
                    chai_1.assert.lengthOf(getResults().messageResults, 1);
                });
                it("Supports logs subscribe", async function () {
                    const exampleContract = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const filterId = await this.provider.send("eth_subscribe", [
                        "logs",
                        {
                            address: exampleContract,
                        },
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    const newState = "000000000000000000000000000000000000000000000000000000000000007b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(getResults().notificationsResults, 1);
                    chai_1.assert.lengthOf(getResults().messageResults, 1);
                });
            });
            describe("eth_syncing", async function () {
                it("Should return false", async function () {
                    chai_1.assert.deepEqual(await this.provider.send("eth_syncing"), false);
                });
            });
            describe("eth_unsubscribe", async function () {
                it("Supports unsubscribe", async function () {
                    const filterId = await this.provider.send("eth_subscribe", [
                        "newHeads",
                    ]);
                    chai_1.assert.isTrue(await this.provider.send("eth_unsubscribe", [filterId]));
                });
                it("Doesn't fail when unsubscribe is called for a non-existent filter", async function () {
                    chai_1.assert.isFalse(await this.provider.send("eth_unsubscribe", ["0x1"]));
                });
            });
            describe("block tags", function () {
                it("should allow EIP-1898 block tags", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000000a";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const previousBlockNumber = `0x${(firstBlock + 1).toString(16)}`;
                    const previousBlock = await this.provider.send("eth_getBlockByNumber", [previousBlockNumber, false]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockNumber: previousBlock.number,
                        },
                    ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockHash: previousBlock.hash,
                        },
                    ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                    const latestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockNumber: latestBlock.number,
                        },
                    ]), `0x${newState}`);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockHash: latestBlock.hash,
                        },
                    ]), `0x${newState}`);
                });
                it("should not accept an empty block tag", async function () {
                    await assertions_1.assertInvalidArgumentsError(this.provider, "eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        {},
                    ]);
                });
                it("should not accept both a blockNumber and a blockHash in a block tag", async function () {
                    const latestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    await assertions_1.assertInvalidArgumentsError(this.provider, "eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        {
                            blockNumber: 0,
                            blockHash: latestBlock.hash,
                        },
                    ]);
                    it("should accept a requireCanonical flag", async function () {
                        const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [
                            ethereumjs_util_1.zeroAddress(),
                            {
                                blockNumber: block.number,
                                requireCanonical: true,
                            },
                        ]), 0);
                        assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [
                            ethereumjs_util_1.zeroAddress(),
                            {
                                blockNumber: block.number,
                                requireCanonical: false,
                            },
                        ]), 0);
                        assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [
                            ethereumjs_util_1.zeroAddress(),
                            {
                                blockHash: block.hash,
                                requireCanonical: true,
                            },
                        ]), 0);
                        assertions_1.assertQuantity(await this.provider.send("eth_getBalance", [
                            ethereumjs_util_1.zeroAddress(),
                            {
                                blockHash: block.hash,
                                requireCanonical: false,
                            },
                        ]), 0);
                    });
                });
            });
            describe("gas usage", function () {
                it("should use 15K less gas when writing a non-zero slot", async function () {
                    const contractAddress = await transactions_1.deployContract(this.provider, `0x${contracts_1.EXAMPLE_SETTER_CONTRACT.bytecode.object}`);
                    const firstTxHash = await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_SETTER_CONTRACT.selectors.setValue}0000000000000000000000000000000000000000000000000000000000000001`,
                        },
                    ]);
                    const firstReceipt = await this.provider.send("eth_getTransactionReceipt", [firstTxHash]);
                    const gasUsedBefore = new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(firstReceipt.gasUsed));
                    const secondTxHash = await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_SETTER_CONTRACT.selectors.setValue}0000000000000000000000000000000000000000000000000000000000000002`,
                        },
                    ]);
                    const secondReceipt = await this.provider.send("eth_getTransactionReceipt", [secondTxHash]);
                    const gasUsedAfter = new ethereumjs_util_1.BN(ethereumjs_util_1.toBuffer(secondReceipt.gasUsed));
                    const gasDifference = gasUsedBefore.sub(gasUsedAfter);
                    chai_1.assert.equal(gasDifference.toString(), "15000");
                });
            });
        });
    });
});
//# sourceMappingURL=eth.js.map