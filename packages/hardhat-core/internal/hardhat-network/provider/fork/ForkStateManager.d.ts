/// <reference types="bn.js" />
/// <reference types="node" />
import Account from "ethereumjs-account";
import { BN } from "ethereumjs-util";
import { JsonRpcClient } from "../../jsonrpc/client";
import { GenesisAccount } from "../node-types";
import { PStateManager } from "../types/PStateManager";
import { StateManager } from "../types/StateManager";
export declare class ForkStateManager implements PStateManager {
    private readonly _jsonRpcClient;
    private readonly _forkBlockNumber;
    private _state;
    private _initialStateRoot;
    private _stateRoot;
    private _stateRootToState;
    private _originalStorageCache;
    private _stateCheckpoints;
    private _contextBlockNumber;
    private _contextChanged;
    constructor(_jsonRpcClient: JsonRpcClient, _forkBlockNumber: BN, genesisAccounts?: GenesisAccount[]);
    initializeGenesisAccounts(genesisAccounts: GenesisAccount[]): Promise<void>;
    copy(): ForkStateManager;
    getAccount(address: Buffer): Promise<Account>;
    putAccount(address: Buffer, account: Account): Promise<void>;
    touchAccount(address: Buffer): void;
    putContractCode(address: Buffer, value: Buffer): Promise<void>;
    getContractCode(address: Buffer): Promise<Buffer>;
    getContractStorage(address: Buffer, key: Buffer): Promise<Buffer>;
    getOriginalContractStorage(address: Buffer, key: Buffer): Promise<Buffer>;
    putContractStorage(address: Buffer, key: Buffer, value: Buffer): Promise<void>;
    clearContractStorage(address: Buffer): Promise<void>;
    checkpoint(): Promise<void>;
    commit(): Promise<void>;
    revert(): Promise<void>;
    getStateRoot(): Promise<Buffer>;
    setStateRoot(stateRoot: Buffer): Promise<void>;
    dumpStorage(address: Buffer): Promise<Record<string, string>>;
    hasGenesisState(): Promise<boolean>;
    generateCanonicalGenesis(): Promise<void>;
    generateGenesis(initState: any): Promise<void>;
    accountIsEmpty(address: Buffer): Promise<boolean>;
    cleanupTouchedAccounts(): Promise<void>;
    _clearOriginalStorageCache(): void;
    asStateManager(): StateManager;
    setBlockContext(stateRoot: Buffer, blockNumber: BN): void;
    restoreForkBlockContext(stateRoot: Buffer): void;
    private _putAccount;
    private _setStateRoot;
}
//# sourceMappingURL=ForkStateManager.d.ts.map