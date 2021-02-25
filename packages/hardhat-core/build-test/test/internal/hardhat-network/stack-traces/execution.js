"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceTransaction = exports.encodeCall = exports.encodeConstructorParams = exports.instantiateVm = void 0;
const ethereumjs_vm_1 = __importDefault(require("@nomiclabs/ethereumjs-vm"));
const ethereumjs_abi_1 = __importDefault(require("ethereumjs-abi"));
const ethereumjs_account_1 = __importDefault(require("ethereumjs-account"));
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const promisify_1 = require("../../../../src/internal/hardhat-network/provider/utils/promisify");
const vm_tracer_1 = require("../../../../src/internal/hardhat-network/stack-traces/vm-tracer");
const senderPrivateKey = Buffer.from("e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109", "hex");
const senderAddress = ethereumjs_util_1.privateToAddress(senderPrivateKey);
async function instantiateVm() {
    const account = new ethereumjs_account_1.default({ balance: 1e18 });
    const vm = new ethereumjs_vm_1.default({ activatePrecompiles: true });
    await promisify_1.promisify(vm.stateManager.putAccount.bind(vm.stateManager))(senderAddress, account);
    return vm;
}
exports.instantiateVm = instantiateVm;
function encodeConstructorParams(contractAbi, params) {
    const fAbi = contractAbi.find((a) => a.type === "constructor");
    if (fAbi === undefined || params.length === 0) {
        return Buffer.from([]);
    }
    const types = fAbi.inputs.map((i) => i.type);
    return ethereumjs_abi_1.default.rawEncode(types, params);
}
exports.encodeConstructorParams = encodeConstructorParams;
function encodeCall(contractAbi, functionName, params) {
    const fAbi = contractAbi.find((a) => a.name === functionName && a.inputs.length === params.length);
    const types = fAbi.inputs.map((i) => i.type);
    const methodId = ethereumjs_abi_1.default.methodID(functionName, types);
    return Buffer.concat([methodId, ethereumjs_abi_1.default.rawEncode(types, params)]);
}
exports.encodeCall = encodeCall;
async function traceTransaction(vm, txData) {
    var _a;
    const tx = new ethereumjs_tx_1.Transaction(Object.assign(Object.assign({ value: 0, gasPrice: 1, nonce: await getNextNonce(vm) }, txData), { 
        // If the test didn't define a gasLimit, we assume 4M is enough
        gasLimit: (_a = txData.gasLimit) !== null && _a !== void 0 ? _a : 4000000 }));
    tx.sign(senderPrivateKey);
    const getContractCode = promisify_1.promisify(vm.stateManager.getContractCode.bind(vm.stateManager));
    const vmTracer = new vm_tracer_1.VMTracer(vm, getContractCode);
    vmTracer.enableTracing();
    try {
        await vm.runTx({ tx });
        const messageTrace = vmTracer.getLastTopLevelMessageTrace();
        if (messageTrace === undefined) {
            const lastError = vmTracer.getLastError();
            throw lastError !== null && lastError !== void 0 ? lastError : new Error("Cannot get last top level message trace");
        }
        return messageTrace;
    }
    finally {
        vmTracer.disableTracing();
    }
}
exports.traceTransaction = traceTransaction;
async function getNextNonce(vm) {
    const acc = await vm.pStateManager.getAccount(senderAddress);
    return acc.nonce;
}
//# sourceMappingURL=execution.js.map