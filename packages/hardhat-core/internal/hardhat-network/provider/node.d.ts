/// <reference types="node" />
/// <reference types="bn.js" />
import { RunBlockResult } from "@nomiclabs/ethereumjs-vm/dist/runBlock";
import Common from "ethereumjs-common";
import { Transaction } from "ethereumjs-tx";
import { BN, ECDSASignature } from "ethereumjs-util";
import EventEmitter from "events";
import { CompilerInput, CompilerOutput } from "../../../types";
import { MessageTrace } from "../stack-traces/message-trace";
import { CallParams, FilterParams, NodeConfig, TransactionParams } from "./node-types";
import { RpcLogOutput, RpcReceiptOutput } from "./output";
import { Block } from "./types/Block";
export declare const COINBASE_ADDRESS: Buffer;
export declare class HardhatNode extends EventEmitter {
    private readonly _vm;
    private readonly _stateManager;
    private readonly _blockchain;
    private readonly _blockGasLimit;
    private _blockTimeOffsetSeconds;
    static create(config: NodeConfig): Promise<[Common, HardhatNode]>;
    private readonly _localAccounts;
    private readonly _impersonatedAccounts;
    private _nextBlockTimestamp;
    private _lastFilterId;
    private _filters;
    private _nextSnapshotId;
    private readonly _snapshots;
    private readonly _vmTracer;
    private readonly _vmTraceDecoder;
    private readonly _solidityTracer;
    private readonly _consoleLogger;
    private _failedStackTraces;
    private constructor();
    getSignedTransaction(txParams: TransactionParams): Promise<Transaction>;
    _getFakeTransaction(txParams: TransactionParams): Promise<Transaction>;
    runTransactionInNewBlock(tx: Transaction): Promise<{
        trace: MessageTrace | undefined;
        block: Block;
        blockResult: RunBlockResult;
        error?: Error;
        consoleLogMessages: string[];
    }>;
    mineEmptyBlock(timestamp: BN): Promise<RunBlockResult>;
    runCall(call: CallParams, blockNumber: BN | null): Promise<{
        result: Buffer;
        trace: MessageTrace | undefined;
        error?: Error;
        consoleLogMessages: string[];
    }>;
    getAccountBalance(address: Buffer, blockNumber: BN | null): Promise<BN>;
    getAccountNonce(address: Buffer, blockNumber: BN | null): Promise<BN>;
    getLatestBlock(): Promise<Block>;
    getLatestBlockNumber(): Promise<BN>;
    getLocalAccountAddresses(): Promise<string[]>;
    getBlockGasLimit(): Promise<BN>;
    estimateGas(txParams: TransactionParams, blockNumber: BN | null): Promise<{
        estimation: BN;
        trace: MessageTrace | undefined;
        error?: Error;
        consoleLogMessages: string[];
    }>;
    getGasPrice(): Promise<BN>;
    getCoinbaseAddress(): Promise<Buffer>;
    getStorageAt(address: Buffer, slot: BN, blockNumber: BN | null): Promise<Buffer>;
    getBlockByNumber(blockNumber: BN): Promise<Block | undefined>;
    getBlockByHash(blockHash: Buffer): Promise<Block | undefined>;
    getBlockByTransactionHash(hash: Buffer): Promise<Block | undefined>;
    getBlockTotalDifficulty(block: Block): Promise<BN>;
    getCode(address: Buffer, blockNumber: BN | null): Promise<Buffer>;
    setNextBlockTimestamp(timestamp: BN): Promise<void>;
    increaseTime(increment: BN): Promise<void>;
    getTimeIncrement(): Promise<BN>;
    getNextBlockTimestamp(): Promise<BN>;
    getTransaction(hash: Buffer): Promise<Transaction | undefined>;
    getTransactionReceipt(hash: Buffer): Promise<RpcReceiptOutput | undefined>;
    getPendingTransactions(): Promise<Transaction[]>;
    signPersonalMessage(address: Buffer, data: Buffer): Promise<ECDSASignature>;
    signTypedDataV4(address: Buffer, typedData: any): Promise<string>;
    getStackTraceFailuresCount(): Promise<number>;
    takeSnapshot(): Promise<number>;
    revertToSnapshot(id: number): Promise<boolean>;
    newFilter(filterParams: FilterParams, isSubscription: boolean): Promise<BN>;
    newBlockFilter(isSubscription: boolean): Promise<BN>;
    newPendingTransactionFilter(isSubscription: boolean): Promise<BN>;
    uninstallFilter(filterId: BN, subscription: boolean): Promise<boolean>;
    getFilterChanges(filterId: BN): Promise<string[] | RpcLogOutput[] | undefined>;
    getFilterLogs(filterId: BN): Promise<RpcLogOutput[] | undefined>;
    getLogs(filterParams: FilterParams): Promise<RpcLogOutput[]>;
    addCompilationResult(solcVersion: string, compilerInput: CompilerInput, compilerOutput: CompilerOutput): Promise<boolean>;
    addImpersonatedAccount(address: Buffer): true;
    removeImpersonatedAccount(address: Buffer): boolean;
    private _getSnapshotIndex;
    private _initLocalAccounts;
    private _getConsoleLogMessages;
    private _manageErrors;
    private _isContractTooLargeStackTrace;
    private _calculateTimestampAndOffset;
    private _getNextBlockTemplate;
    private _resetNextBlockTimestamp;
    private _notifyPendingTransaction;
    private _getLocalAccountPrivateKey;
    private _addTransactionToBlock;
    private _saveBlockAsSuccessfullyRun;
    private _transactionWasSuccessful;
    private _timestampClashesWithPreviousBlockOne;
    private _increaseBlockTimestamp;
    private _validateTransaction;
    private _runInBlockContext;
    private _setBlockContext;
    private _restoreBlockContext;
    private _correctInitialEstimation;
    private _binarySearchEstimation;
    /**
     * This function runs a transaction and reverts all the modifications that it
     * makes.
     */
    private _runTxAndRevertMutations;
    private _computeFilterParams;
    private _newDeadline;
    private _getNextFilterId;
    private _filterIdToFiltersKey;
    private _emitEthEvent;
}
//# sourceMappingURL=node.d.ts.map