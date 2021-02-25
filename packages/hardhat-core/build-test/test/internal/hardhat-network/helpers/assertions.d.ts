/// <reference types="bn.js" />
import { BN } from "ethereumjs-util";
import { RpcTransactionRequestInput } from "../../../../src/internal/hardhat-network/provider/input";
import { TransactionParams } from "../../../../src/internal/hardhat-network/provider/node-types";
import { RpcReceiptOutput, RpcTransactionOutput } from "../../../../src/internal/hardhat-network/provider/output";
import { EthereumProvider } from "../../../../src/types";
export declare function assertHardhatNetworkProviderError(provider: EthereumProvider, method: string, params?: any[], message?: string, code?: number): Promise<void>;
export declare function assertNotSupported(provider: EthereumProvider, method: string): Promise<void>;
export declare function assertInvalidArgumentsError(provider: EthereumProvider, method: string, params?: any[], message?: string): Promise<void>;
export declare function assertInvalidInputError(provider: EthereumProvider, method: string, params?: any[], message?: string): Promise<void>;
export declare function assertQuantity(actual: any, quantity: number | BN, message?: string): void;
export declare function assertNodeBalances(provider: EthereumProvider, expectedBalances: Array<number | BN>): Promise<void>;
export declare function assertTransactionFailure(provider: EthereumProvider, txData: RpcTransactionRequestInput, message?: string, code?: number): Promise<void>;
export declare function assertReceiptMatchesGethOne(actual: any, gethReceipt: RpcReceiptOutput, expectedBlockNumber: number | BN): void;
export declare function assertTransaction(tx: RpcTransactionOutput, txHash: string, txParams: TransactionParams, blockNumber?: number, blockHash?: string, txIndex?: number): void;
export declare function assertLatestBlockNumber(provider: EthereumProvider, latestBlockNumber: number): Promise<void>;
//# sourceMappingURL=assertions.d.ts.map