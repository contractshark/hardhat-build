import { ethers } from "ethers";
import { EthereumProvider } from "../../../../src/types";
export declare class EthersProviderWrapper extends ethers.providers.JsonRpcProvider {
    private readonly _hardhatProvider;
    constructor(hardhatProvider: EthereumProvider);
    send(method: string, params: any): Promise<any>;
}
//# sourceMappingURL=ethers-provider-wrapper.d.ts.map