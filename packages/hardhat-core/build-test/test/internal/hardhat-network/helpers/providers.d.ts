/// <reference types="bn.js" />
import { BN } from "ethereumjs-util";
export declare const DEFAULT_HARDFORK = "istanbul";
export declare const DEFAULT_NETWORK_NAME = "TestNet";
export declare const DEFAULT_CHAIN_ID = 123;
export declare const DEFAULT_NETWORK_ID = 234;
export declare const DEFAULT_BLOCK_GAS_LIMIT = 6000000;
export declare const DEFAULT_USE_JSON_RPC = false;
export declare const DEFAULT_ALLOW_UNLIMITED_CONTRACT_SIZE = false;
export declare const DEFAULT_ACCOUNTS: {
    privateKey: string;
    balance: BN;
}[];
export declare const DEFAULT_ACCOUNTS_ADDRESSES: string[];
export declare const DEFAULT_ACCOUNTS_BALANCES: BN[];
export declare const PROVIDERS: {
    name: string;
    isFork: boolean;
    networkId: number;
    chainId: number;
    useProvider: () => void;
}[];
export declare const FORKED_PROVIDERS: Array<{
    rpcProvider: string;
    jsonRpcUrl: string;
    useProvider: () => void;
}>;
//# sourceMappingURL=providers.d.ts.map