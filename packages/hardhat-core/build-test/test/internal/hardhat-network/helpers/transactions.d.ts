import { TransactionParams } from "../../../../src/internal/hardhat-network/provider/node-types";
import { HardhatNetworkProvider } from "../../../../src/internal/hardhat-network/provider/provider";
import { EthereumProvider } from "../../../../src/types";
export declare function deployContract(provider: EthereumProvider, deploymentCode: string): Promise<any>;
export declare function sendTxToZeroAddress(provider: EthereumProvider, from?: string): Promise<string>;
export declare function sendTransactionFromTxParams(provider: EthereumProvider, txParams: TransactionParams): Promise<any>;
export declare function getSignedTxHash(hardhatNetworkProvider: HardhatNetworkProvider, txParams: TransactionParams, signerAccountIndex: number): Promise<string>;
//# sourceMappingURL=transactions.d.ts.map