"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedTxHash = exports.sendTransactionFromTxParams = exports.sendTxToZeroAddress = exports.deployContract = void 0;
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const output_1 = require("../../../../src/internal/hardhat-network/provider/output");
const providers_1 = require("./providers");
const retrieveCommon_1 = require("./retrieveCommon");
async function deployContract(provider, deploymentCode) {
    const hash = await provider.send("eth_sendTransaction", [
        {
            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
            data: deploymentCode,
            gas: output_1.numberToRpcQuantity(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
        },
    ]);
    const { contractAddress } = await provider.send("eth_getTransactionReceipt", [
        hash,
    ]);
    return contractAddress;
}
exports.deployContract = deployContract;
async function sendTxToZeroAddress(provider, from) {
    const accounts = await provider.send("eth_accounts");
    const burnTxParams = {
        from: from !== null && from !== void 0 ? from : accounts[0],
        to: ethereumjs_util_1.zeroAddress(),
        value: output_1.numberToRpcQuantity(1),
        gas: output_1.numberToRpcQuantity(21000),
        gasPrice: output_1.numberToRpcQuantity(1),
    };
    return provider.send("eth_sendTransaction", [burnTxParams]);
}
exports.sendTxToZeroAddress = sendTxToZeroAddress;
async function sendTransactionFromTxParams(provider, txParams) {
    return provider.send("eth_sendTransaction", [
        {
            to: ethereumjs_util_1.bufferToHex(txParams.to),
            from: ethereumjs_util_1.bufferToHex(txParams.from),
            data: ethereumjs_util_1.bufferToHex(txParams.data),
            nonce: output_1.numberToRpcQuantity(txParams.nonce),
            value: output_1.numberToRpcQuantity(txParams.value),
            gas: output_1.numberToRpcQuantity(txParams.gasLimit),
            gasPrice: output_1.numberToRpcQuantity(txParams.gasPrice),
        },
    ]);
}
exports.sendTransactionFromTxParams = sendTransactionFromTxParams;
async function getSignedTxHash(hardhatNetworkProvider, txParams, signerAccountIndex) {
    const txToSign = new ethereumjs_tx_1.Transaction(txParams, {
        common: await retrieveCommon_1.retrieveCommon(hardhatNetworkProvider),
    });
    txToSign.sign(ethereumjs_util_1.toBuffer(providers_1.DEFAULT_ACCOUNTS[signerAccountIndex].privateKey));
    return ethereumjs_util_1.bufferToHex(txToSign.hash(true));
}
exports.getSignedTxHash = getSignedTxHash;
//# sourceMappingURL=transactions.js.map