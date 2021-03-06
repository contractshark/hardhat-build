"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkStateManager = void 0;
const ethereumjs_account_1 = __importDefault(require("ethereumjs-account"));
const ethereumjs_util_1 = require("ethereumjs-util");
const immutable_1 = require("immutable");
const util_1 = require("util");
const errors_1 = require("../../../core/errors");
const makeAccount_1 = require("../utils/makeAccount");
const Account_1 = require("./Account");
const random_1 = require("./random");
const encodeStorageKey = (address, position) => {
    return `${address.toString("hex")}${ethereumjs_util_1.stripZeros(position).toString("hex")}`;
};
const checkpointedError = (method) => new Error(`${method} called when checkpointed`);
const notCheckpointedError = (method) => new Error(`${method} called when not checkpointed`);
const notSupportedError = (method) => new Error(`${method} is not supported when forking from remote network`);
class ForkStateManager {
    constructor(_jsonRpcClient, _forkBlockNumber, genesisAccounts = []) {
        this._jsonRpcClient = _jsonRpcClient;
        this._forkBlockNumber = _forkBlockNumber;
        this._state = immutable_1.Map();
        this._initialStateRoot = random_1.randomHash();
        this._stateRoot = this._initialStateRoot;
        this._stateRootToState = new Map();
        this._originalStorageCache = new Map();
        this._stateCheckpoints = [];
        this._contextBlockNumber = this._forkBlockNumber.clone();
        this._contextChanged = false;
        this._state = immutable_1.Map();
        this._stateRootToState.set(this._initialStateRoot, this._state);
    }
    async initializeGenesisAccounts(genesisAccounts) {
        const accounts = [];
        const noncesPromises = [];
        for (const ga of genesisAccounts) {
            const account = makeAccount_1.makeAccount(ga);
            accounts.push(account);
            const noncePromise = this._jsonRpcClient.getTransactionCount(account.address, this._forkBlockNumber);
            noncesPromises.push(noncePromise);
        }
        const nonces = await Promise.all(noncesPromises);
        errors_1.assertHardhatInvariant(accounts.length === nonces.length, "Nonces and accounts should have the same length");
        for (const [index, { address, account }] of accounts.entries()) {
            const nonce = nonces[index];
            account.nonce = ethereumjs_util_1.toBuffer(nonce);
            this._putAccount(address, account);
        }
        this._stateRootToState.set(this._initialStateRoot, this._state);
    }
    copy() {
        const fsm = new ForkStateManager(this._jsonRpcClient, this._forkBlockNumber);
        fsm._state = this._state;
        fsm._stateRoot = this._stateRoot;
        // because this map is append-only we don't need to copy it
        fsm._stateRootToState = this._stateRootToState;
        return fsm;
    }
    async getAccount(address) {
        const localAccount = this._state.get(ethereumjs_util_1.bufferToHex(address));
        const localNonce = localAccount === null || localAccount === void 0 ? void 0 : localAccount.get("nonce");
        const localBalance = localAccount === null || localAccount === void 0 ? void 0 : localAccount.get("balance");
        const localCode = localAccount === null || localAccount === void 0 ? void 0 : localAccount.get("code");
        let nonce = localNonce !== undefined ? ethereumjs_util_1.toBuffer(localNonce) : undefined;
        let balance = localBalance !== undefined ? ethereumjs_util_1.toBuffer(localBalance) : undefined;
        let code = localCode !== undefined ? ethereumjs_util_1.toBuffer(localCode) : undefined;
        if (balance === undefined || nonce === undefined || code === undefined) {
            const accountData = await this._jsonRpcClient.getAccountData(address, this._contextBlockNumber);
            if (nonce === undefined) {
                nonce = accountData.transactionCount;
            }
            if (balance === undefined) {
                balance = accountData.balance;
            }
            if (code === undefined) {
                code = accountData.code;
            }
        }
        const codeHash = ethereumjs_util_1.keccak256(code);
        // We ignore stateRoot since we found that it is not used anywhere of interest to us
        return new ethereumjs_account_1.default({ nonce, balance, codeHash });
    }
    async putAccount(address, account) {
        this._putAccount(address, account);
    }
    touchAccount(address) {
        // We don't do anything here. See cleanupTouchedAccounts for explanation
    }
    async putContractCode(address, value) {
        var _a;
        const hexAddress = ethereumjs_util_1.bufferToHex(address);
        const account = ((_a = this._state.get(hexAddress)) !== null && _a !== void 0 ? _a : Account_1.makeAccountState()).set("code", ethereumjs_util_1.bufferToHex(value));
        this._state = this._state.set(hexAddress, account);
    }
    async getContractCode(address) {
        var _a;
        const localCode = (_a = this._state.get(ethereumjs_util_1.bufferToHex(address))) === null || _a === void 0 ? void 0 : _a.get("code");
        if (localCode !== undefined) {
            return ethereumjs_util_1.toBuffer(localCode);
        }
        const accountData = await this._jsonRpcClient.getAccountData(address, this._contextBlockNumber);
        return accountData.code;
    }
    async getContractStorage(address, key) {
        var _a;
        const account = this._state.get(ethereumjs_util_1.bufferToHex(address));
        const contractStorageCleared = (_a = account === null || account === void 0 ? void 0 : account.get("storageCleared")) !== null && _a !== void 0 ? _a : false;
        const localValue = account === null || account === void 0 ? void 0 : account.get("storage").get(ethereumjs_util_1.bufferToHex(key));
        if (localValue !== undefined) {
            return ethereumjs_util_1.toBuffer(localValue);
        }
        const slotCleared = localValue === null;
        if (contractStorageCleared || slotCleared) {
            return ethereumjs_util_1.toBuffer([]);
        }
        const remoteValue = await this._jsonRpcClient.getStorageAt(address, key, this._contextBlockNumber);
        return ethereumjs_util_1.unpad(remoteValue);
    }
    async getOriginalContractStorage(address, key) {
        const storageKey = encodeStorageKey(address, key);
        const cachedValue = this._originalStorageCache.get(storageKey);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        const value = await this.getContractStorage(address, key);
        this._originalStorageCache.set(storageKey, value);
        return value;
    }
    async putContractStorage(address, key, value) {
        var _a;
        const unpaddedValue = ethereumjs_util_1.unpad(value);
        const hexAddress = ethereumjs_util_1.bufferToHex(address);
        let account = (_a = this._state.get(hexAddress)) !== null && _a !== void 0 ? _a : Account_1.makeAccountState();
        const currentStorage = account.get("storage");
        let newValue;
        if (unpaddedValue.length === 0) {
            // if the value is an empty array or only zeros, the storage is deleted
            newValue = null;
        }
        else {
            newValue = ethereumjs_util_1.bufferToHex(unpaddedValue);
        }
        const newStorage = currentStorage.set(ethereumjs_util_1.bufferToHex(key), newValue);
        account = account.set("storage", newStorage);
        this._state = this._state.set(hexAddress, account);
    }
    async clearContractStorage(address) {
        var _a;
        const hexAddress = ethereumjs_util_1.bufferToHex(address);
        let account = (_a = this._state.get(hexAddress)) !== null && _a !== void 0 ? _a : Account_1.makeAccountState();
        account = account
            .set("storageCleared", true)
            .set("storage", immutable_1.Map());
        this._state = this._state.set(hexAddress, account);
    }
    async checkpoint() {
        const stateRoot = await this.getStateRoot();
        this._stateCheckpoints.push(ethereumjs_util_1.bufferToHex(stateRoot));
    }
    async commit() {
        if (this._stateCheckpoints.length === 0) {
            throw notCheckpointedError("commit");
        }
        this._stateCheckpoints.pop();
    }
    async revert() {
        const checkpointedRoot = this._stateCheckpoints.pop();
        if (checkpointedRoot === undefined) {
            throw notCheckpointedError("revert");
        }
        await this.setStateRoot(ethereumjs_util_1.toBuffer(checkpointedRoot));
    }
    async getStateRoot() {
        if (this._stateRootToState.get(this._stateRoot) !== this._state) {
            this._stateRoot = random_1.randomHash();
            this._stateRootToState.set(this._stateRoot, this._state);
        }
        return ethereumjs_util_1.toBuffer(this._stateRoot);
    }
    async setStateRoot(stateRoot) {
        this._setStateRoot(stateRoot);
    }
    async dumpStorage(address) {
        throw notSupportedError("dumpStorage");
    }
    async hasGenesisState() {
        throw notSupportedError("hasGenesisState");
    }
    async generateCanonicalGenesis() {
        throw notSupportedError("generateCanonicalGenesis");
    }
    async generateGenesis(initState) {
        throw notSupportedError("generateGenesis");
    }
    async accountIsEmpty(address) {
        const account = await this.getAccount(address);
        // From https://eips.ethereum.org/EIPS/eip-161
        // An account is considered empty when it has no code and zero nonce and zero balance.
        return (new ethereumjs_util_1.BN(account.nonce).eqn(0) &&
            new ethereumjs_util_1.BN(account.balance).eqn(0) &&
            account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL));
    }
    async cleanupTouchedAccounts() {
        // We do not do anything here, because cleaning accounts only affects the
        // stateRoot. Since the stateRoot is fake anyway there is no need to
        // perform this operation.
    }
    // NOTE: this method is PUBLIC despite the naming convention of hardhat
    _clearOriginalStorageCache() {
        this._originalStorageCache = new Map();
    }
    asStateManager() {
        return {
            copy: () => this.copy().asStateManager(),
            getAccount: util_1.callbackify(this.getAccount.bind(this)),
            putAccount: util_1.callbackify(this.putAccount.bind(this)),
            touchAccount: this.touchAccount.bind(this),
            putContractCode: util_1.callbackify(this.putContractCode.bind(this)),
            getContractCode: util_1.callbackify(this.getContractCode.bind(this)),
            getContractStorage: util_1.callbackify(this.getContractStorage.bind(this)),
            getOriginalContractStorage: util_1.callbackify(this.getOriginalContractStorage.bind(this)),
            putContractStorage: util_1.callbackify(this.putContractStorage.bind(this)),
            clearContractStorage: util_1.callbackify(this.clearContractStorage.bind(this)),
            checkpoint: util_1.callbackify(this.checkpoint.bind(this)),
            commit: util_1.callbackify(this.commit.bind(this)),
            revert: util_1.callbackify(this.revert.bind(this)),
            getStateRoot: util_1.callbackify(this.getStateRoot.bind(this)),
            setStateRoot: util_1.callbackify(this.setStateRoot.bind(this)),
            dumpStorage: util_1.callbackify(this.dumpStorage.bind(this)),
            hasGenesisState: util_1.callbackify(this.hasGenesisState.bind(this)),
            generateCanonicalGenesis: util_1.callbackify(this.generateCanonicalGenesis.bind(this)),
            generateGenesis: util_1.callbackify(this.generateGenesis.bind(this)),
            accountIsEmpty: util_1.callbackify(this.accountIsEmpty.bind(this)),
            cleanupTouchedAccounts: util_1.callbackify(this.cleanupTouchedAccounts.bind(this)),
            _clearOriginalStorageCache: this._clearOriginalStorageCache.bind(this),
        };
    }
    setBlockContext(stateRoot, blockNumber) {
        if (this._stateCheckpoints.length !== 0) {
            throw checkpointedError("setBlockContext");
        }
        if (blockNumber.eq(this._forkBlockNumber)) {
            this._setStateRoot(ethereumjs_util_1.toBuffer(this._initialStateRoot));
            return;
        }
        if (blockNumber.gt(this._forkBlockNumber)) {
            this._setStateRoot(stateRoot);
            return;
        }
        this._contextChanged = true;
        this._state = immutable_1.Map();
        this._stateRoot = ethereumjs_util_1.bufferToHex(stateRoot);
        this._stateRootToState.set(this._stateRoot, this._state);
        this._contextBlockNumber = blockNumber;
        // Note that we don't need to clear the original storage cache here
        // because the VM does it before executing a message anyway.
    }
    restoreForkBlockContext(stateRoot) {
        if (this._stateCheckpoints.length !== 0) {
            throw checkpointedError("restoreForkBlockContext");
        }
        this._setStateRoot(stateRoot);
        if (this._contextChanged) {
            this._contextChanged = false;
            this._contextBlockNumber = this._forkBlockNumber;
        }
    }
    _putAccount(address, account) {
        var _a;
        // Because the vm only ever modifies the nonce, balance and codeHash using this
        // method we ignore the stateRoot property
        const hexAddress = ethereumjs_util_1.bufferToHex(address);
        let localAccount = (_a = this._state.get(hexAddress)) !== null && _a !== void 0 ? _a : Account_1.makeAccountState();
        localAccount = localAccount
            .set("nonce", ethereumjs_util_1.bufferToHex(account.nonce))
            .set("balance", ethereumjs_util_1.bufferToHex(account.balance));
        // Code is set to empty string here to prevent unnecessary
        // JsonRpcClient.getCode calls in getAccount method
        if (account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL)) {
            localAccount = localAccount.set("code", "0x");
        }
        this._state = this._state.set(hexAddress, localAccount);
    }
    _setStateRoot(stateRoot) {
        const newRoot = ethereumjs_util_1.bufferToHex(stateRoot);
        const state = this._stateRootToState.get(newRoot);
        if (state === undefined) {
            throw new Error("Unknown state root");
        }
        this._stateRoot = newRoot;
        this._state = state;
    }
}
exports.ForkStateManager = ForkStateManager;
//# sourceMappingURL=ForkStateManager.js.map