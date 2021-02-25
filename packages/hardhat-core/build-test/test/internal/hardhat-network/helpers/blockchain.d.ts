/// <reference types="bn.js" />
import { Transaction } from "ethereumjs-tx";
import { BN } from "ethereumjs-util";
import { RpcLogOutput, RpcReceiptOutput } from "../../../../src/internal/hardhat-network/provider/output";
export declare function createTestTransaction(): Transaction;
export declare function createTestReceipt(transaction: Transaction, logs?: RpcLogOutput[]): RpcReceiptOutput;
export declare function createTestLog(blockNumber: BN | number): RpcLogOutput;
//# sourceMappingURL=blockchain.d.ts.map