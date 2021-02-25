/// <reference types="bn.js" />
import { JsonRpcServer } from "../../../../src/internal/hardhat-network/jsonrpc/server";
import { ForkConfig } from "../../../../src/internal/hardhat-network/provider/node-types";
import { HardhatNetworkProvider } from "../../../../src/internal/hardhat-network/provider/provider";
import { EthereumProvider } from "../../../../src/types";
declare module "mocha" {
    interface Context {
        provider: EthereumProvider;
        hardhatNetworkProvider: HardhatNetworkProvider;
        server?: JsonRpcServer;
    }
}
export declare function useProvider(useJsonRpc?: boolean, forkConfig?: ForkConfig, hardfork?: string, networkName?: string, chainId?: number, networkId?: number, blockGasLimit?: number, accounts?: {
    privateKey: string;
    balance: import("bn.js");
}[], allowUnlimitedContractSize?: boolean): void;
//# sourceMappingURL=useProvider.d.ts.map