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
exports.EthModule = void 0;
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const t = __importStar(require("io-ts"));
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const util_1 = __importDefault(require("util"));
const wei_values_1 = require("../../../util/wei-values");
const message_trace_1 = require("../../stack-traces/message-trace");
const model_1 = require("../../stack-traces/model");
const solidity_stack_trace_1 = require("../../stack-traces/solidity-stack-trace");
const errors_1 = require("../errors");
const filter_1 = require("../filter");
const input_1 = require("../input");
const output_1 = require("../output");
// tslint:disable only-hardhat-error
class EthModule {
    constructor(_common, _node, _throwOnTransactionFailures, _throwOnCallFailures, _logger, _experimentalHardhatNetworkMessageTraceHooks = []) {
        this._common = _common;
        this._node = _node;
        this._throwOnTransactionFailures = _throwOnTransactionFailures;
        this._throwOnCallFailures = _throwOnCallFailures;
        this._logger = _logger;
        this._experimentalHardhatNetworkMessageTraceHooks = _experimentalHardhatNetworkMessageTraceHooks;
    }
    async processRequest(method, params = []) {
        switch (method) {
            case "eth_accounts":
                return this._accountsAction(...this._accountsParams(params));
            case "eth_blockNumber":
                return this._blockNumberAction(...this._blockNumberParams(params));
            case "eth_call":
                return this._callAction(...this._callParams(params));
            case "eth_chainId":
                return this._chainIdAction(...this._chainIdParams(params));
            case "eth_coinbase":
                return this._coinbaseAction(...this._coinbaseParams(params));
            case "eth_compileLLL":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_compileSerpent":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_compileSolidity":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_estimateGas":
                return this._estimateGasAction(...this._estimateGasParams(params));
            case "eth_gasPrice":
                return this._gasPriceAction(...this._gasPriceParams(params));
            case "eth_getBalance":
                return this._getBalanceAction(...this._getBalanceParams(params));
            case "eth_getBlockByHash":
                return this._getBlockByHashAction(...this._getBlockByHashParams(params));
            case "eth_getBlockByNumber":
                return this._getBlockByNumberAction(...this._getBlockByNumberParams(params));
            case "eth_getBlockTransactionCountByHash":
                return this._getBlockTransactionCountByHashAction(...this._getBlockTransactionCountByHashParams(params));
            case "eth_getBlockTransactionCountByNumber":
                return this._getBlockTransactionCountByNumberAction(...this._getBlockTransactionCountByNumberParams(params));
            case "eth_getCode":
                return this._getCodeAction(...this._getCodeParams(params));
            case "eth_getCompilers":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_getFilterChanges":
                return this._getFilterChangesAction(...this._getFilterChangesParams(params));
            case "eth_getFilterLogs":
                return this._getFilterLogsAction(...this._getFilterLogsParams(params));
            case "eth_getLogs":
                return this._getLogsAction(...this._getLogsParams(params));
            case "eth_getProof":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_getStorageAt":
                return this._getStorageAtAction(...this._getStorageAtParams(params));
            case "eth_getTransactionByBlockHashAndIndex":
                return this._getTransactionByBlockHashAndIndexAction(...this._getTransactionByBlockHashAndIndexParams(params));
            case "eth_getTransactionByBlockNumberAndIndex":
                return this._getTransactionByBlockNumberAndIndexAction(...this._getTransactionByBlockNumberAndIndexParams(params));
            case "eth_getTransactionByHash":
                return this._getTransactionByHashAction(...this._getTransactionByHashParams(params));
            case "eth_getTransactionCount":
                return this._getTransactionCountAction(...this._getTransactionCountParams(params));
            case "eth_getTransactionReceipt":
                return this._getTransactionReceiptAction(...this._getTransactionReceiptParams(params));
            case "eth_getUncleByBlockHashAndIndex":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_getUncleByBlockNumberAndIndex":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_getUncleCountByBlockHash":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_getUncleCountByBlockNumber":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_getWork":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_hashrate":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_mining":
                return this._miningAction(...this._miningParams(params));
            case "eth_newBlockFilter":
                return this._newBlockFilterAction(...this._newBlockFilterParams(params));
            case "eth_newFilter":
                return this._newFilterAction(...this._newFilterParams(params));
            case "eth_newPendingTransactionFilter":
                return this._newPendingTransactionAction(...this._newPendingTransactionParams(params));
            case "eth_pendingTransactions":
                return this._pendingTransactionsAction(...this._pendingTransactionsParams(params));
            case "eth_protocolVersion":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_sendRawTransaction":
                return this._sendRawTransactionAction(...this._sendRawTransactionParams(params));
            case "eth_sendTransaction":
                return this._sendTransactionAction(...this._sendTransactionParams(params));
            case "eth_sign":
                return this._signAction(...this._signParams(params));
            case "eth_signTransaction":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_signTypedData":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_signTypedData_v3":
                throw new errors_1.MethodNotSupportedError(method);
            // TODO: we're currently mimicking the MetaMask implementation here.
            // The EIP 712 is still a draft. It doesn't actually distinguish different versions
            // of the eth_signTypedData API.
            // Also, note that go-ethereum implemented this in a clef JSON-RPC API: account_signTypedData.
            case "eth_signTypedData_v4":
                return this._signTypedDataV4Action(...this._signTypedDataV4Params(params));
            case "eth_submitHashrate":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_submitWork":
                throw new errors_1.MethodNotSupportedError(method);
            case "eth_subscribe":
                return this._subscribeAction(...this._subscribeParams(params));
            case "eth_syncing":
                return this._syncingAction(...this._syncingParams(params));
            case "eth_uninstallFilter":
                return this._uninstallFilterAction(...this._uninstallFilterParams(params));
            case "eth_unsubscribe":
                return this._unsubscribeAction(...this._unsubscribeParams(params));
        }
        throw new errors_1.MethodNotFoundError(`Method ${method} not found`);
    }
    // eth_accounts
    _accountsParams(params) {
        return input_1.validateParams(params);
    }
    async _accountsAction() {
        return this._node.getLocalAccountAddresses();
    }
    // eth_blockNumber
    _blockNumberParams(params) {
        return input_1.validateParams(params);
    }
    async _blockNumberAction() {
        const blockNumber = await this._node.getLatestBlockNumber();
        return output_1.numberToRpcQuantity(blockNumber);
    }
    // eth_call
    _callParams(params) {
        return input_1.validateParams(params, input_1.rpcCallRequest, input_1.optionalBlockTag);
    }
    async _callAction(rpcCall, blockTag) {
        const blockNumber = await this._blockTagToBlockNumber(blockTag);
        const callParams = await this._rpcCallRequestToNodeCallParams(rpcCall);
        const { result: returnData, trace, error, consoleLogMessages, } = await this._node.runCall(callParams, blockNumber);
        await this._logCallTrace(callParams, trace);
        if (trace !== undefined) {
            await this._runHardhatNetworkMessageTraceHooks(trace, true);
        }
        this._logConsoleLogMessages(consoleLogMessages);
        if (error !== undefined) {
            if (this._throwOnCallFailures) {
                throw error;
            }
            // TODO: This is a little duplicated with the provider, it should be
            //  refactored away
            // TODO: This will log the error, but the RPC method won't be red
            this._logError(error);
        }
        return output_1.bufferToRpcData(returnData);
    }
    // eth_chainId
    _chainIdParams(params) {
        return input_1.validateParams(params);
    }
    async _chainIdAction() {
        return output_1.numberToRpcQuantity(this._common.chainId());
    }
    // eth_coinbase
    _coinbaseParams(params) {
        return input_1.validateParams(params);
    }
    async _coinbaseAction() {
        return ethereumjs_util_1.bufferToHex(await this._node.getCoinbaseAddress());
    }
    // eth_compileLLL
    // eth_compileSerpent
    // eth_compileSolidity
    // eth_estimateGas
    _estimateGasParams(params) {
        return input_1.validateParams(params, input_1.rpcTransactionRequest, input_1.optionalBlockTag);
    }
    async _estimateGasAction(transactionRequest, blockTag) {
        const blockNumber = await this._blockTagToBlockNumber(blockTag);
        const txParams = await this._rpcTransactionRequestToNodeTransactionParams(transactionRequest);
        const { estimation, error, trace, consoleLogMessages, } = await this._node.estimateGas(txParams, blockNumber);
        if (error !== undefined) {
            await this._logEstimateGasTrace(txParams, trace);
            this._logConsoleLogMessages(consoleLogMessages);
            throw error;
        }
        return output_1.numberToRpcQuantity(estimation);
    }
    // eth_gasPrice
    _gasPriceParams(params) {
        return input_1.validateParams(params);
    }
    async _gasPriceAction() {
        return output_1.numberToRpcQuantity(await this._node.getGasPrice());
    }
    // eth_getBalance
    _getBalanceParams(params) {
        return input_1.validateParams(params, input_1.rpcAddress, input_1.optionalBlockTag);
    }
    async _getBalanceAction(address, blockTag) {
        const blockNumber = await this._blockTagToBlockNumber(blockTag);
        return output_1.numberToRpcQuantity(await this._node.getAccountBalance(address, blockNumber));
    }
    // eth_getBlockByHash
    _getBlockByHashParams(params) {
        return input_1.validateParams(params, input_1.rpcHash, t.boolean);
    }
    async _getBlockByHashAction(hash, includeTransactions) {
        const block = await this._node.getBlockByHash(hash);
        if (block === undefined) {
            return null;
        }
        const totalDifficulty = await this._node.getBlockTotalDifficulty(block);
        return output_1.getRpcBlock(block, totalDifficulty, includeTransactions);
    }
    // eth_getBlockByNumber
    _getBlockByNumberParams(params) {
        return input_1.validateParams(params, input_1.blockTag, t.boolean);
    }
    async _getBlockByNumberAction(tag, includeTransactions) {
        let block;
        if (typeof tag === "string") {
            if (tag === "earliest") {
                block = await this._node.getBlockByNumber(new ethereumjs_util_1.BN(0));
            }
            else if (tag === "latest") {
                block = await this._node.getLatestBlock();
            }
            else {
                throw new errors_1.InvalidInputError(`eth_getBlockByNumber doesn't support ${tag}`);
            }
        }
        else if (ethereumjs_util_1.BN.isBN(tag)) {
            block = await this._node.getBlockByNumber(tag);
        }
        else if (Buffer.isBuffer(tag)) {
            block = await this._node.getBlockByHash(tag);
        }
        if (block === undefined) {
            return null;
        }
        const totalDifficulty = await this._node.getBlockTotalDifficulty(block);
        return output_1.getRpcBlock(block, totalDifficulty, includeTransactions);
    }
    // eth_getBlockTransactionCountByHash
    _getBlockTransactionCountByHashParams(params) {
        return input_1.validateParams(params, input_1.rpcHash);
    }
    async _getBlockTransactionCountByHashAction(hash) {
        const block = await this._node.getBlockByHash(hash);
        if (block === undefined) {
            return null;
        }
        return output_1.numberToRpcQuantity(block.transactions.length);
    }
    // eth_getBlockTransactionCountByNumber
    _getBlockTransactionCountByNumberParams(params) {
        return input_1.validateParams(params, input_1.rpcQuantity);
    }
    async _getBlockTransactionCountByNumberAction(blockNumber) {
        const block = await this._node.getBlockByNumber(blockNumber);
        if (block === undefined) {
            return null;
        }
        return output_1.numberToRpcQuantity(block.transactions.length);
    }
    // eth_getCode
    _getCodeParams(params) {
        return input_1.validateParams(params, input_1.rpcAddress, input_1.optionalBlockTag);
    }
    async _getCodeAction(address, blockTag) {
        const blockNumber = await this._blockTagToBlockNumber(blockTag);
        return output_1.bufferToRpcData(await this._node.getCode(address, blockNumber));
    }
    // eth_getCompilers
    // eth_getFilterChanges
    _getFilterChangesParams(params) {
        return input_1.validateParams(params, input_1.rpcQuantity);
    }
    async _getFilterChangesAction(filterId) {
        const changes = await this._node.getFilterChanges(filterId);
        if (changes === undefined) {
            return null;
        }
        return changes;
    }
    // eth_getFilterLogs
    _getFilterLogsParams(params) {
        return input_1.validateParams(params, input_1.rpcQuantity);
    }
    async _getFilterLogsAction(filterId) {
        const changes = await this._node.getFilterLogs(filterId);
        if (changes === undefined) {
            return null;
        }
        return changes;
    }
    // eth_getLogs
    _getLogsParams(params) {
        return input_1.validateParams(params, input_1.rpcFilterRequest);
    }
    async _rpcFilterRequestToGetLogsParams(filter) {
        if (filter.blockHash !== undefined) {
            if (filter.fromBlock !== undefined || filter.toBlock !== undefined) {
                throw new errors_1.InvalidArgumentsError("blockHash is mutually exclusive with fromBlock/toBlock");
            }
            const block = await this._node.getBlockByHash(filter.blockHash);
            if (block === undefined) {
                throw new errors_1.InvalidArgumentsError("blockHash cannot be found");
            }
            filter.fromBlock = new ethereumjs_util_1.BN(block.header.number);
            filter.toBlock = new ethereumjs_util_1.BN(block.header.number);
        }
        const [fromBlock, toBlock] = await Promise.all([
            this._extractBlock(filter.fromBlock),
            this._extractBlock(filter.toBlock),
        ]);
        return {
            fromBlock,
            toBlock,
            normalizedTopics: this._extractNormalizedLogTopics(filter.topics),
            addresses: this._extractLogAddresses(filter.address),
        };
    }
    async _getLogsAction(filter) {
        const filterParams = await this._rpcFilterRequestToGetLogsParams(filter);
        const logs = await this._node.getLogs(filterParams);
        return cloneDeep_1.default(logs);
    }
    // eth_getProof
    // eth_getStorageAt
    _getStorageAtParams(params) {
        return input_1.validateParams(params, input_1.rpcAddress, input_1.rpcQuantity, input_1.optionalBlockTag);
    }
    async _getStorageAtAction(address, slot, blockTag) {
        const blockNumber = await this._blockTagToBlockNumber(blockTag);
        const data = await this._node.getStorageAt(address, slot, blockNumber);
        return output_1.bufferToRpcData(data);
    }
    // eth_getTransactionByBlockHashAndIndex
    _getTransactionByBlockHashAndIndexParams(params) {
        return input_1.validateParams(params, input_1.rpcHash, input_1.rpcQuantity);
    }
    async _getTransactionByBlockHashAndIndexAction(hash, index) {
        const i = index.toNumber();
        const block = await this._node.getBlockByHash(hash);
        if (block === undefined) {
            return null;
        }
        const tx = block.transactions[i];
        if (tx === undefined) {
            return null;
        }
        return output_1.getRpcTransaction(tx, block, i);
    }
    // eth_getTransactionByBlockNumberAndIndex
    _getTransactionByBlockNumberAndIndexParams(params) {
        return input_1.validateParams(params, input_1.rpcQuantity, input_1.rpcQuantity);
    }
    async _getTransactionByBlockNumberAndIndexAction(blockNumber, index) {
        const i = index.toNumber();
        const block = await this._node.getBlockByNumber(blockNumber);
        if (block === undefined) {
            return null;
        }
        const tx = block.transactions[i];
        if (tx === undefined) {
            return null;
        }
        return output_1.getRpcTransaction(tx, block, i);
    }
    // eth_getTransactionByHash
    _getTransactionByHashParams(params) {
        return input_1.validateParams(params, input_1.rpcHash);
    }
    async _getTransactionByHashAction(hash) {
        const tx = await this._node.getTransaction(hash);
        if (tx === undefined) {
            return null;
        }
        const block = await this._node.getBlockByTransactionHash(hash);
        let index;
        if (block !== undefined) {
            const transactions = block.transactions;
            const i = transactions.findIndex((bt) => bt.hash().equals(hash));
            if (i !== -1) {
                index = i;
            }
        }
        return output_1.getRpcTransaction(tx, block, index);
    }
    // eth_getTransactionCount
    _getTransactionCountParams(params) {
        return input_1.validateParams(params, input_1.rpcAddress, input_1.optionalBlockTag);
    }
    async _getTransactionCountAction(address, blockTag) {
        const blockNumber = await this._blockTagToBlockNumber(blockTag);
        return output_1.numberToRpcQuantity(await this._node.getAccountNonce(address, blockNumber));
    }
    // eth_getTransactionReceipt
    _getTransactionReceiptParams(params) {
        return input_1.validateParams(params, input_1.rpcHash);
    }
    async _getTransactionReceiptAction(hash) {
        const receipt = await this._node.getTransactionReceipt(hash);
        if (receipt === undefined) {
            return null;
        }
        return cloneDeep_1.default(receipt);
    }
    // eth_getUncleByBlockHashAndIndex
    // TODO: Implement
    // eth_getUncleByBlockNumberAndIndex
    // TODO: Implement
    // eth_getUncleCountByBlockHash
    // TODO: Implement
    // eth_getUncleCountByBlockNumber
    // TODO: Implement
    // eth_getWork
    // eth_hashrate
    // eth_mining
    _miningParams(params) {
        return input_1.validateParams(params);
    }
    async _miningAction() {
        return false;
    }
    // eth_newBlockFilter
    _newBlockFilterParams(params) {
        return [];
    }
    async _newBlockFilterAction() {
        const filterId = await this._node.newBlockFilter(false);
        return output_1.numberToRpcQuantity(filterId);
    }
    // eth_newFilter
    _newFilterParams(params) {
        return input_1.validateParams(params, input_1.rpcFilterRequest);
    }
    async _newFilterAction(filter) {
        const filterParams = await this._rpcFilterRequestToGetLogsParams(filter);
        const filterId = await this._node.newFilter(filterParams, false);
        return output_1.numberToRpcQuantity(filterId);
    }
    // eth_newPendingTransactionFilter
    _newPendingTransactionParams(params) {
        return [];
    }
    async _newPendingTransactionAction() {
        const filterId = await this._node.newPendingTransactionFilter(false);
        return output_1.numberToRpcQuantity(filterId);
    }
    // eth_pendingTransactions
    _pendingTransactionsParams(params) {
        return [];
    }
    async _pendingTransactionsAction() {
        const txs = await this._node.getPendingTransactions();
        return txs.map((tx) => output_1.getRpcTransaction(tx));
    }
    // eth_protocolVersion
    // eth_sendRawTransaction
    _sendRawTransactionParams(params) {
        return input_1.validateParams(params, input_1.rpcData);
    }
    async _sendRawTransactionAction(rawTx) {
        let tx;
        try {
            tx = new ethereumjs_tx_1.Transaction(rawTx, { common: this._common });
        }
        catch (error) {
            if (error.message === "invalid remainder") {
                throw new errors_1.InvalidInputError("Invalid transaction");
            }
            if (error.message.includes("EIP155")) {
                throw new errors_1.InvalidInputError(error.message);
            }
            throw error;
        }
        return this._sendTransactionAndReturnHash(tx);
    }
    // eth_sendTransaction
    _sendTransactionParams(params) {
        return input_1.validateParams(params, input_1.rpcTransactionRequest);
    }
    async _sendTransactionAction(transactionRequest) {
        const txParams = await this._rpcTransactionRequestToNodeTransactionParams(transactionRequest);
        const tx = await this._node.getSignedTransaction(txParams);
        return this._sendTransactionAndReturnHash(tx);
    }
    // eth_sign
    _signParams(params) {
        return input_1.validateParams(params, input_1.rpcAddress, input_1.rpcData);
    }
    async _signAction(address, data) {
        const signature = await this._node.signPersonalMessage(address, data);
        return ethereumjs_util_1.toRpcSig(signature.v, signature.r, signature.s);
    }
    // eth_signTransaction
    // eth_signTypedData_v4
    _signTypedDataV4Params(params) {
        // Validation of the TypedData parameter is handled by eth-sig-util
        return input_1.validateParams(params, input_1.rpcAddress, input_1.rpcUnknown);
    }
    async _signTypedDataV4Action(address, typedData) {
        let typedMessage = typedData;
        // According to the MetaMask implementation,
        // the message parameter may be JSON stringified in versions later than V1
        // See https://github.com/MetaMask/metamask-extension/blob/0dfdd44ae7728ed02cbf32c564c75b74f37acf77/app/scripts/metamask-controller.js#L1736
        // In fact, ethers.js JSON stringifies the message at the time of writing.
        if (typeof typedData === "string") {
            try {
                typedMessage = JSON.parse(typedData);
            }
            catch (error) {
                throw new errors_1.InvalidInputError(`The message parameter is an invalid JSON. Either pass a valid JSON or a plain object conforming to EIP712 TypedData schema.`);
            }
        }
        return this._node.signTypedDataV4(address, typedMessage);
    }
    // eth_submitHashrate
    // eth_submitWork
    _subscribeParams(params) {
        if (params.length === 0) {
            throw new errors_1.InvalidInputError("Expected subscription name as first argument");
        }
        return input_1.validateParams(params, input_1.rpcSubscribeRequest, input_1.optionalRpcFilterRequest);
    }
    async _subscribeAction(subscribeRequest, optionalFilterRequest) {
        switch (subscribeRequest) {
            case "newHeads":
                return output_1.numberToRpcQuantity(await this._node.newBlockFilter(true));
            case "newPendingTransactions":
                return output_1.numberToRpcQuantity(await this._node.newPendingTransactionFilter(true));
            case "logs":
                if (optionalFilterRequest === undefined) {
                    throw new errors_1.InvalidArgumentsError("missing params argument");
                }
                const filterParams = await this._rpcFilterRequestToGetLogsParams(optionalFilterRequest);
                return output_1.numberToRpcQuantity(await this._node.newFilter(filterParams, true));
        }
    }
    // eth_syncing
    _syncingParams(params) {
        return input_1.validateParams(params);
    }
    async _syncingAction() {
        return false;
    }
    // eth_uninstallFilter
    _uninstallFilterParams(params) {
        return input_1.validateParams(params, input_1.rpcQuantity);
    }
    async _uninstallFilterAction(filterId) {
        return this._node.uninstallFilter(filterId, false);
    }
    _unsubscribeParams(params) {
        return input_1.validateParams(params, input_1.rpcQuantity);
    }
    async _unsubscribeAction(filterId) {
        return this._node.uninstallFilter(filterId, true);
    }
    // Utility methods
    async _rpcCallRequestToNodeCallParams(rpcCall) {
        return {
            to: rpcCall.to !== undefined ? rpcCall.to : Buffer.from([]),
            from: rpcCall.from !== undefined
                ? rpcCall.from
                : await this._getDefaultCallFrom(),
            data: rpcCall.data !== undefined ? rpcCall.data : ethereumjs_util_1.toBuffer([]),
            gasLimit: rpcCall.gas !== undefined
                ? rpcCall.gas
                : await this._node.getBlockGasLimit(),
            gasPrice: rpcCall.gasPrice !== undefined
                ? rpcCall.gasPrice
                : await this._node.getGasPrice(),
            value: rpcCall.value !== undefined ? rpcCall.value : new ethereumjs_util_1.BN(0),
        };
    }
    async _rpcTransactionRequestToNodeTransactionParams(rpcTx) {
        return {
            to: rpcTx.to !== undefined ? rpcTx.to : Buffer.from([]),
            from: rpcTx.from,
            gasLimit: rpcTx.gas !== undefined
                ? rpcTx.gas
                : await this._node.getBlockGasLimit(),
            gasPrice: rpcTx.gasPrice !== undefined
                ? rpcTx.gasPrice
                : await this._node.getGasPrice(),
            value: rpcTx.value !== undefined ? rpcTx.value : new ethereumjs_util_1.BN(0),
            data: rpcTx.data !== undefined ? rpcTx.data : ethereumjs_util_1.toBuffer([]),
            nonce: rpcTx.nonce !== undefined
                ? rpcTx.nonce
                : await this._node.getAccountNonce(rpcTx.from, null),
        };
    }
    async _blockTagToBlockNumber(blockTag) {
        if (blockTag === "pending") {
            return null;
        }
        if (blockTag === undefined || blockTag === "latest") {
            return this._node.getLatestBlockNumber();
        }
        if (blockTag === "earliest") {
            return new ethereumjs_util_1.BN(0);
        }
        let block;
        if (ethereumjs_util_1.BN.isBN(blockTag)) {
            block = await this._node.getBlockByNumber(blockTag);
        }
        else if (Buffer.isBuffer(blockTag)) {
            block = await this._node.getBlockByHash(blockTag);
        }
        if (block === undefined) {
            const latestBlock = await this._node.getLatestBlockNumber();
            throw new errors_1.InvalidInputError(`Received invalid block tag ${this._blockTagToString(blockTag)}. Latest block number is ${latestBlock.toString()}`);
        }
        return new ethereumjs_util_1.BN(block.header.number);
    }
    async _extractBlock(blockTag) {
        if (ethereumjs_util_1.BN.isBN(blockTag)) {
            return blockTag;
        }
        if (Buffer.isBuffer(blockTag)) {
            const block = await this._node.getBlockByHash(blockTag);
            if (block === undefined) {
                throw new errors_1.InvalidInputError(`Received invalid block tag ${this._blockTagToString(blockTag)}. This block doesn't exist.`);
            }
            return new ethereumjs_util_1.BN(block.header.number);
        }
        switch (blockTag) {
            case "earliest":
                return new ethereumjs_util_1.BN(0);
            case undefined:
            case "latest":
                return filter_1.LATEST_BLOCK;
            case "pending":
            default:
                return filter_1.LATEST_BLOCK;
        }
    }
    _blockTagToString(tag) {
        if (typeof tag === "string") {
            return tag;
        }
        if (ethereumjs_util_1.BN.isBN(tag)) {
            return tag.toString();
        }
        return ethereumjs_util_1.bufferToHex(tag);
    }
    _extractNormalizedLogTopics(topics) {
        if (topics === undefined || topics.length === 0) {
            return [];
        }
        const normalizedTopics = [];
        for (const topic of topics) {
            if (Buffer.isBuffer(topic)) {
                normalizedTopics.push([topic]);
            }
            else {
                normalizedTopics.push(topic);
            }
        }
        return normalizedTopics;
    }
    _extractLogAddresses(address) {
        if (address === undefined) {
            return [];
        }
        if (Buffer.isBuffer(address)) {
            return [address];
        }
        return address;
    }
    async _getDefaultCallFrom() {
        const localAccounts = await this._node.getLocalAccountAddresses();
        if (localAccounts.length === 0) {
            return ethereumjs_util_1.toBuffer(ethereumjs_util_1.zeroAddress());
        }
        return ethereumjs_util_1.toBuffer(localAccounts[0]);
    }
    async _logEstimateGasTrace(txParams, trace) {
        if (trace !== undefined) {
            await this._logContractAndFunctionName(trace, true);
        }
        this._logFrom(txParams.from);
        this._logTo(txParams.to, trace);
        this._logValue(new ethereumjs_util_1.BN(txParams.value));
    }
    async _logTransactionTrace(tx, trace, block, blockResult) {
        if (trace !== undefined) {
            await this._logContractAndFunctionName(trace, false);
        }
        this._logger.logWithTitle("Transaction", ethereumjs_util_1.bufferToHex(tx.hash(true)));
        this._logFrom(tx.getSenderAddress());
        this._logTo(tx.to, trace);
        this._logValue(new ethereumjs_util_1.BN(tx.value));
        this._logger.logWithTitle("Gas used", `${new ethereumjs_util_1.BN(blockResult.receipts[0].gasUsed).toString(10)} of ${new ethereumjs_util_1.BN(tx.gasLimit).toString(10)}`);
        this._logger.logWithTitle(`Block #${new ethereumjs_util_1.BN(block.header.number).toString(10)}`, ethereumjs_util_1.bufferToHex(block.hash()));
    }
    _logConsoleLogMessages(messages) {
        // This is a especial case, as we always want to print the console.log
        // messages. The difference is how.
        // If we have a logger, we should use that, so that logs are printed in
        // order. If we don't, we just print the messages here.
        if (!this._logger.enabled) {
            for (const msg of messages) {
                console.log(msg);
            }
            return;
        }
        if (messages.length === 0) {
            return;
        }
        this._logger.log("");
        this._logger.log("console.log:");
        for (const msg of messages) {
            this._logger.log(`  ${msg}`);
        }
    }
    async _logCallTrace(callParams, trace) {
        if (trace !== undefined) {
            await this._logContractAndFunctionName(trace, true);
        }
        this._logFrom(callParams.from);
        this._logTo(callParams.to, trace);
        if (callParams.value.gtn(0)) {
            this._logValue(callParams.value);
        }
    }
    async _logContractAndFunctionName(trace, shouldBeContract) {
        if (message_trace_1.isPrecompileTrace(trace)) {
            this._logger.logWithTitle("Precompile call", `<PrecompileContract ${trace.precompile}>`);
            return;
        }
        if (message_trace_1.isCreateTrace(trace)) {
            if (trace.bytecode === undefined) {
                this._logger.logWithTitle("Contract deployment", solidity_stack_trace_1.UNRECOGNIZED_CONTRACT_NAME);
            }
            else {
                this._logger.logWithTitle("Contract deployment", trace.bytecode.contract.name);
            }
            if (trace.deployedContract !== undefined && trace.error === undefined) {
                this._logger.logWithTitle("Contract address", ethereumjs_util_1.bufferToHex(trace.deployedContract));
            }
            return;
        }
        const code = await this._node.getCode(trace.address, null);
        if (code.length === 0) {
            if (shouldBeContract) {
                this._logger.log(`WARNING: Calling an account which is not a contract`);
            }
            return;
        }
        if (trace.bytecode === undefined) {
            this._logger.logWithTitle("Contract call", solidity_stack_trace_1.UNRECOGNIZED_CONTRACT_NAME);
            return;
        }
        const func = trace.bytecode.contract.getFunctionFromSelector(trace.calldata.slice(0, 4));
        const functionName = func === undefined
            ? solidity_stack_trace_1.UNRECOGNIZED_FUNCTION_NAME
            : func.type === model_1.ContractFunctionType.FALLBACK
                ? solidity_stack_trace_1.FALLBACK_FUNCTION_NAME
                : func.type === model_1.ContractFunctionType.RECEIVE
                    ? solidity_stack_trace_1.RECEIVE_FUNCTION_NAME
                    : func.name;
        this._logger.logWithTitle("Contract call", `${trace.bytecode.contract.name}#${functionName}`);
    }
    _logValue(value) {
        this._logger.logWithTitle("Value", wei_values_1.weiToHumanReadableString(value));
    }
    _logError(error) {
        // TODO: We log an empty line here because this is only used when throwing
        //   errors is disabled. The empty line is normally printed by the provider
        //   when an exception is thrown. As we don't throw, we do it here.
        this._logger.log("");
        this._logger.log(util_1.default.inspect(error));
    }
    _logFrom(from) {
        this._logger.logWithTitle("From", ethereumjs_util_1.bufferToHex(from));
    }
    async _sendTransactionAndReturnHash(tx) {
        const { trace, block, blockResult, consoleLogMessages, error, } = await this._node.runTransactionInNewBlock(tx);
        await this._logTransactionTrace(tx, trace, block, blockResult);
        if (trace !== undefined) {
            await this._runHardhatNetworkMessageTraceHooks(trace, false);
        }
        this._logConsoleLogMessages(consoleLogMessages);
        if (error !== undefined) {
            if (this._throwOnTransactionFailures) {
                throw error;
            }
            // TODO: This is a little duplicated with the provider, it should be
            //  refactored away
            // TODO: This will log the error, but the RPC method won't be red
            this._logError(error);
        }
        return output_1.bufferToRpcData(tx.hash(true));
    }
    _logTo(to, trace) {
        if (trace !== undefined && message_trace_1.isCreateTrace(trace)) {
            return;
        }
        this._logger.logWithTitle("To", ethereumjs_util_1.bufferToHex(to));
    }
    async _runHardhatNetworkMessageTraceHooks(trace, isCall) {
        for (const hook of this._experimentalHardhatNetworkMessageTraceHooks) {
            await hook(trace, isCall);
        }
    }
}
exports.EthModule = EthModule;
//# sourceMappingURL=eth.js.map