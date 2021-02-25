"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthersProviderWrapper = void 0;
// tslint:disable-next-line:no-implicit-dependencies
const ethers_1 = require("ethers");
// This class has been copied from @nomiclabs/hardhat-ethers package to avoid circular dependency
class EthersProviderWrapper extends ethers_1.ethers.providers.JsonRpcProvider {
    constructor(hardhatProvider) {
        super();
        this._hardhatProvider = hardhatProvider;
    }
    async send(method, params) {
        const result = await this._hardhatProvider.send(method, params);
        // We replicate ethers' behavior.
        this.emit("debug", {
            action: "send",
            request: {
                id: 42,
                jsonrpc: "2.0",
                method,
                params,
            },
            response: result,
            provider: this,
        });
        return result;
    }
}
exports.EthersProviderWrapper = EthersProviderWrapper;
//# sourceMappingURL=ethers-provider-wrapper.js.map