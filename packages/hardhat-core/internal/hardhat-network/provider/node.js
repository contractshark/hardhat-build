"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardhatNode = exports.COINBASE_ADDRESS = void 0;
const ethereumjs_vm_1 = __importDefault(require("@nomiclabs/ethereumjs-vm"));
const bloom_1 = __importDefault(require("@nomiclabs/ethereumjs-vm/dist/bloom"));
const exceptions_1 = require("@nomiclabs/ethereumjs-vm/dist/exceptions");
const state_1 = require("@nomiclabs/ethereumjs-vm/dist/state");
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const events_1 = __importDefault(require("events"));
const default_config_1 = require("../../core/config/default-config");
const errors_1 = require("../../core/errors");
const reporter_1 = require("../../sentry/reporter");
const date_1 = require("../../util/date");
const compiler_to_model_1 = require("../stack-traces/compiler-to-model");
const consoleLogger_1 = require("../stack-traces/consoleLogger");
const contracts_identifier_1 = require("../stack-traces/contracts-identifier");
const revert_reasons_1 = require("../stack-traces/revert-reasons");
const solidity_errors_1 = require("../stack-traces/solidity-errors");
const solidity_stack_trace_1 = require("../stack-traces/solidity-stack-trace");
const solidityTracer_1 = require("../stack-traces/solidityTracer");
const vm_trace_decoder_1 = require("../stack-traces/vm-trace-decoder");
const vm_tracer_1 = require("../stack-traces/vm-tracer");
const errors_2 = require("./errors");
const filter_1 = require("./filter");
const ForkBlockchain_1 = require("./fork/ForkBlockchain");
const ForkStateManager_1 = require("./fork/ForkStateManager");
const HardhatBlockchain_1 = require("./HardhatBlockchain");
const output_1 = require("./output");
const Block_1 = require("./types/Block");
const asPStateManager_1 = require("./utils/asPStateManager");
const asStateManager_1 = require("./utils/asStateManager");
const getCurrentTimestamp_1 = require("./utils/getCurrentTimestamp");
const makeCommon_1 = require("./utils/makeCommon");
const makeForkClient_1 = require("./utils/makeForkClient");
const makeForkCommon_1 = require("./utils/makeForkCommon");
const makeStateTrie_1 = require("./utils/makeStateTrie");
const putGenesisBlock_1 = require("./utils/putGenesisBlock");
const log = debug_1.default("hardhat:core:hardhat-network:node");
// This library's types are wrong, they don't type check
// tslint:disable-next-line no-var-requires
const ethSigUtil = require("eth-sig-util");
exports.COINBASE_ADDRESS = ethereumjs_util_1.toBuffer("0xc014ba5ec014ba5ec014ba5ec014ba5ec014ba5e");
// tslint:disable only-hardhat-error
class HardhatNode extends events_1.default {
    constructor(_vm, _stateManager, _blockchain, _blockGasLimit, _blockTimeOffsetSeconds = new ethereumjs_util_1.BN(0), genesisAccounts, tracingConfig) {
        super();
        this._vm = _vm;
        this._stateManager = _stateManager;
        this._blockchain = _blockchain;
        this._blockGasLimit = _blockGasLimit;
        this._blockTimeOffsetSeconds = _blockTimeOffsetSeconds;
        this._localAccounts = new Map(); // address => private key
        this._impersonatedAccounts = new Set(); // address
        this._nextBlockTimestamp = new ethereumjs_util_1.BN(0);
        this._lastFilterId = new ethereumjs_util_1.BN(0);
        this._filters = new Map();
        this._nextSnapshotId = 1; // We start in 1 to mimic Ganache
        this._snapshots = [];
        this._consoleLogger = new consoleLogger_1.ConsoleLogger();
        this._failedStackTraces = 0;
        this._initLocalAccounts(genesisAccounts);
        this._vmTracer = new vm_tracer_1.VMTracer(this._vm, this._stateManager.getContractCode.bind(this._stateManager), true);
        this._vmTracer.enableTracing();
        const contractsIdentifier = new contracts_identifier_1.ContractsIdentifier();
        this._vmTraceDecoder = new vm_trace_decoder_1.VmTraceDecoder(contractsIdentifier);
        this._solidityTracer = new solidityTracer_1.SolidityTracer();
        if (tracingConfig === undefined || tracingConfig.buildInfos === undefined) {
            return;
        }
        try {
            for (const buildInfo of tracingConfig.buildInfos) {
                const bytecodes = compiler_to_model_1.createModelsAndDecodeBytecodes(buildInfo.solcVersion, buildInfo.input, buildInfo.output);
                for (const bytecode of bytecodes) {
                    this._vmTraceDecoder.addBytecode(bytecode);
                }
            }
        }
        catch (error) {
            console.warn(chalk_1.default.yellow("The Hardhat Network tracing engine could not be initialized. Run Hardhat with --verbose to learn more."));
            log("Hardhat Network tracing disabled: ContractsIdentifier failed to be initialized. Please report this to help us improve Hardhat.\n", error);
            reporter_1.Reporter.reportError(error);
        }
    }
    static async create(config) {
        const { genesisAccounts, blockGasLimit, allowUnlimitedContractSize, tracingConfig, } = config;
        let common;
        let stateManager;
        let blockchain;
        let initialBlockTimeOffset;
        if ("forkConfig" in config) {
            const { forkClient, forkBlockNumber, forkBlockTimestamp, } = await makeForkClient_1.makeForkClient(config.forkConfig, config.forkCachePath);
            common = await makeForkCommon_1.makeForkCommon(config);
            stateManager = new ForkStateManager_1.ForkStateManager(forkClient, forkBlockNumber, genesisAccounts);
            await stateManager.initializeGenesisAccounts(genesisAccounts);
            blockchain = new ForkBlockchain_1.ForkBlockchain(forkClient, forkBlockNumber, common);
            initialBlockTimeOffset = new ethereumjs_util_1.BN(date_1.getDifferenceInSeconds(new Date(forkBlockTimestamp), new Date()));
        }
        else {
            const stateTrie = await makeStateTrie_1.makeStateTrie(genesisAccounts);
            common = makeCommon_1.makeCommon(config, stateTrie);
            stateManager = new state_1.StateManager({
                common,
                trie: stateTrie,
            });
            blockchain = new HardhatBlockchain_1.HardhatBlockchain();
            await putGenesisBlock_1.putGenesisBlock(blockchain, common);
            if (config.initialDate !== undefined) {
                initialBlockTimeOffset = new ethereumjs_util_1.BN(date_1.getDifferenceInSeconds(config.initialDate, new Date()));
            }
        }
        const vm = new ethereumjs_vm_1.default({
            common,
            activatePrecompiles: true,
            stateManager: asStateManager_1.asStateManager(stateManager),
            blockchain: blockchain.asBlockchain(),
            allowUnlimitedContractSize,
        });
        const node = new HardhatNode(vm, asPStateManager_1.asPStateManager(stateManager), blockchain, new ethereumjs_util_1.BN(blockGasLimit), initialBlockTimeOffset, genesisAccounts, tracingConfig);
        return [common, node];
    }
    async getSignedTransaction(txParams) {
        const senderAddress = ethereumjs_util_1.bufferToHex(txParams.from);
        const pk = this._localAccounts.get(senderAddress);
        if (pk !== undefined) {
            const tx = new ethereumjs_tx_1.Transaction(txParams, { common: this._vm._common });
            tx.sign(pk);
            return tx;
        }
        if (this._impersonatedAccounts.has(senderAddress)) {
            return new ethereumjs_tx_1.FakeTransaction(txParams, { common: this._vm._common });
        }
        throw new errors_2.InvalidInputError(`unknown account ${senderAddress}`);
    }
    async _getFakeTransaction(txParams) {
        return new ethereumjs_tx_1.FakeTransaction(txParams, { common: this._vm._common });
    }
    async runTransactionInNewBlock(tx) {
        await this._validateTransaction(tx);
        await this._notifyPendingTransaction(tx);
        const [blockTimestamp, offsetShouldChange, newOffset,] = this._calculateTimestampAndOffset();
        const block = await this._getNextBlockTemplate(blockTimestamp);
        const needsTimestampIncrease = await this._timestampClashesWithPreviousBlockOne(block);
        if (needsTimestampIncrease) {
            await this._increaseBlockTimestamp(block);
        }
        await this._addTransactionToBlock(block, tx);
        const result = await this._vm.runBlock({
            block,
            generate: true,
            skipBlockValidation: true,
        });
        if (needsTimestampIncrease) {
            await this.increaseTime(new ethereumjs_util_1.BN(1));
        }
        await this._saveBlockAsSuccessfullyRun(block, result);
        let vmTrace = this._vmTracer.getLastTopLevelMessageTrace();
        const vmTracerError = this._vmTracer.getLastError();
        this._vmTracer.clearLastError();
        if (vmTrace !== undefined) {
            vmTrace = this._vmTraceDecoder.tryToDecodeMessageTrace(vmTrace);
        }
        const consoleLogMessages = await this._getConsoleLogMessages(vmTrace, vmTracerError);
        const error = await this._manageErrors(result.results[0].execResult, vmTrace, vmTracerError);
        if (offsetShouldChange) {
            await this.increaseTime(newOffset.sub(await this.getTimeIncrement()));
        }
        await this._resetNextBlockTimestamp();
        return {
            trace: vmTrace,
            block,
            blockResult: result,
            error,
            consoleLogMessages,
        };
    }
    async mineEmptyBlock(timestamp) {
        // need to check if timestamp is specified or nextBlockTimestamp is set
        // if it is, time offset must be set to timestamp|nextBlockTimestamp - Date.now
        // if it is not, time offset remain the same
        const [blockTimestamp, offsetShouldChange, newOffset,] = this._calculateTimestampAndOffset(timestamp);
        const block = await this._getNextBlockTemplate(blockTimestamp);
        const needsTimestampIncrease = await this._timestampClashesWithPreviousBlockOne(block);
        if (needsTimestampIncrease) {
            await this._increaseBlockTimestamp(block);
        }
        await new Promise((resolve) => block.genTxTrie(resolve));
        block.header.transactionsTrie = block.txTrie.root;
        const previousRoot = await this._stateManager.getStateRoot();
        let result;
        try {
            result = await this._vm.runBlock({
                block,
                generate: true,
                skipBlockValidation: true,
            });
            if (needsTimestampIncrease) {
                await this.increaseTime(new ethereumjs_util_1.BN(1));
            }
            await this._saveBlockAsSuccessfullyRun(block, result);
            if (offsetShouldChange) {
                await this.increaseTime(newOffset.sub(await this.getTimeIncrement()));
            }
            await this._resetNextBlockTimestamp();
            return result;
        }
        catch (error) {
            // We set the state root to the previous one. This is equivalent to a
            // rollback of this block.
            await this._stateManager.setStateRoot(previousRoot);
            throw new errors_2.TransactionExecutionError(error);
        }
    }
    async runCall(call, blockNumber) {
        const tx = await this._getFakeTransaction(Object.assign(Object.assign({}, call), { nonce: await this.getAccountNonce(call.from, null) }));
        const result = await this._runInBlockContext(blockNumber, () => this._runTxAndRevertMutations(tx, blockNumber !== null && blockNumber !== void 0 ? blockNumber : undefined, true));
        let vmTrace = this._vmTracer.getLastTopLevelMessageTrace();
        const vmTracerError = this._vmTracer.getLastError();
        this._vmTracer.clearLastError();
        if (vmTrace !== undefined) {
            vmTrace = this._vmTraceDecoder.tryToDecodeMessageTrace(vmTrace);
        }
        const consoleLogMessages = await this._getConsoleLogMessages(vmTrace, vmTracerError);
        const error = await this._manageErrors(result.execResult, vmTrace, vmTracerError);
        return {
            result: result.execResult.returnValue,
            trace: vmTrace,
            error,
            consoleLogMessages,
        };
    }
    async getAccountBalance(address, blockNumber) {
        const account = await this._runInBlockContext(blockNumber, () => this._stateManager.getAccount(address));
        return new ethereumjs_util_1.BN(account.balance);
    }
    async getAccountNonce(address, blockNumber) {
        const account = await this._runInBlockContext(blockNumber, () => this._stateManager.getAccount(address));
        return new ethereumjs_util_1.BN(account.nonce);
    }
    async getLatestBlock() {
        return this._blockchain.getLatestBlock();
    }
    async getLatestBlockNumber() {
        return new ethereumjs_util_1.BN((await this.getLatestBlock()).header.number);
    }
    async getLocalAccountAddresses() {
        return [...this._localAccounts.keys()];
    }
    async getBlockGasLimit() {
        return this._blockGasLimit;
    }
    async estimateGas(txParams, blockNumber) {
        const tx = await this._getFakeTransaction(Object.assign(Object.assign({}, txParams), { gasLimit: await this.getBlockGasLimit() }));
        const result = await this._runInBlockContext(blockNumber, () => this._runTxAndRevertMutations(tx));
        let vmTrace = this._vmTracer.getLastTopLevelMessageTrace();
        const vmTracerError = this._vmTracer.getLastError();
        this._vmTracer.clearLastError();
        if (vmTrace !== undefined) {
            vmTrace = this._vmTraceDecoder.tryToDecodeMessageTrace(vmTrace);
        }
        const consoleLogMessages = await this._getConsoleLogMessages(vmTrace, vmTracerError);
        // This is only considered if the call to _runTxAndRevertMutations doesn't
        // manage errors
        if (result.execResult.exceptionError !== undefined) {
            return {
                estimation: await this.getBlockGasLimit(),
                trace: vmTrace,
                error: await this._manageErrors(result.execResult, vmTrace, vmTracerError),
                consoleLogMessages,
            };
        }
        const initialEstimation = result.gasUsed;
        return {
            estimation: await this._correctInitialEstimation(txParams, initialEstimation),
            trace: vmTrace,
            consoleLogMessages,
        };
    }
    async getGasPrice() {
        return new ethereumjs_util_1.BN(default_config_1.HARDHAT_NETWORK_DEFAULT_GAS_PRICE);
    }
    async getCoinbaseAddress() {
        return exports.COINBASE_ADDRESS;
    }
    async getStorageAt(address, slot, blockNumber) {
        const key = slot.toArrayLike(Buffer, "be", 32);
        const data = await this._runInBlockContext(blockNumber, () => this._stateManager.getContractStorage(address, key));
        const EXPECTED_DATA_SIZE = 32;
        if (data.length < EXPECTED_DATA_SIZE) {
            return Buffer.concat([Buffer.alloc(EXPECTED_DATA_SIZE - data.length, 0), data], EXPECTED_DATA_SIZE);
        }
        return data;
    }
    async getBlockByNumber(blockNumber) {
        return this._blockchain.getBlock(blockNumber);
    }
    async getBlockByHash(blockHash) {
        return this._blockchain.getBlock(blockHash);
    }
    async getBlockByTransactionHash(hash) {
        return this._blockchain.getBlockByTransactionHash(hash);
    }
    async getBlockTotalDifficulty(block) {
        return this._blockchain.getTotalDifficulty(block.hash());
    }
    async getCode(address, blockNumber) {
        return this._runInBlockContext(blockNumber, () => this._stateManager.getContractCode(address));
    }
    async setNextBlockTimestamp(timestamp) {
        this._nextBlockTimestamp = new ethereumjs_util_1.BN(timestamp);
    }
    async increaseTime(increment) {
        this._blockTimeOffsetSeconds = this._blockTimeOffsetSeconds.add(increment);
    }
    async getTimeIncrement() {
        return this._blockTimeOffsetSeconds;
    }
    async getNextBlockTimestamp() {
        return this._nextBlockTimestamp;
    }
    async getTransaction(hash) {
        return this._blockchain.getTransaction(hash);
    }
    async getTransactionReceipt(hash) {
        return this._blockchain.getTransactionReceipt(hash);
    }
    async getPendingTransactions() {
        return [];
    }
    async signPersonalMessage(address, data) {
        const messageHash = ethereumjs_util_1.hashPersonalMessage(data);
        const privateKey = this._getLocalAccountPrivateKey(address);
        return ethereumjs_util_1.ecsign(messageHash, privateKey);
    }
    async signTypedDataV4(address, typedData) {
        const privateKey = this._getLocalAccountPrivateKey(address);
        return ethSigUtil.signTypedData_v4(privateKey, {
            data: typedData,
        });
    }
    async getStackTraceFailuresCount() {
        return this._failedStackTraces;
    }
    async takeSnapshot() {
        const id = this._nextSnapshotId;
        // We copy all the maps here, as they may be modified
        const snapshot = {
            id,
            date: new Date(),
            latestBlock: await this.getLatestBlock(),
            stateRoot: await this._stateManager.getStateRoot(),
            blockTimeOffsetSeconds: new ethereumjs_util_1.BN(this._blockTimeOffsetSeconds),
            nextBlockTimestamp: new ethereumjs_util_1.BN(this._nextBlockTimestamp),
        };
        this._snapshots.push(snapshot);
        this._nextSnapshotId += 1;
        return id;
    }
    async revertToSnapshot(id) {
        const snapshotIndex = this._getSnapshotIndex(id);
        if (snapshotIndex === undefined) {
            return false;
        }
        const snapshot = this._snapshots[snapshotIndex];
        // We compute a new offset such that
        //  now + new_offset === snapshot_date + old_offset
        const now = new Date();
        const offsetToSnapshotInMillis = snapshot.date.valueOf() - now.valueOf();
        const offsetToSnapshotInSecs = Math.ceil(offsetToSnapshotInMillis / 1000);
        const newOffset = snapshot.blockTimeOffsetSeconds.addn(offsetToSnapshotInSecs);
        // We delete all following blocks, changes the state root, and all the
        // relevant Node fields.
        //
        // Note: There's no need to copy the maps here, as snapshots can only be
        // used once
        this._blockchain.deleteLaterBlocks(snapshot.latestBlock);
        await this._stateManager.setStateRoot(snapshot.stateRoot);
        this._blockTimeOffsetSeconds = newOffset;
        this._nextBlockTimestamp = snapshot.nextBlockTimestamp;
        // We delete this and the following snapshots, as they can only be used
        // once in Ganache
        this._snapshots.splice(snapshotIndex);
        return true;
    }
    async newFilter(filterParams, isSubscription) {
        filterParams = await this._computeFilterParams(filterParams, true);
        const filterId = this._getNextFilterId();
        this._filters.set(this._filterIdToFiltersKey(filterId), {
            id: filterId,
            type: filter_1.Type.LOGS_SUBSCRIPTION,
            criteria: {
                fromBlock: filterParams.fromBlock,
                toBlock: filterParams.toBlock,
                addresses: filterParams.addresses,
                normalizedTopics: filterParams.normalizedTopics,
            },
            deadline: this._newDeadline(),
            hashes: [],
            logs: await this.getLogs(filterParams),
            subscription: isSubscription,
        });
        return filterId;
    }
    async newBlockFilter(isSubscription) {
        const block = await this.getLatestBlock();
        const filterId = this._getNextFilterId();
        this._filters.set(this._filterIdToFiltersKey(filterId), {
            id: filterId,
            type: filter_1.Type.BLOCK_SUBSCRIPTION,
            deadline: this._newDeadline(),
            hashes: [ethereumjs_util_1.bufferToHex(block.header.hash())],
            logs: [],
            subscription: isSubscription,
        });
        return filterId;
    }
    async newPendingTransactionFilter(isSubscription) {
        const filterId = this._getNextFilterId();
        this._filters.set(this._filterIdToFiltersKey(filterId), {
            id: filterId,
            type: filter_1.Type.PENDING_TRANSACTION_SUBSCRIPTION,
            deadline: this._newDeadline(),
            hashes: [],
            logs: [],
            subscription: isSubscription,
        });
        return filterId;
    }
    async uninstallFilter(filterId, subscription) {
        const key = this._filterIdToFiltersKey(filterId);
        const filter = this._filters.get(key);
        if (filter === undefined) {
            return false;
        }
        if ((filter.subscription && !subscription) ||
            (!filter.subscription && subscription)) {
            return false;
        }
        this._filters.delete(key);
        return true;
    }
    async getFilterChanges(filterId) {
        const key = this._filterIdToFiltersKey(filterId);
        const filter = this._filters.get(key);
        if (filter === undefined) {
            return undefined;
        }
        filter.deadline = this._newDeadline();
        switch (filter.type) {
            case filter_1.Type.BLOCK_SUBSCRIPTION:
            case filter_1.Type.PENDING_TRANSACTION_SUBSCRIPTION:
                const hashes = filter.hashes;
                filter.hashes = [];
                return hashes;
            case filter_1.Type.LOGS_SUBSCRIPTION:
                const logs = filter.logs;
                filter.logs = [];
                return logs;
        }
        return undefined;
    }
    async getFilterLogs(filterId) {
        const key = this._filterIdToFiltersKey(filterId);
        const filter = this._filters.get(key);
        if (filter === undefined) {
            return undefined;
        }
        const logs = filter.logs;
        filter.logs = [];
        filter.deadline = this._newDeadline();
        return logs;
    }
    async getLogs(filterParams) {
        filterParams = await this._computeFilterParams(filterParams, false);
        return this._blockchain.getLogs(filterParams);
    }
    async addCompilationResult(solcVersion, compilerInput, compilerOutput) {
        let bytecodes;
        try {
            bytecodes = compiler_to_model_1.createModelsAndDecodeBytecodes(solcVersion, compilerInput, compilerOutput);
        }
        catch (error) {
            console.warn(chalk_1.default.yellow("The Hardhat Network tracing engine could not be updated. Run Hardhat with --verbose to learn more."));
            log("ContractsIdentifier failed to be updated. Please report this to help us improve Hardhat.\n", error);
            return false;
        }
        for (const bytecode of bytecodes) {
            this._vmTraceDecoder.addBytecode(bytecode);
        }
        return true;
    }
    addImpersonatedAccount(address) {
        this._impersonatedAccounts.add(ethereumjs_util_1.bufferToHex(address));
        return true;
    }
    removeImpersonatedAccount(address) {
        return this._impersonatedAccounts.delete(ethereumjs_util_1.bufferToHex(address));
    }
    _getSnapshotIndex(id) {
        for (const [i, snapshot] of this._snapshots.entries()) {
            if (snapshot.id === id) {
                return i;
            }
            // We already removed the snapshot we are looking for
            if (snapshot.id > id) {
                return undefined;
            }
        }
        return undefined;
    }
    _initLocalAccounts(genesisAccounts) {
        const privateKeys = genesisAccounts.map((acc) => ethereumjs_util_1.toBuffer(acc.privateKey));
        for (const pk of privateKeys) {
            this._localAccounts.set(ethereumjs_util_1.bufferToHex(ethereumjs_util_1.privateToAddress(pk)), pk);
        }
    }
    async _getConsoleLogMessages(vmTrace, vmTracerError) {
        if (vmTrace === undefined || vmTracerError !== undefined) {
            log("Could not print console log. Please report this to help us improve Hardhat.\n", vmTracerError);
            return [];
        }
        return this._consoleLogger.getLogMessages(vmTrace);
    }
    async _manageErrors(vmResult, vmTrace, vmTracerError) {
        if (vmResult.exceptionError === undefined) {
            return undefined;
        }
        let stackTrace;
        try {
            if (vmTrace === undefined || vmTracerError !== undefined) {
                throw vmTracerError;
            }
            stackTrace = this._solidityTracer.getStackTrace(vmTrace);
        }
        catch (error) {
            this._failedStackTraces += 1;
            log("Could not generate stack trace. Please report this to help us improve Hardhat.\n", error);
        }
        const error = vmResult.exceptionError;
        // If this is an internal VM error, or a different kind of error was
        // thrown, we just rethrow. An example of a non-VmError being thrown here
        // is an HTTP error coming from the ForkedStateManager.
        if (!(error instanceof exceptions_1.VmError) || error.error === exceptions_1.ERROR.INTERNAL_ERROR) {
            throw error;
        }
        if (error.error === exceptions_1.ERROR.OUT_OF_GAS) {
            if (this._isContractTooLargeStackTrace(stackTrace)) {
                return solidity_errors_1.encodeSolidityStackTrace("Transaction run out of gas", stackTrace);
            }
            return new errors_2.TransactionExecutionError("Transaction run out of gas");
        }
        if (error.error === exceptions_1.ERROR.REVERT) {
            if (vmResult.returnValue.length === 0) {
                if (stackTrace !== undefined) {
                    return solidity_errors_1.encodeSolidityStackTrace("Transaction reverted without a reason", stackTrace);
                }
                return new errors_2.TransactionExecutionError("Transaction reverted without a reason");
            }
            if (stackTrace !== undefined) {
                return solidity_errors_1.encodeSolidityStackTrace(`VM Exception while processing transaction: revert ${revert_reasons_1.decodeRevertReason(vmResult.returnValue)}`, stackTrace);
            }
            return new errors_2.TransactionExecutionError(`VM Exception while processing transaction: revert ${revert_reasons_1.decodeRevertReason(vmResult.returnValue)}`);
        }
        if (stackTrace !== undefined) {
            return solidity_errors_1.encodeSolidityStackTrace("Transaction failed: revert", stackTrace);
        }
        return new errors_2.TransactionExecutionError("Transaction failed: revert");
    }
    _isContractTooLargeStackTrace(stackTrace) {
        return (stackTrace !== undefined &&
            stackTrace.length > 0 &&
            stackTrace[stackTrace.length - 1].type ===
                solidity_stack_trace_1.StackTraceEntryType.CONTRACT_TOO_LARGE_ERROR);
    }
    _calculateTimestampAndOffset(timestamp) {
        let blockTimestamp;
        let offsetShouldChange;
        let newOffset = new ethereumjs_util_1.BN(0);
        // if timestamp is not provided, we check nextBlockTimestamp, if it is
        // set, we use it as the timestamp instead. If it is not set, we use
        // time offset + real time as the timestamp.
        if (timestamp === undefined || timestamp.eq(new ethereumjs_util_1.BN(0))) {
            if (this._nextBlockTimestamp.eq(new ethereumjs_util_1.BN(0))) {
                blockTimestamp = new ethereumjs_util_1.BN(getCurrentTimestamp_1.getCurrentTimestamp()).add(this._blockTimeOffsetSeconds);
                offsetShouldChange = false;
            }
            else {
                blockTimestamp = new ethereumjs_util_1.BN(this._nextBlockTimestamp);
                offsetShouldChange = true;
            }
        }
        else {
            offsetShouldChange = true;
            blockTimestamp = timestamp;
        }
        if (offsetShouldChange) {
            newOffset = blockTimestamp.sub(new ethereumjs_util_1.BN(getCurrentTimestamp_1.getCurrentTimestamp()));
        }
        return [blockTimestamp, offsetShouldChange, newOffset];
    }
    async _getNextBlockTemplate(timestamp) {
        const block = new Block_1.Block({
            header: {
                gasLimit: this._blockGasLimit,
                nonce: "0x42",
                timestamp,
            },
        }, { common: this._vm._common });
        block.validate = (blockchain, cb) => cb(null);
        const latestBlock = await this.getLatestBlock();
        block.header.number = ethereumjs_util_1.toBuffer(new ethereumjs_util_1.BN(latestBlock.header.number).addn(1));
        block.header.parentHash = latestBlock.hash();
        block.header.difficulty = block.header
            .canonicalDifficulty(latestBlock)
            .toBuffer();
        block.header.coinbase = await this.getCoinbaseAddress();
        return block;
    }
    async _resetNextBlockTimestamp() {
        this._nextBlockTimestamp = new ethereumjs_util_1.BN(0);
    }
    async _notifyPendingTransaction(tx) {
        this._filters.forEach((filter) => {
            if (filter.type === filter_1.Type.PENDING_TRANSACTION_SUBSCRIPTION) {
                const hash = ethereumjs_util_1.bufferToHex(tx.hash(true));
                if (filter.subscription) {
                    this._emitEthEvent(filter.id, hash);
                    return;
                }
                filter.hashes.push(hash);
            }
        });
    }
    _getLocalAccountPrivateKey(sender) {
        const senderAddress = ethereumjs_util_1.bufferToHex(sender);
        if (!this._localAccounts.has(senderAddress)) {
            throw new errors_2.InvalidInputError(`unknown account ${senderAddress}`);
        }
        return this._localAccounts.get(senderAddress);
    }
    async _addTransactionToBlock(block, tx) {
        block.transactions.push(tx);
        await new Promise((resolve) => block.genTxTrie(resolve));
        block.header.transactionsTrie = block.txTrie.root;
    }
    async _saveBlockAsSuccessfullyRun(block, runBlockResult) {
        const receipts = output_1.getRpcReceipts(block, runBlockResult);
        await this._blockchain.addBlock(block);
        this._blockchain.addTransactionReceipts(receipts);
        const td = await this.getBlockTotalDifficulty(block);
        const rpcLogs = [];
        for (const receipt of receipts) {
            rpcLogs.push(...receipt.logs);
        }
        this._filters.forEach((filter, key) => {
            if (filter.deadline.valueOf() < new Date().valueOf()) {
                this._filters.delete(key);
            }
            switch (filter.type) {
                case filter_1.Type.BLOCK_SUBSCRIPTION:
                    const hash = block.hash();
                    if (filter.subscription) {
                        this._emitEthEvent(filter.id, output_1.getRpcBlock(block, td, false));
                        return;
                    }
                    filter.hashes.push(ethereumjs_util_1.bufferToHex(hash));
                    break;
                case filter_1.Type.LOGS_SUBSCRIPTION:
                    if (filter_1.bloomFilter(new bloom_1.default(block.header.bloom), filter.criteria.addresses, filter.criteria.normalizedTopics)) {
                        const logs = filter_1.filterLogs(rpcLogs, filter.criteria);
                        if (logs.length === 0) {
                            return;
                        }
                        if (filter.subscription) {
                            logs.forEach((rpcLog) => {
                                this._emitEthEvent(filter.id, rpcLog);
                            });
                            return;
                        }
                        filter.logs.push(...logs);
                    }
                    break;
            }
        });
    }
    _transactionWasSuccessful(tx) {
        const localTransaction = this._blockchain.getLocalTransaction(tx.hash());
        return localTransaction !== undefined;
    }
    async _timestampClashesWithPreviousBlockOne(block) {
        const blockTimestamp = new ethereumjs_util_1.BN(block.header.timestamp);
        const latestBlock = await this.getLatestBlock();
        const latestBlockTimestamp = new ethereumjs_util_1.BN(latestBlock.header.timestamp);
        return latestBlockTimestamp.eq(blockTimestamp);
    }
    async _increaseBlockTimestamp(block) {
        block.header.timestamp = new ethereumjs_util_1.BN(block.header.timestamp).addn(1).toBuffer();
    }
    async _validateTransaction(tx) {
        // Geth throws this error if a tx is sent twice
        if (this._transactionWasSuccessful(tx)) {
            throw new errors_2.InvalidInputError(`known transaction: ${ethereumjs_util_1.bufferToHex(tx.hash(true)).toString()}`);
        }
        if (!tx.verifySignature()) {
            throw new errors_2.InvalidInputError("Invalid transaction signature");
        }
        // Geth returns this error if trying to create a contract and no data is provided
        if (tx.to.length === 0 && tx.data.length === 0) {
            throw new errors_2.InvalidInputError("contract creation without any data provided");
        }
        const expectedNonce = await this.getAccountNonce(tx.getSenderAddress(), null);
        const actualNonce = new ethereumjs_util_1.BN(tx.nonce);
        if (!expectedNonce.eq(actualNonce)) {
            throw new errors_2.InvalidInputError(`Invalid nonce. Expected ${expectedNonce} but got ${actualNonce}.

If you are running a script or test, you may be sending transactions in parallel.
Using JavaScript? You probably forgot an await.

If you are using a wallet or dapp, try resetting your wallet's accounts.`);
        }
        const baseFee = tx.getBaseFee();
        const gasLimit = new ethereumjs_util_1.BN(tx.gasLimit);
        if (baseFee.gt(gasLimit)) {
            throw new errors_2.InvalidInputError(`Transaction requires at least ${baseFee} gas but got ${gasLimit}`);
        }
        if (gasLimit.gt(this._blockGasLimit)) {
            throw new errors_2.InvalidInputError(`Transaction gas limit is ${gasLimit} and exceeds block gas limit of ${this._blockGasLimit}`);
        }
    }
    async _runInBlockContext(blockNumber, action) {
        if (blockNumber === null ||
            blockNumber.eq(await this.getLatestBlockNumber())) {
            return action();
        }
        const block = await this.getBlockByNumber(blockNumber);
        if (block === undefined) {
            // TODO handle this better
            throw new Error(`Block with number ${blockNumber} doesn't exist. This should never happen.`);
        }
        const currentStateRoot = await this._stateManager.getStateRoot();
        await this._setBlockContext(block);
        try {
            return await action();
        }
        finally {
            await this._restoreBlockContext(currentStateRoot);
        }
    }
    async _setBlockContext(block) {
        if (this._stateManager instanceof ForkStateManager_1.ForkStateManager) {
            return this._stateManager.setBlockContext(block.header.stateRoot, new ethereumjs_util_1.BN(block.header.number));
        }
        return this._stateManager.setStateRoot(block.header.stateRoot);
    }
    async _restoreBlockContext(stateRoot) {
        if (this._stateManager instanceof ForkStateManager_1.ForkStateManager) {
            return this._stateManager.restoreForkBlockContext(stateRoot);
        }
        return this._stateManager.setStateRoot(stateRoot);
    }
    async _correctInitialEstimation(txParams, initialEstimation) {
        let tx = await this._getFakeTransaction(Object.assign(Object.assign({}, txParams), { gasLimit: initialEstimation }));
        if (tx.getBaseFee().gte(initialEstimation)) {
            initialEstimation = tx.getBaseFee().addn(1);
            tx = await this._getFakeTransaction(Object.assign(Object.assign({}, txParams), { gasLimit: initialEstimation }));
        }
        const result = await this._runTxAndRevertMutations(tx);
        if (result.execResult.exceptionError === undefined) {
            return initialEstimation;
        }
        return this._binarySearchEstimation(txParams, initialEstimation, await this.getBlockGasLimit());
    }
    async _binarySearchEstimation(txParams, highestFailingEstimation, lowestSuccessfulEstimation, roundNumber = 0) {
        if (lowestSuccessfulEstimation.lte(highestFailingEstimation)) {
            // This shouldn't happen, but we don't want to go into an infinite loop
            // if it ever happens
            return lowestSuccessfulEstimation;
        }
        const MAX_GAS_ESTIMATION_IMPROVEMENT_ROUNDS = 20;
        const diff = lowestSuccessfulEstimation.sub(highestFailingEstimation);
        const minDiff = highestFailingEstimation.gten(4000000)
            ? 50000
            : highestFailingEstimation.gten(1000000)
                ? 10000
                : highestFailingEstimation.gten(100000)
                    ? 1000
                    : highestFailingEstimation.gten(50000)
                        ? 500
                        : highestFailingEstimation.gten(30000)
                            ? 300
                            : 200;
        if (diff.lten(minDiff)) {
            return lowestSuccessfulEstimation;
        }
        if (roundNumber > MAX_GAS_ESTIMATION_IMPROVEMENT_ROUNDS) {
            return lowestSuccessfulEstimation;
        }
        const binSearchNewEstimation = highestFailingEstimation.add(diff.divn(2));
        const optimizedEstimation = roundNumber === 0
            ? highestFailingEstimation.muln(3)
            : binSearchNewEstimation;
        const newEstimation = optimizedEstimation.gt(binSearchNewEstimation)
            ? binSearchNewEstimation
            : optimizedEstimation;
        // Let other things execute
        await new Promise((resolve) => setImmediate(resolve));
        const tx = await this._getFakeTransaction(Object.assign(Object.assign({}, txParams), { gasLimit: newEstimation }));
        const result = await this._runTxAndRevertMutations(tx);
        if (result.execResult.exceptionError === undefined) {
            return this._binarySearchEstimation(txParams, highestFailingEstimation, newEstimation, roundNumber + 1);
        }
        return this._binarySearchEstimation(txParams, newEstimation, lowestSuccessfulEstimation, roundNumber + 1);
    }
    /**
     * This function runs a transaction and reverts all the modifications that it
     * makes.
     */
    async _runTxAndRevertMutations(tx, blockNumber, 
    // See: https://github.com/ethereumjs/ethereumjs-vm/issues/1014
    workaroundEthCallGasLimitIssue = false) {
        const initialStateRoot = await this._stateManager.getStateRoot();
        let blockContext;
        let previousGasLimit;
        try {
            // if the context is to estimate gas or run calls in pending block
            if (blockNumber === undefined) {
                const [blockTimestamp] = this._calculateTimestampAndOffset();
                blockContext = await this._getNextBlockTemplate(blockTimestamp);
                const needsTimestampIncrease = await this._timestampClashesWithPreviousBlockOne(blockContext);
                if (needsTimestampIncrease) {
                    await this._increaseBlockTimestamp(blockContext);
                }
                // in the context of running estimateGas call, we have to do binary
                // search for the gas and run the call multiple times. Since it is
                // an approximate approach to calculate the gas, it is important to
                // run the call in a block that is as close to the real one as
                // possible, hence putting the tx to the block is good to have here.
                await this._addTransactionToBlock(blockContext, tx);
            }
            else {
                // if the context is to run calls with a block
                // We know that this block number exists, because otherwise
                // there would be an error in the RPC layer.
                const block = await this.getBlockByNumber(blockNumber);
                errors_1.assertHardhatInvariant(block !== undefined, "Tried to run a tx in the context of a non-existent block");
                blockContext = block;
            }
            if (workaroundEthCallGasLimitIssue) {
                const txGasLimit = new ethereumjs_util_1.BN(tx.gasLimit);
                const blockGasLimit = new ethereumjs_util_1.BN(blockContext.header.gasLimit);
                if (txGasLimit.gt(blockGasLimit)) {
                    previousGasLimit = blockContext.header.gasLimit;
                    blockContext.header.gasLimit = tx.gasLimit;
                }
            }
            return await this._vm.runTx({
                block: blockContext,
                tx,
                skipNonce: true,
                skipBalance: true,
            });
        }
        finally {
            // If we changed the block's gas limit of an already existing block,
            // we restore it here.
            if (blockContext !== undefined &&
                workaroundEthCallGasLimitIssue &&
                previousGasLimit !== undefined &&
                blockNumber !== undefined) {
                blockContext.header.gasLimit = previousGasLimit;
            }
            await this._stateManager.setStateRoot(initialStateRoot);
        }
    }
    async _computeFilterParams(filterParams, isFilter) {
        const latestBlockNumber = await this.getLatestBlockNumber();
        const newFilterParams = Object.assign({}, filterParams);
        if (newFilterParams.fromBlock === filter_1.LATEST_BLOCK) {
            newFilterParams.fromBlock = latestBlockNumber;
        }
        if (!isFilter && newFilterParams.toBlock === filter_1.LATEST_BLOCK) {
            newFilterParams.toBlock = latestBlockNumber;
        }
        if (newFilterParams.toBlock.gt(latestBlockNumber)) {
            newFilterParams.toBlock = latestBlockNumber;
        }
        if (newFilterParams.fromBlock.gt(latestBlockNumber)) {
            newFilterParams.fromBlock = latestBlockNumber;
        }
        return newFilterParams;
    }
    _newDeadline() {
        const dt = new Date();
        dt.setMinutes(dt.getMinutes() + 5); // This will not overflow
        return dt;
    }
    _getNextFilterId() {
        this._lastFilterId = this._lastFilterId.addn(1);
        return this._lastFilterId;
    }
    _filterIdToFiltersKey(filterId) {
        return filterId.toString();
    }
    _emitEthEvent(filterId, result) {
        this.emit("ethEvent", {
            result,
            filterId,
        });
    }
}
exports.HardhatNode = HardhatNode;
//# sourceMappingURL=node.js.map